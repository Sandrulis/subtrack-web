#!/usr/bin/env python3
"""Generate lib/i18n/legal-fallback-phrases.ts and database/supabase/049_*.sql"""

from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
TS_OUT = ROOT / "lib" / "i18n" / "legal-fallback-phrases.ts"
SQL_OUT = ROOT / "database" / "supabase" / "049_site_translations_legal.sql"

LOCALES = ("lv", "en", "fr", "de", "es", "pt", "ru")


def loc(lv: str, en: str) -> dict[str, str]:
    return {code: en if code != "lv" else lv for code in LOCALES}


def esc_sql(s: str) -> str:
    return s.replace("'", "''")


def esc_ts(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


keys: dict[str, dict[str, str]] = {}

keys["legal.footer.nav_aria"] = loc("Juridiskā informācija", "Legal information")
keys["legal.footer.terms"] = loc("Noteikumi", "Terms")
keys["legal.footer.privacy"] = loc("Privātums", "Privacy")
keys["legal.footer.cookies"] = loc("Sīkdatnes", "Cookies")
keys["legal.footer.cookie_settings"] = loc("Sīkdatņu iestatījumi", "Cookie settings")
keys["legal.back_home"] = loc("Atpakaļ uz sākumu", "Back to home")
keys["meta.title.legal.terms"] = loc("Lietošanas noteikumi", "Terms of service")
keys["meta.title.legal.privacy"] = loc("Privātuma politika", "Privacy policy")
keys["meta.title.legal.cookies"] = loc("Sīkdatņu politika", "Cookie policy")

keys["legal.cookie.banner.aria"] = loc("Sīkdatņu piekrišana", "Cookie consent")
keys["legal.cookie.banner.title"] = loc("Mēs izmantojam sīkdatnes", "We use cookies")
keys["legal.cookie.banner.lead"] = loc(
    "Nepieciešamās sīkdatnes nodrošina drošu pieteikšanos. Funkcionālās saglabā valodas izvēli. Detalizēti:",
    "Necessary cookies keep sign-in secure. Functional cookies remember your language. Learn more:",
)
keys["legal.cookie.banner.reject_optional"] = loc("Tikai nepieciešamās", "Necessary only")
keys["legal.cookie.banner.customize"] = loc("Pielāgot", "Customize")
keys["legal.cookie.banner.accept_all"] = loc("Pieņemt visas", "Accept all")
keys["legal.cookie.modal.title"] = loc("Sīkdatņu iestatījumi", "Cookie settings")
keys["legal.cookie.modal.lead"] = loc(
    "Izvēlies, kuras neobligātās sīkdatnes atļaut.",
    "Choose which optional cookies to allow.",
)
keys["legal.cookie.modal.close_aria"] = loc("Aizvērt", "Close")
keys["legal.cookie.modal.always_on"] = loc("Vienmēr ieslēgts", "Always on")
keys["legal.cookie.modal.save"] = loc("Saglabāt", "Save")
keys["legal.cookie.modal.cancel"] = loc("Atcelt", "Cancel")
keys["legal.cookie.modal.policy_link"] = loc("Pilna sīkdatņu politika", "Full cookie policy")
keys["legal.cookie.category.necessary.title"] = loc("Nepieciešamās", "Necessary")
keys["legal.cookie.category.necessary.desc"] = loc(
    "Sesijas un drošības sīkdatnes, bez kurām pakalpojums nedarbojas.",
    "Session and security cookies required for the service to work.",
)
keys["legal.cookie.category.functional.title"] = loc("Funkcionālās", "Functional")
keys["legal.cookie.category.functional.desc"] = loc(
    "Atceras saskarnes valodu (piem., subtrack_ui_locale).",
    "Remembers interface language (e.g. subtrack_ui_locale).",
)
keys["legal.cookie.category.analytics.title"] = loc("Analītikas", "Analytics")
keys["legal.cookie.category.analytics.desc"] = loc(
    "Palīdz uzlabot produktu, apkopojot anonīmu lietošanas statistiku (ja ieslēgts).",
    "Helps improve the product with anonymous usage statistics (when enabled).",
)

keys["legal.terms.page_title"] = loc("Lietošanas noteikumi", "Terms of service")
keys["legal.terms.updated"] = loc(
    "Pēdējoreiz atjaunināts: 2026. gada 18. maijs",
    "Last updated: 18 May 2026",
)
terms_sections = [
    (
        "Vispārīgi",
        "General",
        "Šie noteikumi regulē {SYSTEM_NAME} lietošanu. Pakalpojumu sniedz SubTrack. Reģistrējoties vai lietojot vietni, jūs piekrītat šiem noteikumiem.",
        "These terms govern your use of {SYSTEM_NAME}. By registering or using the site you agree to these terms.",
    ),
    (
        "Pakalpojums",
        "The service",
        "{SYSTEM_NAME} ļauj pārvaldīt abonementus un periodiskos maksājumus. Funkcijas var mainīties, lai uzlabotu drošību un lietojamību.",
        "{SYSTEM_NAME} helps you manage subscriptions and recurring payments. Features may change to improve security and usability.",
    ),
    (
        "Konts",
        "Account",
        "Jūs esat atbildīgs par konta datu precizitāti un paroles drošību. Nedodiet piekļuvi trešajām personām. Aizdomīgu aktivitāti ziņojiet mums.",
        "You are responsible for accurate account data and password security. Do not share access. Report suspicious activity to us.",
    ),
    (
        "Pieļaujamā lietošana",
        "Acceptable use",
        "Aizliegts traucēt pakalpojuma darbību, mēģināt iekļūt citu kontos vai izmantot sistēmu prettiesiski.",
        "You must not disrupt the service, access other accounts, or misuse the system unlawfully.",
    ),
    (
        "Atbildības ierobežojums",
        "Liability",
        "Pakalpojums tiek sniegts „kā ir”. Mēs neesam atbildīgi par netiešiem zaudējumiem, kas radušies no lietošanas vai datu zuduma ārpus mūsu kontroles.",
        "The service is provided as is. We are not liable for indirect losses from use or data loss beyond our control.",
    ),
    (
        "Izmaiņas",
        "Changes",
        "Noteikumus varam atjaunināt. Turpinot lietot pakalpojumu pēc publicēšanas, jūs piekrītat jaunajai redakcijai.",
        "We may update these terms. Continued use after publication means you accept the new version.",
    ),
]
for i, (lv_t, en_t, lv_b, en_b) in enumerate(terms_sections, 1):
    keys[f"legal.terms.s{i}.title"] = loc(lv_t, en_t)
    keys[f"legal.terms.s{i}.body"] = loc(lv_b, en_b)

keys["legal.privacy.page_title"] = loc("Privātuma politika", "Privacy policy")
keys["legal.privacy.updated"] = keys["legal.terms.updated"]
privacy_sections = [
    (
        "Pārzinis",
        "Controller",
        "Personas datu pārzinis ir SubTrack. Jautājumiem par privātumu rakstiet uz kontaktu, kas norādīts vietnē.",
        "SubTrack is the data controller. For privacy questions use the contact shown on the site.",
    ),
    (
        "Kādi dati",
        "What we collect",
        "Apstrādājam konta e-pastu, vārdu, paroles hash, abonementu ierakstus, iestatījumus un tehniskos žurnālus drošībai.",
        "We process account email, name, password hash, subscription records, preferences and technical logs for security.",
    ),
    (
        "Mērķis",
        "Purpose",
        "Dati nepieciešami autentifikācijai, pakalpojuma sniegšanai, atbalstam un juridisko pienākumu izpildei.",
        "Data is used for authentication, providing the service, support and legal compliance.",
    ),
    (
        "Glabāšana",
        "Storage",
        "Dati glabājas aizsargātā mākoņa vidē (Supabase). Piekļuve ierobežota ar RLS un sesijas autentifikāciju.",
        "Data is stored in a secured cloud environment (Supabase) with RLS and session authentication.",
    ),
    (
        "Jūsu tiesības",
        "Your rights",
        "Varat pieprasīt piekļuvi, labošanu vai dzēšanu saskaņā ar piemērojamiem tiesību aktiem, sazinoties ar mums.",
        "You may request access, correction or erasure under applicable law by contacting us.",
    ),
    (
        "Kontakti",
        "Contact",
        "Privātuma pieprasījumus nosūtiet, izmantojot administrācijā norādīto kontaktinformāciju.",
        "Send privacy requests using the contact information provided in administration.",
    ),
]
for i, (lv_t, en_t, lv_b, en_b) in enumerate(privacy_sections, 1):
    keys[f"legal.privacy.s{i}.title"] = loc(lv_t, en_t)
    keys[f"legal.privacy.s{i}.body"] = loc(lv_b, en_b)

keys["legal.cookies.page_title"] = loc("Sīkdatņu politika", "Cookie policy")
keys["legal.cookies.updated"] = keys["legal.terms.updated"]
cookie_sections = [
    (
        "Kas ir sīkdatnes",
        "What are cookies",
        "Sīkdatnes ir mazi faili pārlūkā, kas palīdz atcerēties iestatījumus vai nodrošināt drošu sesiju.",
        "Cookies are small browser files that remember settings or keep sessions secure.",
    ),
    (
        "Kuras izmantojam",
        "Which we use",
        "Nepieciešamās: autentifikācijas sesija. Funkcionālās: UI valoda (subtrack_ui_locale). Analītikas: tikai ar jūsu piekrišanu, ja ieslēgtas.",
        "Necessary: auth session. Functional: UI language (subtrack_ui_locale). Analytics: only with consent when enabled.",
    ),
    (
        "Pārvaldība",
        "Managing cookies",
        'Pirmā apmeklējuma laikā varat izvēlēties kategorijas. Vēlāk – saite „Sīkdatņu iestatījumi” kājenē.',
        "On first visit you can choose categories. Later use Cookie settings in the footer.",
    ),
    (
        "Atjauninājumi",
        "Updates",
        "Politiku varam mainīt. Spēkā esošā redakcija publicēta šajā lapā ar datumu.",
        "We may update this policy. The current version is published on this page with a date.",
    ),
]
for i, (lv_t, en_t, lv_b, en_b) in enumerate(cookie_sections, 1):
    keys[f"legal.cookies.s{i}.title"] = loc(lv_t, en_t)
    keys[f"legal.cookies.s{i}.body"] = loc(lv_b, en_b)


def write_ts() -> None:
    lines = [
        "/** Legal / cookie consent UI and document copy (merged into FALLBACK_PHRASES). */",
        "export const LEGAL_FALLBACK_PHRASES = {",
    ]
    for k, v in keys.items():
        lines.append(f'  "{k}": {{')
        for lang in LOCALES:
            lines.append(f'    {lang}: "{esc_ts(v[lang])}",')
        lines.append("  },")
    lines.append("} as const;")
    lines.append("")
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")


def write_sql() -> None:
    rows: list[str] = []
    for k, v in keys.items():
        for lang in LOCALES:
            rows.append(f"  ('{esc_sql(k)}', '{lang}', '{esc_sql(v[lang])}')")
    body = ",\n".join(rows)
    sql = f"""-- Legal pages, footer links, cookie consent UI ({len(keys)} keys).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
{body}
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
"""
    SQL_OUT.write_text(sql, encoding="utf-8")


def main() -> None:
    write_ts()
    write_sql()
    print(f"Wrote {TS_OUT} ({len(keys)} keys)")
    print(f"Wrote {SQL_OUT}")


if __name__ == "__main__":
    main()
