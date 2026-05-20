#!/usr/bin/env python3
"""
Ģenerē migrācijas SQL tikai norādītajām atslēgām no fallback-phrases.ts.
Lietošana: python scripts/export_changed_keys_sql.py > database/supabase/058_....sql
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "i18n" / "fallback-phrases.ts"

# Atslēgas, kas šajā sesijā tika labotas (fill script + btn_save)
KEYS = [
    "fs.dashboard.btn_save",
    "nav.admin",
    "mobile.aria.demo",
    "mobile.aria.faq",
    "admin.sidebar.title",
    "meta.title.app.subscribe",
    "demo.nav.badge",
    "subscription.category.leasing",
    "admin.users.col_pro",
    "admin.users.col_vip",
    "admin.users.pro_status_vip",
    "auth.login.password_placeholder",
    "landing.mock.pill_leasing",
    "landing.explore.dashboard.title",
    "landing.faq.label",
    "admin.translations_panel.aria_actions",
    "admin.integrations_panel.load_error_hint_code",
    "admin.integrations_panel.aria_actions",
    "admin.languages_panel.load_error_suffix",
    "admin.languages_panel.label_ui_name",
    "admin.languages_panel.aria_actions",
    "settings.currency_eur_label",
    "settings.currency_sek_label",
    "settings.currency_pln_label",
    "settings.currency_chf_label",
    "settings.tz_europe_warsaw",
    "settings.tz_europe_london",
    "settings.tz_utc",
    "settings.tz_america_new_york",
]
# admin.email_design.* – visi atslēgas ar šo prefiksu
EMAIL_PREFIX = "admin.email_design."

PAIR_RE = re.compile(
    r"""^\s*(lv|en|fr|de|es|pt|ru)\s*:\s*(['"])((?:\\.|(?!\2).)*)\2\s*,\s*$""",
    re.MULTILINE,
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


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    m = re.search(
        r"export\s+const\s+FALLBACK_PHRASES\s*=\s*\{([\s\S]*)\}\s*as\s+const",
        text,
    )
    if not m:
        sys.exit(1)
    blob = m.group(1)
    chunks = re.findall(r'"([a-z0-9_.]+)"\s*:\s*\{([\s\S]*?)\n  \},\s*', blob)
    want = set(KEYS)
    want.update(k for k, _ in chunks if k.startswith(EMAIL_PREFIX))
    vals: list[str] = []
    for key, inner in chunks:
        if key not in want:
            continue
        for loc, _, raw in PAIR_RE.findall(inner):
            vals.append(
                f"  ({sql_quote(key)}, {sql_quote(loc)}, {sql_quote(ts_unescape(raw))})"
            )
    if not vals:
        sys.exit("no rows")
    body = ",\n".join(vals)
    out = f"""-- Aizpildīti tulkojumi (app UI, admin e-pasts, fs.dashboard.btn_save) – 2026-05-20
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{body}
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
"""
    dst = ROOT / "database" / "supabase" / "059_site_translations_i18n_gaps.sql"
    dst.write_text(out, encoding="utf-8")
    print(f"wrote {len(vals)} rows ({len(want)} keys) -> {dst}")


if __name__ == "__main__":
    main()
