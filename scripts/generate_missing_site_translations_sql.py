#!/usr/bin/env python3
"""
Skenē fallback TS failus un SQL migrācijas; ģenerē INSERT ... ON CONFLICT
visām (translation_key, locale) kombinācijām, kur trūkst kādas no 7 valodām.

Avots: lib/i18n/fallback-phrases.ts, legal-fallback-phrases.ts, pwa-fallback-phrases.ts

Palaid: python scripts/generate_missing_site_translations_sql.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
LOCALES = ["lv", "en", "fr", "de", "es", "pt", "ru"]
SRC_FILES = [
    ROOT / "lib/i18n/fallback-phrases.ts",
    ROOT / "lib/i18n/legal-fallback-phrases.ts",
    ROOT / "lib/i18n/pwa-fallback-phrases.ts",
]
SQL_DIRS = [
    ROOT / "database/supabase",
    ROOT / "database/translations_daily",
]
OUT = ROOT / "database/translations_daily/2026-05-30-missing-locales.sql"

PAIR_RE = re.compile(
    r"""^\s*(lv|en|fr|de|es|pt|ru)\s*:\s*(['"])((?:\\.|(?!\2).)*)\2\s*,\s*$""",
    re.MULTILINE,
)
SQL_ROW_RE = re.compile(
    r"\(\s*'([^']+)'\s*,\s*'(lv|en|fr|de|es|pt|ru)'\s*,\s*'((?:''|[^'])*)'\s*\)",
    re.IGNORECASE,
)
SQL_ROW_DQ_RE = re.compile(
    r'\(\s*"([^"]+)"\s*,\s*"(lv|en|fr|de|es|pt|ru)"\s*,\s*\'((?:\'\'|[^\'])*)\'\s*\)',
    re.IGNORECASE,
)


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


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def parse_fallback_file(path: pathlib.Path) -> dict[str, dict[str, str]]:
    text = path.read_text(encoding="utf-8")
    m = re.search(
        r"export\s+const\s+\w+\s*=\s*\{([\s\S]*)\}\s*as\s+const",
        text,
    )
    if not m:
        return {}
    blob = m.group(1)
    chunks = re.findall(r'"([a-z0-9_.]+)"\s*:\s*\{([\s\S]*?)\n  \},\s*', blob)
    out: dict[str, dict[str, str]] = {}
    for key, inner in chunks:
        locs: dict[str, str] = {}
        for loc, _, raw in PAIR_RE.findall(inner):
            locs[loc] = ts_unescape(raw)
        if locs:
            out[key] = locs
    return out


def parse_sql_coverage() -> dict[str, set[str]]:
    """Atslēga -> set(locale) no visiem SQL INSERT."""
    coverage: dict[str, set[str]] = {}
    for d in SQL_DIRS:
        if not d.is_dir():
            continue
        for path in sorted(d.glob("*.sql")):
            text = path.read_text(encoding="utf-8")
            if "site_translations" not in text:
                continue
            for m in SQL_ROW_RE.finditer(text):
                key, loc, _ = m.group(1), m.group(2).lower(), m.group(3)
                coverage.setdefault(key, set()).add(loc)
            for m in SQL_ROW_DQ_RE.finditer(text):
                key, loc, _ = m.group(1), m.group(2).lower(), m.group(3)
                coverage.setdefault(key, set()).add(loc)
    return coverage


def main() -> None:
    phrases: dict[str, dict[str, str]] = {}
    for src in SRC_FILES:
        if not src.exists():
            continue
        part = parse_fallback_file(src)
        for k, v in part.items():
            if k in phrases:
                phrases[k].update(v)
            else:
                phrases[k] = dict(v)

    sql_cov = parse_sql_coverage()

    missing_in_fallback: list[tuple[str, str]] = []
    missing_in_sql: list[tuple[str, str, str]] = []
    partial_sql_keys: list[str] = []

    for key, locs in sorted(phrases.items()):
        for loc in LOCALES:
            if loc not in locs or not str(locs[loc]).strip():
                missing_in_fallback.append((key, loc))

    for key in sorted(sql_cov.keys()):
        have = sql_cov[key]
        if have and have < set(LOCALES):
            partial_sql_keys.append(key)
        if key not in phrases:
            continue
        for loc in LOCALES:
            if loc not in have and loc in phrases[key]:
                val = phrases[key][loc].strip()
                if val:
                    missing_in_sql.append((key, loc, phrases[key][loc]))

    # Visi ieraksti: fallback ir pilns (7 valodas), bet SQL migrācijās trūkst locale
    rows: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str]] = set()

    for key, locs in sorted(phrases.items()):
        fb_complete = all(loc in locs and str(locs[loc]).strip() for loc in LOCALES)
        if not fb_complete:
            continue
        have = sql_cov.get(key, set())
        for loc in LOCALES:
            if loc in have:
                continue
            t = (key, loc)
            if t not in seen:
                seen.add(t)
                rows.append((key, loc, locs[loc]))

    rows.sort(key=lambda r: (r[0], LOCALES.index(r[1])))

    report_lines = [
        f"Fallback keys: {len(phrases)}",
        f"Keys with incomplete fallback locales: {len({k for k, _ in missing_in_fallback})}",
        f"Keys with partial SQL (any locale < 7): {len(partial_sql_keys)}",
        f"Rows to upsert: {len(rows)}",
        "",
    ]
    if missing_in_fallback:
        report_lines.append("=== Trūkst fallback-phrases.ts (jālabo TS) ===")
        by_key: dict[str, list[str]] = {}
        for k, loc in missing_in_fallback[:80]:
            by_key.setdefault(k, []).append(loc)
        for k in sorted(by_key)[:40]:
            report_lines.append(f"  {k}: missing {', '.join(by_key[k])}")
        if len(missing_in_fallback) > 80:
            report_lines.append(f"  ... +{len(missing_in_fallback) - 80} more")
        report_lines.append("")

    if partial_sql_keys:
        report_lines.append("=== Daļēji SQL (tikai dažas valodas) ===")
        for k in partial_sql_keys[:60]:
            have = sorted(sql_cov.get(k, set()))
            report_lines.append(f"  {k}: {', '.join(have)}")
        if len(partial_sql_keys) > 60:
            report_lines.append(f"  ... +{len(partial_sql_keys) - 60} more")
        report_lines.append("")

    report = "\n".join(report_lines)
    sys.stdout.buffer.write((report + "\n").encode("utf-8"))

    if not rows:
        print("Nothing to write.", file=sys.stderr)
        sys.exit(0)

    vals = ",\n".join(
        f"  ({sql_quote(k)}, {sql_quote(loc)}, {sql_quote(v)})" for k, loc, v in rows
    )
    sql = f"""-- Aizpilda trūkstošos site_translations ierakstus VISĀM 7 valodām (lv, en, fr, de, es, pt, ru).
-- Avots: lib/i18n/fallback-phrases.ts (+ legal, pwa). Ģenerēts: generate_missing_site_translations_sql.py
-- {len(rows)} rindas, {len({k for k, _, _ in rows})} atslēgas.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{vals}
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
"""
    OUT.write_text(sql, encoding="utf-8")
    print(f"Wrote {OUT} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
