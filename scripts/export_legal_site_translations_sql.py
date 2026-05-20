#!/usr/bin/env python3
"""Eksportē legal-fallback-phrases.ts → database/supabase/049_site_translations_legal.sql"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "i18n" / "legal-fallback-phrases.ts"
DST = ROOT / "database" / "supabase" / "049_site_translations_legal.sql"

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


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    m = re.search(
        r"export\s+const\s+LEGAL_FALLBACK_PHRASES\s*=\s*\{([\s\S]*)\}\s*as\s+const",
        text,
    )
    if not m:
        sys.exit("LEGAL_FALLBACK_PHRASES not found")
    blob = m.group(1)
    chunks = re.findall(r'"([a-z0-9_.]+)"\s*:\s*\{([\s\S]*?)\n  \},\s*', blob)
    vals: list[str] = []
    for key, inner in chunks:
        for loc, raw in PAIR_RE.findall(inner):
            vals.append(f"  ({sql_quote(key)}, {sql_quote(loc)}, {sql_quote(ts_unescape(raw))})")
    body = ",\n".join(vals)
    sql = f"""-- Legal pages, footer, cookie consent ({len(chunks)} keys).
-- Sagatavots ar scripts/export_legal_site_translations_sql.py

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{body}
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
"""
    DST.write_text(sql, encoding="utf-8")
    print(f"wrote {len(chunks)} keys, {len(vals)} rows -> {DST}")


if __name__ == "__main__":
    main()
