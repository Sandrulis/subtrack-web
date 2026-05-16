# SubTrack (subtrack-web)

**Versija:** `0.2.0` (skatīt lapas lejas daļā **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**).

**SubTrack** ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. Biznesa loģika abonementiem pašlaik daļēji balstās uz **FS prototipa JavaScript** (`public/fs/js/`), kas ielādējas demonstrācijas režīmā; **īstā datu glabāšana un backend** (Supabase Auth + Postgres shēmas pamats `database/supabase/`; abonementu sinhronizācija ar DB kā turpmāks solis) tiek pieslēgta pakāpeniski.

## Galvenās iespējas (UI)

- **Sākumlapa** - prezentācija, FAQ, saites uz paneli un reģistrāciju
- **Autentifikācija** - ieeja un reģistrācija caur **Supabase Auth** (Server Actions), OAuth (Google / Apple), **aizmirstā parole** (`/forgot-password`), **mainīt paroli** (`/change-password` ar `changePasswordAction`, `components/change-password-form.tsx`: jaunās paroles stiprums kā signup, atkārtojums, paroles rādīšanas poga, vecā parole netiek vērtēta pirms „Saglabāt”). **Reģistrācija** (`/signup`, `components/signup-form.tsx`): e-pasta formāta validācija, paroles stipruma indikators, atkārtotās paroles pārbaude, e-pasta aizņemtība (ja DB ir **`signup_email_exists`**, sk. `004_*`). **Flash ziņojumi** (kļūdas un īsie info teksti no `?error=` / `?message=` un OAuth kļūdas) tiek rādīti kā **peldošie toast** (`components/flash-param-toast.tsx`, `components/auth-toasts-host.tsx`): apmerami auto-aizvēršanās, uzvedot kursoru virs ziņojuma taimeris apstājas, pēc kursora nost no jauna. Query parametri pēc rādīšanas tiek tīrīti ar `history.replaceState`, lai pārlādē neatkārtojas. Izmantošana: `/login`, `/signup`, `/forgot-password` (gatavs nākotnes redirectiem), `/change-password`.
- **Panelis** (`/dashboard`) - maksājumu kalendārs, kopsavilkums, abonementu CRUD (demo dati pārlūkā līdz pilnai DB migrācijai); augšējā joslā **paziņojumi** (kavētie / gaidāmie)
- **Analītika** (`/analytics`) - kopsavilkumi, kategorijas, Chart.js diagramma
- **Iestatījumi** (`/settings`) - preferences: **`public.users.display_preferences`** (JSON), DB sinhronizācija + dublējums `localStorage` (kad ir migrācija `006_*`)
- **Administrācija** (`/admin`, `/admin/users`, ...) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne (lietotāji, sistēmas iestatījumi, valodas, tulkojumi). Lietotāju saraksts un admin pazīme kodā balstās uz RLS un RPC **`current_user_is_admin`** (`lib/auth/is-admin.ts`, `resolveSessionIsAdmin`). Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~768 px platums)

Šaurām ekrānplatēm horizontālā augšējā navigācija ir slēpta; vietā **`components/mobile-bottom-nav.tsx`** liek peldošu, daļēji caurspīdīgu **apakšējo navigāciju** („glass’’ pill): ielogoti - Panelis / Analītika / Administrācija (adminiem); bez sesijas sākumlapā - Iespējas / Demonstrācija / FAQ. `position: fixed` tiek pārnests uz **`document.body`** ar **`createPortal`**, lai izkārtojums vienmēr balstās pret viewport.

**ADMIN sadaļā** (~760 px un šaurāk) apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

Paziņojumu izvēlni uz mobilā sakārto **`public/fs/js/dash-alerts.js`** (`position:fixed` viewport ietvarā + platuma clampa), lai tas negrieztos malā.

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | `styles/subtrack.css` (no `FS` prototipa), `app/globals.css` |
| Ikonas | Font Awesome 6 (CDN), `next/font` - Inter |
| Demo paneļi | `public/fs/js/*.js` (kalendārs, modāļi, Chart.js, paziņojumi …) |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `middleware.ts`, `database/supabase/*.sql` |

## Maršrutu aizsardzība (`lib/supabase/middleware.ts`)

- **Sesijas nav**: **`/dashboard`**, **`/analytics`**, **`/settings`**, **`/change-password`**, **`/admin`** (kopā `/admin/*`) - novirze uz **`/`**.
- **Sesija ir**: **`/login`**, **`/signup`**, **`/forgot-password`** - novirze uz **`/dashboard`**.

Sesijas cookie atjaunošana arī šeit; saknes **`middleware.ts`** izsauc `updateSession`.

## Supabase iestatīšana

