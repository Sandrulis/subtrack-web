#!/usr/bin/env python3
"""
Aizpilda FALLBACK_PHRASES / LEGAL_FALLBACK_PHRASES laukus, kur fr/de/es/pt/ru == en (vai trūkst).
Tulko no `en` ar deep-translator. Saglabā {placeholders}.

Palaid: pip install deep-translator && python scripts/fill_missing_fallback_locales.py
Opcijas:
  --dry-run   tikai drukā, neko neraksta
  --file legal|main|both  (noklusējums both)
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
LOCALES = ["lv", "en", "fr", "de", "es", "pt", "ru"]
TARGETS = ["fr", "de", "es", "pt", "ru"]
PAIR_VAL = re.compile(
    r"^\s*(lv|en|fr|de|es|pt|ru)\s*:\s*([\"'])((?:\\.|(?!\2).)*)\2\s*,\s*$",
    re.MULTILINE,
)
PLACEHOLDER_RE = re.compile(r"\{[^}]*\}")
# Atslēgas / teksti, kur angļu teksts apzināti vienāds visās valodās
SKIP_SAME_AS_EN = {
    "nav.pro_badge",
    "nav.faq_nav",
    "admin.email_design.template.magic_link",
    "admin.email_design.template.reauthentication",
    "landing.mock.pill_subscription",
}

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("Run: pip install deep-translator", file=sys.stderr)
    raise


def ts_unescape(raw: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(raw):
        if raw[i] == "\\" and i + 1 < len(raw):
            n = raw[i + 1]
            if n in '"\'\\':
                out.append(n)
                i += 2
                continue
            if n == "n":
                out.append("\n")
                i += 2
                continue
        out.append(raw[i])
        i += 1
    return "".join(out)


def ts_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def mask_braces(s: str) -> tuple[str, dict[str, str]]:
    marks: dict[str, str] = {}

    def sub(m: re.Match[str]) -> str:
        key = f"__SUBTRK_{len(marks)}__"
        marks[key] = m.group(0)
        return key

    return PLACEHOLDER_RE.sub(sub, s), marks


def unmask(t: str, marks: dict[str, str]) -> str:
    for k, v in marks.items():
        t = t.replace(k, v)
    return t


def translate_one(translator: GoogleTranslator, text: str) -> str:
    if not text.strip():
        return text
    masked, marks = mask_braces(text)
    try:
        out = translator.translate(masked)
    except Exception as e:
        print(f"  translate error: {e!r}", file=sys.stderr)
        return text
    if not out:
        return text
    return unmask(out, marks)


def parse_entries(text: str) -> tuple[str, str, str, list[tuple[str, str, str]]]:
    m = re.search(
        r"(export\s+const\s+\w+\s*=\s*\{)([\s\S]*)(\}\s*as\s+const)",
        text,
    )
    if not m:
        raise SystemExit("export const ... block not found")
    pre, blob, post = m.group(1), m.group(2), m.group(3)
    chunks = re.findall(
        r'("[a-z0-9_.]+"\s*:\s*\{)([\s\S]*?)(\n  \},\s*)',
        blob,
    )
    return pre, blob, post, chunks


def process_file(path: pathlib.Path, dry_run: bool) -> int:
    text = path.read_text(encoding="utf-8")
    pre, blob, post, chunks = parse_entries(text)
    translators = {loc: GoogleTranslator(source="en", target=loc) for loc in TARGETS}
    rebuilt = blob
    updated = 0

    for key_open, inner, closing in chunks:
        key = re.search(r'"([a-z0-9_.]+)"', key_open)
        key_name = key.group(1) if key else ""
        locs = {loc: ts_unescape(val) for loc, _, val in PAIR_VAL.findall(inner)}
        en = locs.get("en", "").strip()
        if not en or key_name in SKIP_SAME_AS_EN:
            continue

        inner2 = inner
        changed = False
        for loc in TARGETS:
            cur = locs.get(loc, "").strip()
            if cur and cur != en:
                continue
            tr = translate_one(translators[loc], en)
            if tr == en:
                continue
            escaped = ts_escape(tr)
            if loc in locs:
                inner2, n = re.subn(
                    rf"(\n\s*{loc}:\s*)([\"'])((?:\\.|(?!\2).)*)\2(\s*,)",
                    rf'\1"{escaped}"\4',
                    inner2,
                    count=1,
                    flags=re.MULTILINE,
                )
            else:
                inner2 = inner2.rstrip() + f'\n    {loc}: "{escaped}",'
                n = 1
            if n:
                changed = True
                locs[loc] = tr
                time.sleep(0.1)

        if changed:
            old_fragment = key_open + inner + closing
            new_fragment = key_open + inner2 + closing
            if old_fragment not in rebuilt:
                print(f"skip fragment mismatch: {key_name}", file=sys.stderr)
                continue
            rebuilt = rebuilt.replace(old_fragment, new_fragment, 1)
            updated += 1
            print(f"  {key_name}")

    if updated and not dry_run:
        path.write_text(pre + rebuilt + post, encoding="utf-8")
    print(f"{path.name}: updated {updated} keys")
    return updated


def add_btn_save(path: pathlib.Path, dry_run: bool) -> None:
    text = path.read_text(encoding="utf-8")
    if '"fs.dashboard.btn_save"' in text:
        return
    anchor = '"fs.dashboard.btn_cancel":'
    if anchor not in text:
        print("btn_save anchor not found", file=sys.stderr)
        return
    block = """
  "fs.dashboard.btn_save": {
    lv: "Saglabāt",
    en: "Save",
    fr: "Enregistrer",
    de: "Speichern",
    es: "Guardar",
    pt: "Guardar",
    ru: "Сохранить",
  },
"""
    if not dry_run:
        text = text.replace(anchor, block + "  " + anchor, 1)
        path.write_text(text, encoding="utf-8")
    print("added fs.dashboard.btn_save")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--file", choices=["legal", "main", "both"], default="both")
    args = ap.parse_args()

    files: list[pathlib.Path] = []
    if args.file in ("legal", "both"):
        files.append(ROOT / "lib/i18n/legal-fallback-phrases.ts")
    if args.file in ("main", "both"):
        files.append(ROOT / "lib/i18n/fallback-phrases.ts")

    total = 0
    for f in files:
        total += process_file(f, args.dry_run)
    if args.file in ("main", "both"):
        add_btn_save(ROOT / "lib/i18n/fallback-phrases.ts", args.dry_run)
    print(f"done, total keys touched: {total}")


if __name__ == "__main__":
    main()
