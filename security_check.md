# Drošības pārskats - SubTrack (subtrack-web)

Datums: 2026-05-17. Atjaunināts: **`015_*.sql`** un **`016_sync_public_users_email_from_auth.sql` šajā Supabase vide jau ir palaisti** (manuāli). Apjoms: Next.js App Router frontend, Supabase Auth + Postgres (RLS), Server Actions.

---

## Kopsvilnis (ātrie secinājumi)

| Joma | Piezīme |
|------|--------|
| Maršruti | `middleware` + `requireAdminUser()` kā pirmais filtrs; aizargātie ceļi papildus jāpārbauda serverī, kur nepieciešams. |
| Atslēgas | Tikai `NEXT_PUBLIC_*` URL + anon key klientā; dokumentācija norāda nedot service role frontendam. |
| Admin darbības | Server Actions izsauc `requireAdminUser()` pirms rakstīšanas. |
| RLS un epasts | **`015`** nostiprina **`users.is_admin`** / **`email`** pret patvaļīgu **`UPDATE`**; **`016`** (trigeris **`auth.users` → `public.users.email`**) **`auth`** un **`public`** saskaņošanai. Atlikušie riski zem **Augsta un vidēja prioritātes**.

---

## Vērtējums (1-10)

**Šī dokumenta tagadējā līnija** (`015` un `016` šajā Supabase vide ir palaisti): **aptuveni 8,5 – 9,0 / 10**. Kritisko **RLS** un **auth ↔ `public.users.email`** plaisu datu slānī būtiski aizvērts; līdz augstākai līnijai (**~8,8 – 9,2**) ieteikts apstiprināt **`H2` smoke** vai roku **`is_admin`** testu un **deploy** ar repo **M2–M3–L1**.

| Situācija | Atzīme | Piezīme |
|-----------|-------:|---------|
| **Tagad: `015` + `016` DB** (ša dokumenta pieņēmums), **bez** garantētas **smoke** / bez pārliecības par jaunākā **`npm`** deploy (**M2–M3–L1**) | **~8,5 – 9,0 / 10** | Joprojām: enumerācijas risks, CSP **enforce**, globālais rate-limit; **`H2`** ieteikts laikus. |
| **`015`** + **`016`** + vietējais **`middleware`** rate limit (**M2**), **`next.config.ts` galvenes** (**M3**, CSP **Report-Only**), CI **`npm run audit`** (**L1**), **`security:smoke-users-rls` OK**, **H3** admin dok. pilnībā ievērots | **~8.8 – 9.2 / 10** | Pret **~10** vēl: globālais rate-limit CDN vai edge, CSP **enforce**, periodiska **L2**. |
| Vēsturiski: DB **bez** `015_*` (tikai `001_*` **users_update_own**) | **5 / 10** | Bijusi iespējama **`is_admin` / `email` manipulācija** parasto klientu (skatīt „Vēsturiskais trūkums”). |
| Ilgākā laikā plaši īstenoti MEDIUM / LOW uzlabojumi | **ap 9–10 / 10** | Nav absolūtas „pilnības”; jēga ir mazināt atkāpjamo virsmu un periodiski pārbaudīt (**L2**). |

**Pamats kopumā:** struktūrai (middleware, Server Actions un `requireAdminUser`, bez service-role klienta pārlūkā) ir labs pamats. Šajā vidē **`015_*`** (priviliģētās kolonnas) un **`016_*`** (**`auth.users` → `public.users.email`**) **ir spēkā**. Repozitorijā arī **M2**, **M3**, **L1**, smoke (**H2**) - jāvērtē, vai viss tas ir **deploy** un automatizētā **`H2`** izpildē **OK**.

---

## Vēsturiskais kritiskais trūkums (pirms **`015`**)

Šis apraksts atstāts kontekstam (**pēc `015` vairs nedarbojas** šāds ceļš `users_update_own` ietvaros priviliģētajām kolonnām):

**`users_update_own`** (`database/supabase/001_initial_schema.sql`) lika vien `auth.uid() = id`. PostgreSQL UPDATE **WITH CHECK** neliedz kolonņu maiņu: jaunas rindas `id` arī atbilst, tātad bija **pieejams patstāvīgi pacelt `public.users.is_admin` un līdzīgi manipulēt ar `email`**, izmantojot parasto `authenticated` anon REST vai Supabase JS klientu.

**Sekas (vēsturisks):** teorētiski ikviens pierakstījies varēja kļūt par admin un lasīt visas `users`, `subscriptions` (admin politikām).

**Novērsts:** `database/supabase/015_users_rls_protect_privileged_columns.sql` - **ša dokumenta kontekstā jau veikts**.

