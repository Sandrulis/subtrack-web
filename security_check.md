# Drošības pārskats - repazy (subtrack-web)

Datums: **2026-05-30** | Pārskatīts: **2026-05-30**

---

## Vērtējums (1–10) – īsumā

| | Atzīme |
|---|-------:|
| **Repozitorijs (kods + CI)** | **9,0** |
| **Produkcija (pilna DB + smoke)** | **9,1** |
| **+ cron Bearer + Upstash** | **9,3** |
| **Vidēji** | **~9,0** (repo) / **~9,1** (ar deploy disciplīnu) |

Detalizētas tabulas un pa kategorijām → sadaļa **[Vērtējums – detalizēti](#vērtējums--detalizēti)** zemāk.

**Satura rādītājs:** [Vērtējums detalizēti](#vērtējums--detalizēti) · [Veicamie soļi](#veicamie-soļi) · [Atskaite](#atskaite-2026-05-30) · [Komandas](#komandas)

---

## Kopsvilnis

| Joma | Piezīme |
|------|--------|
| Maršruti / admin | `proxy.ts`, `requireAdminUser`, RLS **015** / **078** / **159** |
| API | `requireApiSession` / `requireApiAdmin` + middleware **401** |
| Rate limit | Auth + **`/api/billing`**, **`/api/user`**, catch-all **`/api`**; opcija **Upstash** |
| Cron | Tikai **`Authorization: Bearer <CRON_SECRET>`** |
| Stripe | Webhook paraksts; billing RLS **159** |
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
| **API un maršruti** | 9,0 | Middleware 401 + `requireApiSession` | Jauni route – L2 |
| **Admin / service_role** | 8,8 | Tikai serverī; delete guards | Family lookup |
| **Ģimenes dalīšana** | 8,9 | RLS **093**; enumerācija samazināta | PATCH service_role fallback |
| **Rate limiting** | 8,7 | Auth + `/api/*` (iesk. billing) | Bez Upstash – uz instanci |
| **XSS / frontends** | 8,7 | escHtml, JSON `\u003c` | CSP bez script-src |
| **Noslēpumi / ENV** | 9,0 | Nav public service role | Vercel ENV |
| **Atkarības (npm)** | 9,5 | 0 high audit | Dependabot |
| **Operācijas / observability** | 8,5 | deploy-checklist, smoke CI | Leaked password – Dashboard |

**Pret 10:** stingrs CSP (`script-src`), globāls RL bez Upstash, signup timing, FS bez innerHTML, pentests, Leaked password Dashboard.

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

### Manuāli – TODO

| # | Soļis | Kur |
|---|--------|-----|
| 4 | Leaked password protection | Supabase → Authentication → Email |
| 6 | Vercel ENV, cron Bearer, Upstash (opc.) | Skat. `npm run security:deploy-checklist` |

---

## Atskaite (2026-05-30)

### Automātiskās pārbaudes

| Komanda | Rezultāts |
|---------|-----------|
| `npm run security:regression-check` | **OK** |
| `npm audit --audit-level=high` | **0** high |
| `npm run security:verify-migrations` | **OK** (159, 161) |
| `npm run security:smoke` | Izlaists lokāli (bez `SECURITY_SMOKE_*`) |

Palaid no: `cd C:\Users\Dators\subtrack-web`

### Slāņi – īsi

Middleware **401** · Auth/signup **OK** · API `requireApiSession` **OK** · RLS **159/161 OK** · Stripe webhook **OK** · Admin/service_role **OK** · Family sharing **OK** · Rate limit **OK** · XSS **OK ar rezervi** · Secrets **OK**

### Atklātie punkti

| ID | Apraksts | Status |
|----|----------|--------|
| R1 | Smoke lokāli izlaists | CI ar secrets |
| M1 | 158/160/162 bez auto-verify | SQL Editor |
| L1 | Leaked password | **TODO** Dashboard |
| L2 | Upstash opcija | ENV |
| L3 | CSP bez script-src | Apzināts |

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

1. SQL **158–162** → `npm run security:migration-checklist`
2. `npm run security:verify-migrations`
3. Leaked password (Dashboard)
4. `npm run security:check`

---

## Vēsture

- **2026-05-30:** regresija, billing RL, verify/deploy skripti, šis pārskats
- **2026-05-22:** M1–M3 family/cron/rate limit, L5 middleware 401, **116** Pro trial RPC

*Pārskats pēc Auth, Supabase, Stripe, admin vai drošības izmaiņām.*
