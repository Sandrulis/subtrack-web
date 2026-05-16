#!/usr/bin/env python3
"""
Aizpilda FALLBACK_PHRASES `ru:` laukas ar Google EN→RU tulkojumu (fallback no `en`).
Palaid: python scripts/translate_fallback_ru.py
Prasa: pip install deep-translator
"""

from __future__ import annotations

import pathlib
import re
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "i18n" / "fallback-phrases.ts"

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("Run: pip install deep-translator", file=sys.stderr)
    raise

PLACEHOLDER_RE = re.compile(r"\{[^}]*\}")


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


def extract_en(inner: str) -> str | None:
    m = re.search(r'^\s*en:\s*"((?:\\.|[^"\\])*)"\s*,', inner, re.MULTILINE)
    if m:
        return ts_unescape(m.group(1))
    m = re.search(r"^\s*en:\s*'((?:\\.|[^'\\])*)'\s*,", inner, re.MULTILINE)
    if m:
        return ts_unescape(m.group(1))
    return None


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
    if text == "":
        return ""
    masked, marks = mask_braces(text)
    try:
        out = translator.translate(masked)
    except Exception as e:
        print(f"translate error, returning en: {e!r}", file=sys.stderr)
        return text
    if not out or not isinstance(out, str):
        return text
    return unmask(out, marks)


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    m = re.search(
        r"(export\s+const\s+FALLBACK_PHRASES\s*=\s*\{)([\s\S]*)(\}\s*as\s+const)",
        text,
    )
    if not m:
        sys.exit("FALLBACK_PHRASES block not found")
    pre, blob, post = m.group(1), m.group(2), m.group(3)

    chunks = re.findall(
        r'("[a-z0-9_.]+"\s*:\s*\{)([\s\S]*?)(\n  \},\s*)',
        blob,
    )

    translator = GoogleTranslator(source="en", target="ru")
    updated_blocks = 0
    rebuilt = blob

    for key_open, inner, closing in chunks:
        en = extract_en(inner)
        if en is None:
            print(f"skip (no en): {key_open[:50]}", file=sys.stderr)
            continue

        ru_text = translate_one(translator, en)
        ru_escaped = ts_escape(ru_text)

        inner2, n = re.subn(
            r'(\n\s*ru:\s*)"((?:\\.|[^"\\])*)"',
            rf'\1"{ru_escaped}"',
            inner,
            count=1,
            flags=re.MULTILINE,
        )
        if n == 0:
            print(f"skip (no ru line): {key_open[:50]}", file=sys.stderr)
            continue

        old_fragment = key_open + inner + closing
        new_fragment = key_open + inner2 + closing
        if old_fragment not in rebuilt:
            print(f"fragment not found for {key_open[:40]}", file=sys.stderr)
            continue
        rebuilt = rebuilt.replace(old_fragment, new_fragment, 1)
        updated_blocks += 1
        time.sleep(0.12)

    SRC.write_text(pre + rebuilt + post, encoding="utf-8")
    print(f"updated ru on {updated_blocks} blocks -> {SRC}")


if __name__ == "__main__":
    main()