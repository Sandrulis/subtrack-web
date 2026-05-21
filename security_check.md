# Drošības pārskats - SubTrack (subtrack-web)



Datums: 2026-05-21 (LOW sesija).



**Pēdējā sesija:** **L1** (audit CI + iknedēļas schedule, Dependabot github-actions) un **L2** (statiska regresija, PR veidne, Cursor rule, dokumentācija).



---



## Kopsvilnis



| Joma | Piezīme |

|------|--------|

| Maršruti / admin | `proxy.ts`, `requireAdminUser`, RLS **015** / **078** (e-pasta šabloni atsevišķi) |

| LOW automatizācija | `npm run security:regression-check`, `npm run security:check` |

| CI | `security-audit.yml` (L2 + audit), `security-smoke.yml` |



---



## Vērtējums (1-10)



| Situācija | Atzīme |

|-----------|-------:|

| Repo + **078** DB + smoke OK + deploy | **~8,8 – 9,2** |

| Repo bez 078 / smoke | **~8,5 – 8,7** |



**Pret ~10 (ne LOW):** CDN/Redis rate limit, pilns CSP `script-src`, signup enumerācijas UX.



---



## HIGH / MEDIUM



| Grupa | Status |

|-------|--------|

| H1–H3, M1–M3, M-NEW-1 | **Repo DONE**; DB: **078** (+ **076** aizstāts) + smoke |



---



## LOW



| # | Pasākums | Status |

|---|----------|--------|

| **L1** | `npm audit --audit-level=high`, Dependabot (npm + github-actions), CI push/PR + **iknedēļas** schedule | **DONE** |

| **L2** | Regresijas checklist README / PR / Cursor; statiska pārbaude | **DONE:** `scripts/security-regression-check.mjs`, `.github/pull_request_template.md`, `.cursor/rules/subtrack-security-l2.mdc` |

| **L2 FS** | `innerHTML` – brīdinājumi regresijas skriptā | **DONE** (warnings) |

| **Dok.** | `is-admin.ts` komentārs; logo kļūdas teksts (bez service_role) | **DONE** + SQL **077** |



### L2 checklist (jauna funkcija)



1. RLS **`WITH CHECK`** privileged kolonnām (kā **015**)

2. Server Actions: **`requireAdminUser`**

3. API: **`getUser()`** + **`user_id`** / admin RPC

4. E-pasta šabloni: **`system_settings_email_templates`**, ne kolonna uz **`system_settings`**

5. Palaid: **`npm run security:check`**



### Family sharing (`/family-sharing`, `084`–`091`) – pārbaude 2026-05-21



| L2 punkts | Status | Piezīme |

|-----------|--------|---------|

| 1. RLS `WITH CHECK` | **OK** | `092`: owner UPDATE sadalīts (pending/active meta, revoke); trigger `family_sharing_links_guard_update` bloķē `pending`→`active` bez partnera, `partner_user_id`/`invite_email` maiņu, owner→`partner_tint_color`. Partner (088/087/090), accept (089). **`subscriptions`**: SELECT tikai `active` (086). |

| 2. Server Actions `requireAdminUser` | **N/A** | Nav admin Server Actions; integrācija tikai admin panelī (`integrations`). |

| 3. API `getUser()` + autorizācija | **OK** | `GET`/`POST` `app/api/family-sharing/route.ts`, `PATCH` `[id]/route.ts` – `requireSessionUser()` + `getUser()`. `PATCH`: UUID validācija, loma (owner/partner), pending/active; accept/decline/leave/revoke ar papildu pārbaudēm pirms `service_role` UPDATE. `POST` INSERT ar sesijas klientu (`owner_user_id` no sesijas). Brīdinājums regresijas skriptā par `user_id` – paredzēts (entitāte `family_sharing_links`, ne `subscriptions`). |

| 4. E-pasta šabloni | **N/A** | Nav `system_settings.email_templates`. |

| 5. Middleware / maršruts | **LABOTS** | Bija tikai lapas `redirect` uz login; **`/family-sharing`** pievienots `PROTECTED_PREFIXES` (`lib/supabase/middleware.ts`). Integrācija izslēgta → `redirect /dashboard` (lapa). |

| 6. `service_role` | **OK (serverī)** | Tikai `lookupUserIdByEmail` (POST), state `PATCH` (accept/decline/revoke/leave). Nav `NEXT_PUBLIC_`, nav client komponentēs. |

| 7. Datu noplūde / enumerācija | **OK** | Kopīgie `subscriptions` tikai caur RLS + read-only fetch. POST uzaicinājumam: **`family_sharing.err_invite_failed`** (400), ne `404` / `err_not_found` – neatsklāj, vai e-pasts reģistrēts. |

| 8. FS XSS | **OK** | `family-sharing-view`: `JSON.stringify` + `\\u003c` bootstrap; nav `innerHTML` ar lietotāja tekstu. `dash-alerts.js` – `escHtml`/`escAttr`. |



**SQL secība:** `084` → `093` (ieskaitot **`093`** SELECT RLS active uzaicinātajam, **`092`** RLS + trigger).



**Pirms produkcijas:** `SUPABASE_SERVICE_ROLE_KEY` obligāts uzaicinājumiem un state `PATCH`; pēc migrācijām – smoke / manuāli: uzaicinājums, accept/decline, partner lasa owner subs tikai `active`.



---



## Komandas



```bash

npm run security:regression-check   # L2 statiski (CI)

npm run audit                       # L1

npm run security:smoke              # H2 + 078 (vajag .env)

npm run security:check              # regression + audit + smoke

```



---



## Pēc `git pull`



1. SQL **078** (ja bija **076** – obligāti **078**; logo teksts **077**)

2. `npm run security:check`



---



*Pārskats pēc Auth, Supabase, admin vai PWA izmaiņām.*