---

## Augsta un vidēja prioritātes riski

### 1. E-pasta esamības nodošana (UX vs privātums)

`signup_email_exists` (`SECURITY DEFINER`, `anon`/`authenticated` var izsaukt) dod iespēju **uzminēt e-pasta reģistrāciju**. Biežs UX kompromiss.

**Pacelt atzīmi:** vienotā atbilde („nav / nevar aprēķināt’’), vai **rate-limit** uz RPC (Supabase edge / Postgres pg_stat / aplikācijas slānis), vai ierobežot izsaukumu tikai signup plūsmā ar CSRF/next token līmeni ja vajag.

### 2. Publiski nolasāmie dati caur anon

- `site_translations` SELECT visiem (`012_site_translations_select_public.sql`).
- `system_settings` SELECT ar `using (true)` (`012_system_settings.sql`).
- `languages` SELECT anon/authenticated plašām politikām (`009`, `010`).

Nav problēmu, ja saturs ir publiski pieņemams. Lai mazinātu anon atslēgai pakļautos datus, datus labāk lasīt tikai servera SSR slānī un neizmest pilnu katalogu uz klienta tiešo REST.

### 3. Atvērto novirziešanu (`next` parametri)

`signInWithPasswordAction` un `GET /auth/callback` atlaiž tikai ceļus, kas sākas ar **`/`** un nav **`//`**. Tas samazina acīmredzamu open-redirect klasē.

Turpināt validēt `next`, lai nevirzītu uz acīmredzamiem relatīvu ceļu trikiem vai trešām pusēm neparedzētām vietām (šobrīd bloķē `//`).

### 4. Risks no `innerHTML` (FS demoslāņos)

Faili `public/fs/js/dashboard.js`, `analytics.js`, u.c. raksta **innerHTML**. Demo slānim ir `escHtml`; ja dati būs tieši no DB, jāizmanto vienmēr **escape vai DOM text** ceļā.

### 5. SSR skriptš (`FsI18nBootstrap`)

Izmanto **`dangerouslySetInnerHTML`**; teksts sakāpots caur `JSON.stringify` un `<` aizvietots kā `\u003c`, tas samazina `</script>` injekciju risku bootstrap skriptā.

### 6. Izstrādes API `/api/dev-env-check`

Darba tikai **`NODE_ENV === 'development'`**; atslēgas neizsniedz. Produkcijā `404`.

### 7. Trūkumi augstākam vērtējumam (~9-10)

Kodā jau sekots **M2** (vietējais middleware rate limit uz auth ceļiem), **M3** (galvenes + CSP **Report-Only**), **L1** (CI **`npm audit`**, Dependabot); **Secrets** praksē joprojām vadās no hosting/GitHub politikas. Pret **pilnu ~9.5–10**: globālais / edge rate limiting, CSP **enforce** bez regresijas, **L2** periodiski pēc jaunām funkcijām.

---

## Ko konkrēti darīt (svarīgums: HIGH / MEDIUM / LOW)

### HIGH

| # | Pasākums |
|---|----------|
| H1 | **Jaunās Supabase vidēs** (piem., jauna instance, atkārta DB atjaunošana no dump, jauns **`staging`**), kur **`001_*` joprojām ir bez šī uzlabinājuma, palaid **`015_users_rls_protect_privileged_columns.sql`**. Šajā projekta gadījumā galvenā vide jau sakārtota ar **`015`**. |
| H2 | Ar **`authenticated`** sesiju (anon atslēga kā frontendā) **mēģināt** `.update({ is_admin: ... })` uz savas **`public.users`** rindas. **Paredzētais iznākums:** kļūda vai nav reālas izmaiņas. Ja **`is_admin` joprojām mainās**, problēmai skatīt **`015`** atkārotu migrāciju katrai videi vai **konkurējošas `users` politikas**. **Repo:** **`SECURITY_SMOKE_EMAIL`**, **`SECURITY_SMOKE_PASSWORD`**, tad **`npm run security:smoke-users-rls`**. |
| H3 | Sākuma **administratora** līmeni (**`is_admin`**) un jebkurus **`users.is_admin`** / **`email`** labojumus veikt vietās, kur RLS vai platformas politika dod **service / DB** ceļus (Dashboard **SQL** ar **`postgres`**, vadītas migrācijas utt.). Pēc veiksmīga **`015`** ar anon atslēgu pārlūkā **nevajadzētu** mainīt šos laukus; **`auth.users` ↔ `public.users.email`** kārtībai skatīt **MEDIUM M1**. Skatīt README sadaļu **Supabase** (Administratora līmenis). |

### MEDIUM

