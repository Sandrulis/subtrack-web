#!/usr/bin/env python3
"""Izvada subscribe/checkout SQL ar 7 valodām (stdout vai daily papildinājumam)."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from generate_missing_site_translations_sql import LOCALES, parse_fallback_file, sql_quote  # noqa: E402

PREFIXES = (
    "subscribe.purchase",
    "subscribe.checkout",
    "subscribe.price.",
    "api.billing.checkout",
)


def main() -> None:
    phrases = parse_fallback_file(ROOT / "lib/i18n/fallback-phrases.ts")
    keys = sorted(k for k in phrases if any(k.startswith(p) for p in PREFIXES))
    rows: list[tuple[str, str, str]] = []
    for key in keys:
        for loc in LOCALES:
            val = phrases[key].get(loc, "").strip()
            if val:
                rows.append((key, loc, phrases[key][loc]))
    vals = ",\n".join(
        f"  ({sql_quote(k)}, {sql_quote(l)}, {sql_quote(v)})" for k, l, v in rows
    )
    text = f"""-- subscribe/checkout: {len(rows)} rindas, 7 valodas (lv, en, fr, de, es, pt, ru)

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{vals}
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
"""
    out = ROOT / "database/translations_daily/_subscribe_7loc.sql"
    out.write_text(text, encoding="utf-8")
    print(f"wrote {len(rows)} rows -> {out}")


if __name__ == "__main__":
    main()
