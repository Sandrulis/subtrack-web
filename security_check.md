# Drošības pārskats - repazy (subtrack-web)

Datums: 2026-05-22 (MEDIUM/LOW labojumi + L1/L2).

**Pēdējā sesija:** M1–M3, L1–L5 (skat. sadaļu **2026-05-22 izmaiņas**).

---

## Kopsvilnis

| Joma | Piezīme |
|------|--------|
| Maršruti / admin | `proxy.ts`, `requireAdminUser`, RLS **015** / **078** |
| API | Sesija handleros + middleware **401** bez sesijas (`/api/*`, izņ. cron, dev-env-check) |
| Rate limit | Auth + **`/api/*`**; opcija **Upstash** (`UPSTASH_REDIS_REST_*`) |
| Cron | Tikai **`Authorization: Bearer <CRON_SECRET>`** (`lib/security/cron-auth.ts`) |
| Family sharing | RLS lasīšana (bez service_role platumā); PATCH: sesija pirms service_role |
| Automatizācija | `npm run security:regression-check`, `npm run security:check` |

---

## Vērtējums (1-10)

Pārskatīts: **2026-05-22** pēc M1–M3 / L1–L5. Statiskā regresija: **OK** (`npm run security:regression-check`). `npm audit --audit-level=high`: **0** high.

### Kopējais rādītājs

| Konteksts | Atzīme | Komentārs |
|-----------|-------:|-----------|
| **Repozitorijs (kods + CI/L2)** | **8,9** | Middleware API 401, cron Bearer, family RLS read, rate limit API, signup `unavailable` |
| **Produkcija: SQL 078–080, 092/093, 107–113 + smoke** | **9,1** | RLS + smoke apstiprina privileģiju kolonnas un e-pasta šablonus |
| **+ Vercel cron Bearer + Upstash ENV** | **9,3** | Globāls rate limit; cron secrets ārpus URL logiem |
| **Bez migrācijas 078 / bez smoke** | **8,6** | Kods labāks, bet DB var atpalikt no repo |

### Pa kategorijām (1–10)

| Kategorija | Atzīme | Stiprā puse | Atvērums pret 10 |
|------------|-------:|-------------|------------------|
| **Autentifikācija / sesija** | 9,0 | Supabase Auth, cookie refresh, guest/protected maršruti | Nav 2FA / device binding |
| **Autorizācija (RLS + API)** | 9,2 | `users` privileged lauki (**015**, **107**), subs `user_id`, admin RPC **080** | `service_role` PATCH/lookup – uzticas app slānim |
| **API un maršruti** | 9,0 | `getUser()` + middleware **401** uz `/api/*` | Jauni route jāpārbauda manuāli (L2) |
| **Admin / service_role** | 8,8 | Tikai serverī; VIP tikai pēc `current_user_is_admin` | Profili family: `service_role` pēc ID saraksta |
| **Ģimenes dalīšana** | 8,9 | RLS **093** lasīšana; enumerācija POST samazināta | PATCH fallback ar service_role (trigger apiet `auth.uid()`) |
| **Rate limiting** | 8,5 | Auth + API ceļi; Server Action signup check | Bez Upstash – limits **uz instanci** (Vercel) |
| **XSS / frontends** | 8,7 | React bootstrap `JSON.stringify` + `\u003c`; FS `escHtml` | Daļa `innerHTML` prototipa JS (mitigēts, ne aizstāts) |
| **Noslēpumi / ENV** | 9,0 | Nav `NEXT_PUBLIC_*` service role; cron bez query secret | `CRON_SECRET` / service role jāglabā Vercel |
| **Atkarības (npm)** | 9,5 | 0 high audit | Regulārs Dependabot process |
| **Operācijas / observability** | 8,0 | Smoke + migration checklist | Nav centralizēta audit log / SIEM |

**Vidēji (svara skatījumā): ~9,0** repozitorijā; **~9,1** ar pilnu DB un deploy disciplīnu.

**Pret 10:** stingrs **CSP** (`script-src`), **globāls** rate limit bez Upstash, signup e-pasta **timing** (RPC joprojām iespējams ar zemu intensitāti), centralizēta FS renderēšana bez `innerHTML`, ārējs pentests.

---

## HIGH / MEDIUM

| Grupa | Status |
|-------|--------|
| H1–H3, M1–M3, M-NEW-1 | **Repo DONE**; DB: **078** + smoke |

### 2026-05-22 izmaiņas (MEDIUM / LOW)

