# Drošības pārskats - repazy (subtrack-web)

Datums: **2026-08-11** | Pārskatīts: **2026-08-11** | Iepriekšējais: **2026-06-03**

---

## Vērtējums (1–10) – īsumā

| | Atzīme |
|---|-------:|
| **Repozitorijs (kods + CI)** | **9,2** |
| **Produkcija (pilna DB + smoke)** | **9,2** |
| **+ cron Bearer + Upstash** | **9,4** |
| **Vidēji** | **~9,2** (repo) / **~9,2** (ar deploy disciplīnu + **176**) |

Detalizētas tabulas un pa kategorijām → sadaļa **[Vērtējums – detalizēti](#vērtējums--detalizēti)** zemāk.

**Satura rādītājs:** [Vērtējums detalizēti](#vērtējums--detalizēti) · [Veicamie soļi](#veicamie-soļi) · [Atskaite](#atskaite-2026-06-03) · [`/admin/user-messages`](#adminuser-messages-174175) · [Komandas](#komandas)

---

## Kopsvilnis

| Joma | Piezīme |
|------|--------|
| Maršruti / admin | `proxy.ts`, `requireAdminUser`, RLS **015** / **078** / **159** |
| API | `requireApiSession` / `requireApiAdmin` + middleware **401** |
| Rate limit | Auth + **`/api/billing`**, **`/api/user`**, catch-all **`/api`**; **izņemts** Stripe webhook + cron; opcija **Upstash** |
| Cron | Tikai **`Authorization: Bearer <CRON_SECRET>`** |
| Stripe | Webhook paraksts; billing RLS **159** |
| Konta dzēšana | **`/api/user/delete-account`** – sesija, paroles re-auth, admin guards, Stripe/storage/family cleanup |
| Admin lietotāju saturs | **`/admin/user-messages`** – tikai admin; RLS + RPC **`174`**; server actions |
| Reģistrācijas slēdzis | **`signup_enabled`** (166 + **176** `handle_new_user` gate) – UI, action un DB |
| Automatizācija | `security:regression-check`, `verify-migrations`, `deploy-checklist`, `security:check` |

---

## Vērtējums – detalizēti

Statiskā regresija: **OK**. `npm audit --audit-level=high`: **0** high.

### Kopējais rādītājs

| Konteksts | Atzīme | Komentārs |
|-----------|-------:|-----------|
| **Repozitorijs (kods + CI/L2)** | **9,0** | Regresija, billing RL, verify-migrations |
| **Produkcija: SQL 078–080, 092/093, 107–116, 158–162 + smoke** | **9,1** | **159** Stripe RLS; **161** privātais aizdevums |
| **+ cron-job.org Bearer + Upstash ENV** | **9,3** | Globāls rate limit; cron secrets ārpus URL logiem |
| **Bez migrācijas 159 / bez smoke** | **8,5** | Klients var mainīt `paid_plan_*` bez **159** |

### Pa kategorijām (1–10)

| Kategorija | Atzīme | Stiprā puse | Atvērums pret 10 |
|------------|-------:|-------------|------------------|
| **Autentifikācija / sesija** | 9,0 | Supabase Auth, guest/protected maršruti | Nav 2FA |
| **Autorizācija (RLS + API)** | 9,3 | **159** billing WITH CHECK; IDOR aizsardzība | service_role FS |
| **API un maršruti** | 9,0 | Middleware 401 + `requireApiSession`; jauns delete-account OK | Jauni route – L2 |
| **Admin / service_role** | 8,8 | Tikai serverī; delete guards | Family lookup |
| **Ģimenes dalīšana** | 8,9 | RLS **093**; enumerācija samazināta | PATCH service_role fallback |
| **Rate limiting** | 8,7 | Auth + `/api/*` (iesk. billing, user) | Bez Upstash – uz instanci |
| **XSS / frontends** | 8,9 | escHtml, JSON `\u003c`, e-pasta body escHtml; paplašināts CSP | CSP `unsafe-inline` scripts |
| **Noslēpumi / ENV** | 9,0 | Nav public service role | Vercel ENV |
| **Atkarības (npm)** | 9,5 | 0 vulnerabilities audit | Dependabot |
| **Operācijas / observability** | 8,5 | deploy-checklist, smoke CI | Leaked password – Dashboard |
| **Konta dzēšana / GDPR** | 9,0 | Pilns cleanup; admin nevar self-delete; **paroles re-auth** | – |

**Pret 10:** stingrāks CSP (bez `unsafe-inline`), globāls RL bez Upstash, pentests, Leaked password Dashboard.

---

## Veicamie soļi

### Repo / kods – DONE

| # | Kas | Komanda / fails |
|---|-----|-----------------|
| 1 | Regresijas skripts | `scripts/security-regression-check.mjs` |
| 2 | Rate limit `/api/billing`, `/api/user`, `/api` | `lib/security/auth-rate-limit.ts` |
| 5 | Deploy checklist | `npm run security:deploy-checklist` |

### DB – pārbaudīt / palaist

| # | Migrācija | Verify | Darbība |
|---|-----------|--------|---------|
| 3a | **159** Stripe billing | **OK** | Nav vajadzīgs |
| 3b | **161** privātais aizdevums | **OK** | Nav vajadzīgs |
| 3c | **158** Advisor | Nav auto | SQL Editor |
| 3d | **160** Stripe tulkojumi | Nav auto | SQL Editor |
| 3e | **162** `private_loan` | Nav auto | SQL Editor |
| 3f | **166** `signup_enabled` | Nav auto | SQL Editor (ja nav) |
| 3g | **174** `user_support_requests` + admin RPC | **verify-migrations** (opc.) | SQL Editor (ja nav) |

### Manuāli – TODO

| # | Soļis | Kur |
|---|--------|-----|
| 4 | Leaked password protection | Supabase → Authentication → Email |
| 6 | Vercel ENV, cron Bearer, Upstash (opc.) | Skat. `npm run security:deploy-checklist` |
| 7 | OAuth signup bypass (N1) | Skat. ieteikumus zemāk |

---

## Atskaite (2026-06-03)

### Automātiskās pārbaudes

| Komanda | Rezultāts |
|---------|-----------|
| `npm run security:regression-check` | **OK** |
| `npm audit --audit-level=high` | **0** vulnerabilities |
| `npm run security:verify-migrations` | **OK** (159, 161) |
| `npm run security:smoke` | Izlaists lokāli (bez `SECURITY_SMOKE_*`) |

Palaid no: `cd C:\Users\Dators\subtrack-web`

### Slāņi – īsi

Middleware **401** · Auth/signup **OK** · API `requireApiSession` **OK** · RLS **159/161 OK** · Stripe webhook **OK** · Admin/service_role **OK** · Family sharing **OK** · Rate limit **OK** · XSS **OK ar rezervi** · Secrets **OK** · Delete account **OK**

### Jaunais kopš 2026-05-30

| Funkcija | Drošības novērtējums |
|----------|---------------------|
| **`/api/user/delete-account`** | Sesija + admin block; `deleteUserAccountById` (Stripe, storage, family); iemesls max 4000; e-pasts caur `escHtml` |
| **`signup_enabled` (166 + 176)** | UI + `signUpAction` + **`handle_new_user`** DB gate (`signup_enabled=false` → exception) |
| **`/admin/user-messages` (174–175)** | Admin layout + `requireAdminUser`; RLS; RPC ar `current_user_is_admin()`; React text (nav innerHTML) |
| Migrācijas **163–173** | Galvenokārt tulkojumi; drošības ietekme minimāla |

### Atklātie punkti

| ID | Apraksts | Status |
|----|----------|--------|
| R1 | Smoke lokāli izlaists | CI ar secrets |
| M1 | 158/160/162/166 bez auto-verify | SQL Editor |
| L1 | Leaked password | **TODO** Dashboard |
| L2 | Upstash opcija | ENV |
| L3 | CSP ar script-src (unsafe-inline) | Apzināts (Next) |
| N1 | OAuth / Auth signUp ar `signup_enabled=false` | **Labots** – SQL **`176_handle_new_user_signup_enabled_gate.sql`** |
| N2 | Konta dzēšana bez paroles re-auth | **Labots** – paroles solis + API `password` |
| U1 | **`174` nav palaists** – admin UI tukšs / support bez DB | **Jauns** – palaid SQL + verify |
| U2 | Atbalsta insert pēc e-pasta – ja DB insert fail, e-pasts jau nosūtīts | **Jauns** – zema prioritāte (audit) |

Signup e-pasta enumerācija mīkstināta: bloķēts e-pasts → tā pati „pārbaudi e-pastu” UX; `signupEmailExistsAction` vienmēr `{ exists: false }`; `mapSignupAuthError` → ģeneriska ziņa.

---

## `/admin/user-messages` (174/175)

**Maršruts:** `app/(app)/admin/user-messages` · **Migrācijas:** `174_user_support_requests.sql`, `175_site_translations_admin_user_messages.sql`

### Slāņi

| Slānis | Implementācija | Novērtējums |
|--------|----------------|------------:|
| **Maršruta aizsardzība** | `app/(app)/admin/layout.tsx` → `requireAdminUser()` (redirect uz `/` / `/dashboard`) | **9,5** |
| **SSR dati** | `loadAdminUserMessagesPageData()` – atkārtots `requireAdminUser()` pirms RPC | **9,5** |
| **Mutācijas** | `lib/admin/admin-user-messages-actions.ts` – katrā action `requireAdminUser()` + UUID regex | **9,5** |
| **Nav atsevišķa API** | Tikai Server Actions (nav `/api/admin/user-messages`) | **9,0** |
| **RLS – support** | `user_support_requests`: insert tikai `user_id = auth.uid()`; select/delete tikai admin | **9,5** |
| **RLS – suggestions/feedback** | Esošās politikas **150** / **151–152**; admin delete / landing update | **9,5** |
| **Admin saraksta RPC** | `list_admin_user_*` – `WHERE current_user_is_admin()`; ne-admin → tukšs saraksts (bez e-pastu noplūdes) | **9,0** |
| **PII admin UI** | Rāda `author_email` tikai adminiem (apzināts) | **8,5** |
| **XSS frontend** | `{row.title}`, `{row.body}`, `{row.message}` kā React text; nav `dangerouslySetInnerHTML` | **9,0** |
| **CSRF** | Next.js Server Actions noklusējuma aizsardzība | **9,0** |
| **Atbalsta iesniegšana** | `submitSupportRequestAction` – sesija, garuma limits, e-pasts + DB insert ar `user_id: user.id` | **9,0** |

**Kopā (šī funkcija):** **~9,1 / 10**

### Ko pārbaudīt manuāli

1. **Ne-admin** atver `/admin/user-messages` → redirect (nevis 200 ar datiem).
2. **Ne-admin** izsauc `list_admin_user_suggestions` (SQL/RPC) → **0 rindu**, nevis kļūda ar e-pastiem.
3. **Admin** redz ieteikumus / atsauksmes / support; dzēšana un „Sākumlapā” toggle strādā.
4. **Palīdzība** modālis → e-pasts uz `support_contact_email` **un** jauns ieraksts `user_support_requests` (pēc **174**).
5. **`npm run security:regression-check`** – L2.2b blokam jābūt **OK**.

### Regresijas signāli (automātiski)

`scripts/security-regression-check.mjs` (L2.2b):

- `admin-user-messages-data.ts` – `requireAdminUser` + trīs `list_admin_*` RPC
- `admin/user-messages/page.tsx` – `loadAdminUserMessagesPageData`
- `admin-user-messages-view.tsx` – nav `dangerouslySetInnerHTML`
- `174_user_support_requests.sql` – RLS politikas + `current_user_is_admin()` RPC filtrā
- `support-actions.ts` – DB insert ar `user_id` no sesijas

`npm run security:verify-migrations` (opc.): tabula **`user_support_requests`** kolonnas `message`, `email_sent`.

### Atvērumi (nav bloķējoši)

| ID | Apraksts |
|----|----------|
| U2 | Ja DB insert pēc veiksmīga Resend fail, lietotājs redz success, bet admin UI bez ieraksta |
| U3 | Nav atsevišķa rate limit admin Server Actions (tikai `is_admin > 0`) |
| U4 | Admin RPC `GRANT … TO authenticated` – drošība balstās uz `current_user_is_admin()` query iekšā, ne atsevišķu EXECUTE revoke |

---

## Leaked password protection

1. [Supabase Dashboard](https://supabase.com/dashboard) → projekts
2. **Authentication** → **Providers** → **Email**
3. Ieslēdz **Prevent use of leaked passwords**
4. Saglabā

---

## Komandas

```bash
cd C:\Users\Dators\subtrack-web

npm run security:regression-check
npm run security:verify-migrations
npm run security:deploy-checklist
npm run security:check
```

**Cron:** `Authorization: Bearer $CRON_SECRET` (ne `?secret=`).

---

## Pēc `git pull`

1. SQL **158–166** (un jaunākie) → `npm run security:migration-checklist`
2. `npm run security:verify-migrations`
3. Leaked password (Dashboard)
4. `npm run security:check`

---

## Vēsture

- **2026-08-11 (turpinājums):** N2 labots (delete-account paroles re-auth); signup enumerācija mīkstināta; CSP paplašināts (`script-src` u.c.)
- **2026-08-11:** N1 labots (**176** `handle_new_user` + `signup_enabled`); RL izņēmums webhook/cron; middleware fail-closed bez Supabase env; family PATCH filtri + invite oracle mīkstināts; panelis – defer alerts, skip dubulto boot, FS/CSS cache
- **2026-06-03:** `/admin/user-messages` (174–175); L2.2b regresija; verify **174**; atkārtota pārbaude; delete-account; signup_enabled (166); N1/N2
- **2026-05-30:** regresija, billing RL, verify/deploy skripti, šis pārskats
- **2026-05-22:** M1–M3 family/cron/rate limit, L5 middleware 401, **116** Pro trial RPC

*Pārskats pēc Auth, Supabase, Stripe, admin vai drošības izmaiņām.*
