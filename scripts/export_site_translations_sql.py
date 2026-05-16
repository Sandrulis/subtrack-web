#!/usr/bin/env python3
"""
Parsē lib/i18n/fallback-phrases.ts (FALLBACK_PHRASES objektu) un ieraksta
database/supabase/013_site_translations_seed_subtrack_ui.sql INSERT ... ON CONFLICT.

Palaiž: python scripts/export_site_translations_sql.py
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "i18n" / "fallback-phrases.ts"
DST = ROOT / "database" / "supabase" / "013_site_translations_seed_subtrack_ui.sql"

PAIR_RE = re.compile(
    r'^\s*(lv|en|fr|de|es|pt|ru)\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*$',
    re.MULTILINE,
)


def ts_unescape(raw: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(raw):
        if raw[i] == "\\" and i + 1 < len(raw):
            n = raw[i + 1]
            if n in '"\\':
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


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def extract_object_blob(text: str) -> str:
    m = re.search(
        r"export\s+const\s+FALLBACK_PHRASES\s*=\s*\{([\s\S]*)\}\s*as\s+const",
        text,
    )
    if not m:
        raise SystemExit("Neizdevās atrast FALLBACK_PHRASES blokā fallback-phrases.ts")
    return m.group(1)


def split_entries(blob: str) -> list[tuple[str, str]]:
    chunks = re.findall(
        r'"([a-z0-9_.]+)"\s*:\s*\{([\s\S]*?)\n  \},\s*',
        blob,
    )
    return [(k.strip(), inner) for k, inner in chunks]


def locale_pairs(inner: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for loc, raw in PAIR_RE.findall(inner):
        out[loc] = ts_unescape(raw)
    return out


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    blob = extract_object_blob(text)
    entries = split_entries(blob)

    vals: list[str] = []
    for key, inner in entries:
        locs = locale_pairs(inner)
        for lc, vl in sorted(locs.items()):
            vals.append(
                f"({sql_quote(key)}, {sql_quote(lc)}, {sql_quote(vl)})",
            )

    body = ",\n  ".join(vals)

    hdr = """-- Sagatavots ar scripts/export_site_translations_sql.py no lib/i18n/fallback-phrases.ts
-- Pēc imports atsvaidziniet Next kešu tulkošanās Server Action (tags site-translations-public).

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
"""

    ftr = """
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value,
    updated_at = now();

"""

    DST.write_text(hdr + "  " + body + "\n" + ftr, encoding="utf-8")

    sys.stderr.write(
        f"wrote {len(entries)} keys, {len(vals)} locale rows → {DST}\n",
    )


if __name__ == "__main__":
    main()