| ID | Kas izdarīts | Faili |
|----|----------------|-------|
| **M1** | Ģimenes saites un kopīgie abonementi: **tikai sesijas RLS** (bez service_role lasīt visu `family_sharing_links`) | `lib/family-sharing/family-sharing-server.ts` |
| **M1** | Profili service_role tikai **counterparty ID** no RLS redzamām saitēm | `family-sharing-server.ts` |
| **M2** | Family PATCH: **vispirms `supabase` (RLS)**, tad service_role fallback | `app/(app)/api/family-sharing/[id]/route.ts` |
| **M3** | `/api/*` rate limit proxy; **`rateLimitAllow`** + opc. **Upstash** | `lib/security/rate-limit-allow.ts`, `auth-rate-limit.ts`, `proxy.ts` |
| **L1** | `GET /api/subscriptions` → **401** bez sesijas | `app/(app)/api/subscriptions/route.ts` |
| **L2** | Cron: **tikai Bearer**, bez `?secret=` | `lib/security/cron-auth.ts`, cron routes |
| **L3** | Signup e-pasta pārbaude: `unavailable` (ne „brīvs e-pasts”) pie rate limit/kļūdas | `lib/auth/actions.ts`, `signup-form.tsx`, **115** SQL |
| **L4** | Regresijas skripts: droši `.map(build*)` innerHTML | `scripts/security-regression-check.mjs` |
| **L5** | Middleware: **401 JSON** uz `/api/*` bez sesijas | `lib/supabase/middleware.ts` |
| **Advisor** | Pro trial RPC: **EXECUTE → service_role** + `p_user_id` (**116**) | `116_security_advisor_pro_trial_rpc.sql`, `grant-pro-trial-session.ts` |

---

## LOW (L1 / L2 automatizācija)

| # | Pasākums | Status |
|---|----------|--------|
| **L1** | `npm audit --audit-level=high`, Dependabot, CI schedule | **DONE** |
| **L2** | Regresijas checklist, statiska pārbaude | **DONE** |
| **L2 FS** | `innerHTML` – map uz `build*` ar `escHtml` builderos | **DONE** (regresija + manuāli pēc izmaiņām) |

### L2 checklist (jauna funkcija)

1. RLS **`WITH CHECK`** privileged kolonnām (kā **015**, **107**)
2. Server Actions: **`requireAdminUser`**
3. API: **`getUser()`** + **`user_id`** / admin RPC
4. E-pasta šabloni: **`system_settings_email_templates`**
5. Palaid: **`npm run security:check`**
6. Jaunam `/api/*` – arī middleware 401 (L5)

### Family sharing – pārbaude 2026-05-21 (atjaun. 2026-05-22)

| L2 punkts | Status | Piezīme |
|-----------|--------|---------|
| 1. RLS `WITH CHECK` | **OK** | **092** + trigger |
| 3. API sesija | **OK** | + middleware 401 |
| 6. `service_role` | **OK** | Šaurāks: PATCH fallback, profili pēc ID, lookup e-pasts POST |
| 7. Enumerācija | **OK** | POST invite failed |
| 8. FS XSS | **OK** | `escHtml` notify/dashboard |

**SQL:** `084` → `093`; Pro trial `107`–`116` (**116** – RPC tikai `service_role`).

### Supabase Security Advisor (manuāli)

| Brīdinājums | Risinājums |
|-------------|------------|
| `grant_pro_trial_if_eligible` / `repair_pro_trial_started_at` – signed-in EXECUTE DEFINER | **`116_*`**: `EXECUTE` tikai **`service_role`**, parametrs `p_user_id`; serveris (`grant-pro-trial-session.ts`) |
| **Leaked password protection disabled** | Dashboard → **Authentication** → **Attack protection** (vai Email provider) → ieslēgt **Leaked password protection** (Have I Been Pwned). Nav SQL. |

---

## Komandas

```bash
npm run security:regression-check
npm run audit
npm run security:smoke
npm run security:check
```

**Cron (Vercel):** `Authorization: Bearer $CRON_SECRET` – **ne** `?secret=` URL.

**Upstash (opcija, M3 globāli):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` – `lib/security/rate-limit-allow.ts`.

---

## Pēc `git pull`

1. SQL **078** (ja vajag), **115**, **116** (Pro trial RPC + Advisor)
2. `npm install` (ja jaunās `@upstash/*` atkarības)
3. `npm run security:check`
4. Vercel cron: pārslēgt uz **Bearer** header

---

*Pārskats pēc Auth, Supabase, admin, PWA vai drošības izmaiņām.*