1. Izveido projektu [supabase.com](https://supabase.com).
2. **Project Settings → API** : URL un anon atslēga.
3. Projekta saknē `.env.local` (paraugu skatīt **`supabase.env.template`**):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<projekts>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-atslēga>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Authentication → URL Configuration**: redirect URIs (piem. `…/auth/callback`), OAuth provideri kā nepieciešams.

5. **SQL** (secībā pēc vajadzības):
   - **`database/supabase/001_initial_schema.sql`** - tabulas, RLS, trigeri. Ja Postgres sūdzas par `execute function` pie `auth.users` triggera, skatīt faila komentāru par `execute procedure`.
   - Opcionāli **`002_migrate_profiles_to_users.sql`**, ja projektā bijusi vecā `profiles` shēma.
   - **`database/supabase/003_admin_users_select_policy.sql`** - **`current_user_is_admin()`** (`SECURITY DEFINER`) + SELECT politika **`users_select_all_if_admin`**, kas izsauc šo funkciju. Tas ļauj adminiem (`is_admin > 0`) lasīt visu `public.users` sarakstu **bez** RLS rekursijas. Vecais variants ar `EXISTS (SELECT … FROM public.users …)` politikā izraisīja kļūdu `infinite recursion detected in policy for relation users` - ja to redzi, palaid šo failu **pilnībā** vēlreiz. Bez `003` anon sesijā admin lapa redz tikai savu rindu.
   - **`database/supabase/004_signup_email_exists_rpc.sql`** - funkcija `signup_email_exists` (`SECURITY DEFINER`), ko izsauc Server Action, lai pirms „Izveidot kontu“ noteiktu, vai e-pasts jau ir `auth.users`. Bez šī soļa forma darbojas, bet aizņemta e-pasta brīdinājums neparādās.
   - Opcionāli **`database/supabase/005_current_user_is_admin_rpc.sql`** - idempotents **`current_user_is_admin`** + `GRANT` atkārtojums; **pilna** administrācijas RLS labošana vienmēr ir **`003`** (politika + funkcija kopā).
   - **`database/supabase/006_user_display_preferences.sql`** - kolonna **`users.display_preferences`** (jsonb) iestatījumu saglabāšanai (`/settings`).

6. `npm run dev`. Serverī `createServerSupabaseClient()` (`lib/supabase/server.ts`), pārlūkā `createBrowserSupabaseClient()` (`lib/supabase/client.ts`).

## Struktūra (īsumā)

```
app/                      # App Router (/, /dashboard, /admin/*, auth …)
components/               # nav-landing, signup-form, auth-toasts-host, change-password-form …
components/admin/         # Administrācijas apvalks (NavDash + apakšizvēlne)
components/fs/            # Paneļa / analītikas skati un FS skripti
lib/auth/                 # user-display, is-admin, password-strength, require-admin, actions (ieskaitot changePassword)
lib/supabase/             # anon/server klienti, middleware-logika sesijai
middleware.ts             # atjauno sesiju + augšā minētie redirecti
database/supabase/        # Postgres + RLS (001…006)
public/fs/js/             # FS demo JS (subscriptions, dash-alerts …)
styles/subtrack.css       # dizaina līnija (toast-container--auth-pages u.c.)
supabase.env.template     # ENV veidlapa bez noslēpumiem
```

## Palaišana lokāli

Prasības: **Node.js** LTS.

```bash
cd subtrack-web
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run start
npm run lint
```

## Vide un drošība

- Nekommitē `.env.local` un sensitīvus atslēgu ierakstus.
- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **demonstrācijas** dati pašlaik no `localStorage` + `public/fs/js`. Supabase (**Auth**, **`users`**, **`subscriptions`** shēmas, RLS) ir sagatavojums; funkcionalitātes sinhronizācija uz Server Actions/API un vienots datu modelis būs kā turpmākie uzdevumi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām; detalizētākās funkcijas un SQL skatīt augšējās sadaļās.

### 0.2.0 (2026-05-16)

- **Supabase** – servera/pārlūka klienti (`lib/supabase/*`), sesijas `middleware.ts`, OAuth/apmaiņas maršruts `app/auth/callback/route.ts`, ENV paraugi (`supabase.env.template`, `.env.example`).
- **Datubāze** – Postgres + RLS skripti `database/supabase/001` … `006` (lietotāji, admin politika un `current_user_is_admin`, `signup_email_exists`, `users.display_preferences`).
- **Auth UX** – `/login`, `/signup`, `/forgot-password`, `/change-password` ar Server Actions un komponentēm (`signup-form`, `change-password-form`), peldošie toast kļūdām un ziņām (`flash-param-toast`, `auth-toasts-host`), sociālo pogu komponente.
- **Aizsargātie maršruti** – panelis, analītika, iestatījumi, admin; novirzes sesijas stāvoklim atbilstoši `middleware`.
- **Administrācija** – `/admin` un apakšlapas (`components/admin/*`), piekļuve tikai adminiem.
- **Iestatījumi** – preferences JSON + sinhronizācija ar DB un `localStorage` (`006`, FS skats un klienta žogs kur nepieciešams).
- **Mobilā vide** – apakšējā navigācija (`mobile-bottom-nav`), admin horizontālā ritināšana šauros ekrānos.
- **Paneļa FS slānis** – skati `components/fs/*`, ielādes helpers; JS atjauninājumi `public/fs/js/` (ieskaitot paziņojumus `dash-alerts.js`; vecā `dash-notifications.js` aizstāta/noņemta).
- **Pārējās lietas** – navigācija ar sesijas darbībām un lietotāja izvēlni (`nav-session-actions`, `nav-user-menu`), palīgfunkcijas (`lib/auth/*`, `lib/user-display-preferences.ts`), `next.config.ts`, globālie/stila labojumi.

### 0.1.0 un agrāk

- Sākotnējais Next.js 16 / React 19 projekts ar FS prototipa importu un pirmo README (sk. git vēsturi: `ea3bc70`, `0233c26`).

## Licence

Privāts projekts. Precizē licenci publiskota repo gadījumā.