| # | Pasākums |
|---|----------|
| M1 | **`public.users.email`** nedrīkst atšķirties ilgtermiņā no **`auth.users`**; risinājums: **`SECURITY DEFINER`** / webhook / vai **`database/supabase/016_sync_public_users_email_from_auth.sql`**. Šajā **galvenajā vide `016` jau veikts**. **Jaunām vidēm** (staging, dumps) atkāroti **jāimportē** **`016_*`**; nepieciešamas tiesības **`auth.users`** trigera kontekstā. |
| M2 | **Brute-force** un pārmērīga pieprasījumu slodze: uz **`/login`**, **`/signup`**, **`/forgot-password`**, **`/change-password`**, **`/auth/callback`**. Tipiski arī **CDN / edge** limiti. **Repo:** **`lib/security/auth-rate-limit.ts`**, sakne **`middleware.ts`**. **`signup_email_exists`**: **vēl jāvērtē**, ja paliek publiski ekspluatējams kā sign-up enumerācijas kanāls (Server Action / RPC), un jāpapildina ar Supabase līmeņa robežām. |
| M3 | **`next.config`** lauks **`headers`** (un/vai CDN): **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy: strict-origin-when-cross-origin`**, **`X-Frame-Options: DENY`**; **Content-Security-Policy** (`Report-Only` ar **`frame-ancestors`**, **`object-src`**, **`base-uri`**, **`form-action`**). Pēc sakārtošanas pāriet uz **enforce**. **Repo:** sakne **`next.config.ts`**. |

### LOW

| # | Pasākums |
|---|----------|
| L1 | **Atkarību higiēna:** **`npm audit`**, Dependabot vai līdzvērtīgi **CI** / atskaitēs kā **atkāroti** vai **pie PR**. Neaizvieto SECURITY piezīmes kodā vai DB politikās. **Repo:** **`npm run audit`**, `.github/workflows/security-audit.yml`, `.github/dependabot.yml`. |
| L2 | **Regresijas atgādinātāji:** līdzvērtīgas piezīmes **README**, šajā failā un (**ja attiecas**) Smoke / CI zemāk.

#### L2 - īsa regresijas checklist (jauna funkcija)

Pēc būtiski jaunas funkcijas ar datiem (admin, subscriptions, billing u.tml.):

1. **`INSERT`/`UPDATE`/`DELETE` politikas**: katram jaunajam vai mainītajam tabulas ceļam - vai **`WITH CHECK`** aizsedz arī **privileged** kolonnas līdzīgi **`015`** paraugam?
2. **Server Actions**: vai mutācijas sākas ar **`requireAdminUser`** vai citu viennozīmīgu **server-side** autorizāciju?
3. **Klientā**: vai nav jaunu ceļu, kas izsauc **service_role** vai rāda sensitīvos **ENV**?

---

### Ieviests kodā šajā repozitorijā (neatceļ DB darbus)

| Joma | Faili / maršruti |
|------|------------------|
| **M2** | `lib/security/auth-rate-limit.ts`, sakne `middleware.ts` |
| **M3** | `next.config.ts` (`headers`, CSP Report-Only) |
| **M1 SQL** | `database/supabase/016_sync_public_users_email_from_auth.sql` (ša vide **palaista**; jaunās - atkāroti) |
| **H2 smoke** | `scripts/security-smoke-users-rls.mjs`, **`npm run security:smoke-users-rls`**, **`supabase.env.template`** (`SECURITY_SMOKE_*`) |
| **L1** | `.github/workflows/security-audit.yml`, `.github/dependabot.yml`, `package.json` skripts **`audit`** |
| **H3** | README Supabase Administrators SQL |

---

## Dokumentētās saistītās struktūras (ātra navigācija)

| Fails | Mērķis |
|-------|--------|
| `middleware.ts` | Matcher, Rate limit (**M2**), izņem statiku/`fs/` |
| `lib/supabase/middleware.ts` | `getUser()`, aizargātie prefiksi, `guest`-ceļu novirziešana |
| `lib/security/auth-rate-limit.ts` | Middleware rate limit (**M2**) |
| `lib/supabase/server.ts` | SSR Supabase tikai anon ar sīkdatēm |
| `lib/auth/require-admin.ts` | Admin layout guards |
| `lib/auth/actions.ts`, `auth/callback` | Sesija un `next` relatīvie ceļi |
| `lib/admin/*-actions.ts` | `requireAdminUser()` uz mutācijas |
| `database/supabase/001*` … `016*` | RLS politikām un labojumiem |

---

*Nākamo pārskatu ieteicams pēc būtām Auth, Supabase vai UI izmaiņām un pirms produkcijas palaišanas.*
