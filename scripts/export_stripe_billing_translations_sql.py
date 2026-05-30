#!/usr/bin/env python3
"""Ģenerē 160_site_translations_stripe_billing.sql ar VISĀM 7 valodām."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from generate_missing_site_translations_sql import (  # noqa: E402
    LOCALES,
    parse_fallback_file,
    sql_quote,
)

PREFIXES = (
    "admin.users.filter_",
    "admin.users.plan_",
    "api.billing.checkout",
    "subscribe.success",
)
EXACT = ("meta.title.app.subscribe_success",)


def main() -> None:
    phrases = parse_fallback_file(ROOT / "lib/i18n/fallback-phrases.ts")
    keys = sorted(
        k
        for k in phrases
        if k in EXACT or any(k.startswith(p) for p in PREFIXES)
    )
    rows: list[tuple[str, str, str]] = []
    for key in keys:
        for loc in LOCALES:
            val = phrases[key].get(loc, "").strip()
            if val:
                rows.append((key, loc, phrases[key][loc]))
    vals = ",\n".join(
        f"  ({sql_quote(k)}, {sql_quote(l)}, {sql_quote(v)})" for k, l, v in rows
    )
    out = ROOT / "database/supabase/160_site_translations_stripe_billing.sql"
    text = f"""-- Stripe norēķini, admin lietotāju filtri, /subscribe/success
-- VISAS valodas: lv, en, fr, de, es, pt, ru (avots: fallback-phrases.ts)

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{vals}
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
"""
    out.write_text(text, encoding="utf-8")
    print(f"wrote {len(rows)} rows -> {out}")


if __name__ == "__main__":
    main()
