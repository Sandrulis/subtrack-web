# SubTrack (subtrack-web)

**Versija:** `0.2.16` (skatīt lapas lejas daļā **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**).

**SubTrack** ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. Biznesa loģika abonementiem pašlaik daļēji balstās uz **FS prototipa JavaScript** (`public/fs/js/`), kas ielādējas demonstrācijas režīmā; **īstā datu glabāšana un backend** (Supabase Auth + Postgres shēmas pamats `database/supabase/`; abonementu sinhronizācija ar DB kā turpmāks solis) tiek pieslēgta pakāpeniski.

## Galvenās iespējas (UI)

- **Sākumlapa** - prezentācija, FAQ, saites uz paneli un reģistrāciju
- **Autentifikācija** - ieeja un reģistrācija caur **Supabase Auth** (Server Actions), OAuth (Google / Apple), **aizmirstā parole** (`/forgot-password`), **mainīt paroli** (`/change-password` ar `changePasswordAction`, **`components/fs/change-password-fs-view.tsx`** + **`components/change-password-form.tsx`** – **`t()`** un **`auth.pass_strength.level_*`** kā signup, atkārtojums, paroles rādīšanas poga; vecā parole netiek vērtēta pirms „Saglabāt”). **Pieteikšanās / reģistrācijas** formu virknes un maršruta **`<title>`** seko izvēlētajai lokālei (**`components/auth/auth-login-flow.tsx`**, **`components/auth/auth-signup-flow.tsx`** + **`components/signup-form.tsx`**, **`getUiPhraseForRequest`** no **`lib/ui/server-ui-phrases.ts`**). **Reģistrācija** (`/signup`): e-pasta formāta validācija, paroles stipruma indikators, atkārtotās paroles pārbaude, e-pasta aizņemtība (ja DB ir **`signup_email_exists`**, sk. `004_*`). **Flash ziņojumi** (kļūdas un īsie info teksti no `?error=` / `?message=` un OAuth kļūdas) tiek rādīti kā **peldošie toast** (`components/flash-param-toast.tsx`, `components/auth-toasts-host.tsx`): apmerami auto-aizvēršanās, uzvedot kursoru virs ziņojuma taimeris apstājas, pēc kursora nost no jauna. Query parametri pēc rādīšanas tiek tīrīti ar `history.replaceState`, lai pārlādē neatkārtojas. Izmantošana: `/login`, `/signup`, `/forgot-password` (gatavs nākotnes redirectiem), `/change-password`.
- **Panelis** (`/dashboard`) - maksājumu kalendārs, kopsavilkums, abonementu CRUD (demo dati pārlūkā līdz pilnai DB migrācijai); **FS demo JS** (`public/fs/js/dashboard.js` …) dabū frāzes un **`Intl`** lokāli pirms **`loadScriptOnce`**, jo servera **`app/dashboard/page.tsx`** renderē **`FsI18nBootstrap`** (inline skripts uz **`window.__SUBTRACK_FS_I18N`**; skatīt **UI tulkošana**); augšējā joslā **paziņojumi** (kavētie / gaidāmie; mobilajā skatā – pilnekrāna caurspīdīgs fons ar **backdrop blur**, kā lietotāja izvēlne; abas izvēlnes nevar būt atvērtas vienlaikus)
- **Analītika** (`/analytics`) - kopsavilkumi, kategorijas, Chart.js diagramma; **FS** slānī tāpat **`FsI18nBootstrap` + phrases** kā panelī (**`app/analytics/page.tsx`**, **`public/fs/js/analytics.js`** …)
- **Iestatījumi** (`/settings`) - preferences: **`public.users.display_preferences`** (JSON), DB sinhronizācija + dublējums `localStorage` (kad ir migrācija `006_*`). Forma **`components/fs/settings-fs-view-client.tsx`** ar **`useSubtrackIntl`**; **`app/settings/page.tsx`** kārto **`languages`** atlasi ar **`Intl.Collator`** pēc **`resolveRequestUiLocales`** (nevis fiksētu `lv-LV`). **Saskarnes valoda** – pēc izvēles tiek uzreiz **`applyUiLocaleInBrowser`** (sīkdatne **`subtrack_ui_locale`**) + **`writeDisplayPreferencesToLocalStorage`** + **`router.refresh()`**, lai **`app/layout.tsx`** (**`SubtrackIntlProvider`**, tulkošanas `dbMap`) atbilstu jaunajai lokālei; **`mergeDisplayPreferencesFromSources`** (`lib/user-display-preferences.ts`) apvieno DB un LS tā, ka **derīgie `localStorage` lauki pārklāj DB** (optimistiskā UI pirms Supabase saglabāšanas). Bāzes noklusējumi no **`public.system_settings`** (`012`), ja nav lietotāja ieraksta; `/admin/system` ietekmē jaunos kontus un formas bāzi.
- **Administrācija** (`/admin`, `/admin/users`, `/admin/system`, `/admin/languages`, `/admin/translations`) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne. **Ikonu tooltipi** admin tabulās – **`SubtrackTooltip`** (`components/subtrack-tooltip.tsx`): melns burbulis, teksts portalā uz **`document.body`** (`position: fixed`), lai **`admin-table-wrap`** `overflow` to neapgriež; uz **touch / coarse pointer** nerāda (**`useSupportsHoverTooltip`**). **Lietotāji** – servera lapa **`app/admin/users/page.tsx`** atlasa datus; **`components/admin/admin-users-view.tsx`** (klienta) rāda tulkošanu atslēgās, kopsavilkumu kategorijām un **`Intl`** datumus pēc UI lokāļa. Admin kopsavilkumi par abonementiem (RLS + **`008`**). **Vadteksti** valodu / tulkošanu / sistēmai – **`components/admin/admin-intros.tsx`**. **Sistēma** – panelis **`AdminSystemPanel`** (tulkošanu atslēgas formas virsrakstiem un kļūdām; dažu **`<select>` opciju** iekšējā teksta vēl var atšķirties). **Sistēma** (`/admin/system`) dati: **`012_system_settings.sql`**, Server Actions **`lib/admin/system-actions.ts`**, publiskā nosaukuma lasīšana **`lib/system-settings-public.ts`**. **Valodas** – CRUD pret **`public.languages`**, noklusējuma valoda jaunajiem apmeklētājiem (**`010`**; Server Actions **`lib/admin/languages-actions.ts`**, **`components/admin/admin-languages-panel.tsx`**; pamatā **`007`**); saraksta **`Intl.Collator`** – pēc pašreizējās UI lokāļa. **Tulkojumi** - **`public.site_translations`**: **`components/admin/admin-translations-panel.tsx`** + **`AdminTranslationsIntro`** (`titleActions`: poga vienā rindā ar virsrakstu); **modāļi** jaunai atslēgai un labošanai; tabulā **atslēga + teksts tikai aktīvajai UI lokālei**; **meklētājs** pilnā platuma rindā; **bez meklēšanas** papildu rindas ar **IntersectionObserver** (lazy DOM), **ar meklēšanu** filtrs pār **visu** servera ielasīto katalogu (`loadAdminTranslationsData`). Migrācija **`011`**; publiskā **SELECT** – **`012_site_translations_select_public.sql`**; sēkla – **`013_site_translations_seed_subtrack_ui.sql`**, skatīt **[UI tulkošana](#ui-tulkošana)** (**`python scripts/export_site_translations_sql.py`** pēc **`fallback-phrases.ts`** izmaiņām). Atšķiras **prototipa paneļu** vai citu **`components/fs/*`** vietu līmenis par fiksētām virknēm – papildināšana vienmēr ar **`t('…')`**. Admin pazīme: RLS un RPC **`current_user_is_admin`**. Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~768 px platums)

Šaurām ekrānplatēm horizontālā augšējā navigācija ir slēpta; vietā **`components/mobile-bottom-nav.tsx`** liek peldošu, daļēji caurspīdīgu **apakšējo navigāciju** („glass’’ pill): ielogoti - Panelis / Analītika / Administrācija (adminiem); bez sesijas sākumlapā - Iespējas / Demonstrācija / FAQ. `position: fixed` tiek pārnests uz **`document.body`** ar **`createPortal`**, lai izkārtojums vienmēr balstās pret viewport.

**ADMIN sadaļā** (`@media (max-width: 768px)`, `styles/subtrack.css`): izkārtojums kolonnā (`admin-body`); **`align-items: stretch`**, lai **submenu josla un galvenais saturs** aizpildītu to pašu platumu kā augšējā josla (`dash-topbar-shell`), nevis sarautos pa kreisi. Apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

**`/admin/users` tabula**: ļoti šaurā skatā (**≤640 px**) kolonnas „Loma“ un „Reģistrēts“ tiek rādītas zem e-pasta, iniciāļu aplis paslēpts; **virs 640 px** (ieskaitot 641–768 px mobilajā administrācijas izkārtojumā) atkal redzamas **pilnas kolonnas** un **iniciāļu aplis** (ja nepietiek vietas – horizontālā ritināšana `admin-table-wrap`).

**Paziņojumi (`@media (max-width: 768px)`)** – **`public/fs/js/dash-alerts.js`** paneli pozicionē ar `position: fixed` pret viewport un platuma **clamp**, lai karte neaizslīd malā. **`components/nav-session-actions.tsx`** satur pogu **`#dash-notify-backdrop`**; kad panelis ir vaļā, tiek lietots tas pats slāņošanas modelis kā lietotāja izvēlnei (`z-index` fons **188**, karte **200**, `styles/subtrack.css`). Fona slānim ir **`backdrop-filter: blur(12px)`** (un **`prefers-reduced-motion`** – bez blur). **`components/nav-user-menu.tsx`** un **`dash-alerts.js`** savstarpēji aizver otras izvēlnes, izmantojot `CustomEvent` (`subtrack:notify-opened` / `subtrack:user-menu-opened`), lai nepārlietotu divus pilnekrāna overlay. **Visās platēm:** zvana poga strādā arī pēc React klienta navigācijas un ātrās skriptu ielādes – klikšķa delegēšana uz **`document` (capture)** un pēc ielādes **`components/authed-notify-bootstrap.tsx`** izsauc globālo **`window.fsBootDashAlerts()`**, lai sakristu ar DOM.

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | `styles/subtrack.css` (no `FS` prototipa), `app/globals.css` |
| Ikonas | Font Awesome 6 (CDN, `app/layout.tsx`), papildus **inline SVG** (nav, admin u.c.); `next/font` - Inter |
| Demo paneļi | `public/fs/js/*.js` (kalendārs, modāļi, Chart.js, paziņojumi …) |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `middleware.ts`, `database/supabase/*.sql` |

## Maršrutu aizsardzība (`lib/supabase/middleware.ts`)

- **Sesijas nav**: **`/dashboard`**, **`/analytics`**, **`/settings`**, **`/change-password`**, **`/admin`** (kopā `/admin/*`) - novirze uz **`/`**.
- **Sesija ir**: **`/login`**, **`/signup`**, **`/forgot-password`** - novirze uz **`/dashboard`**.

Sesijas cookie atjaunošana arī šeit; saknes **`middleware.ts`** izsauc `updateSession`.

## Navigācija un veiktspēja (kopīgas sajūtas)

Pat salīdzinoši mazā lietotnē **`App Router`** maršruta maiņa parasti nav tūlītēja kā **klasiskajās vienlapās** (pilnīgi lokālā CSR pāreja): klients gaida **React Server Components (Flight)** payload no servera, tāpēc reizēm šķiet, ka **„kaut kas velkas, tad tikai pārslēdzas“**. Turklāt:

| Ko dara projekts | Sekas |
|------------------|--------|
| **`middleware`** (`updateSession`) | uz maršruta / bieži arī **`<Link prefetch>`** pieprasījumu izsauc **`supabase.auth.getUser()`** – papildus tīkla solis pret Supabase katrā ceļā. |
| **Aizsargātās lapas** | **`getSessionUserDisplay()`** (**`lib/auth/user-display.ts`**) atkal **`getUser()`**, **`users` SELECT**, **`resolveSessionIsAdmin`** (RPC **`current_user_is_admin`**) pat tad, kad middleware jau pārbaudīja sesiju. |
| **`/admin/*`** (**`app/admin/layout.tsx`**) | secīgi **`requireAdminUser()`** (vēl **`getUser()` + RPC**) un tad **`getSessionUserDisplay()`** – atkārtots **`getUser()`** un atkārtots **tas pats admin RPC** vienā navigācijas atbildē (ja RPC atgriež kļūdu, velk arī **`users.is_admin` fallback**). |
| **Saknes layout** (**`app/layout.tsx`**) | **`cookies()`** / **`headers()`** padara shell **dinamisku**; **`getPublicSiteTranslationsMerged`** atgriež **pilnu tulkoņu map'e** kā **`SubtrackIntlProvider`** `dbMap` props – tas ir **liels Flight serializācijas apjoms** (kešošana ar **`unstable_cache`** palīdz DB pusē; serializācija tomēr tiek veikta tad, kad layouts tiek veikts atkārtoti). |
| **`generateMetadata` / `getUiPhraseForRequest`** | daudzas lapas paraleli atkārto lokāļa izvēli un tulkoņu merge vienā dokumenta pieprasījumā (sk. **`lib/ui/server-ui-phrases.ts`**); kešošana samazina DB dubultvēzi, bet struktūra joprojām ir atkārtots slāņu darbs. |

**`<Link>`** noklusējumā (**prefetch** viewport redzāmām saišu vietām) var sākt šo darbu **pirms** klikšķa – tas arī var radīt sajūtu, ka fonā „jau ko ielādē“. Tiešām izmaiņu meklēji sāk **`lib/supabase/middleware.ts`**, **`lib/auth/user-display.ts`**, **`lib/auth/require-admin.ts`**, **`app/layout.tsx`**.

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
   - **`database/supabase/015_users_rls_protect_privileged_columns.sql`** – `public.users`: politika **`users_update_own`** ar papildu `WITH CHECK`, lai ar parasto Supabase klientu netiktu mainīti **`is_admin`** un **`email`** (novērsti privilēģiju pacelšanu); pēc **`001`** (**obligāti** produkcijas vidē ja `001` bija palaista vecajā variantā bez šī papildinājuma). Apraksts: **`security_check.md`**.
   - **`database/supabase/016_sync_public_users_email_from_auth.sql`** – trigeris uz **`auth.users`**: **`public.users.email`** sinhronizācija no Auth pēc e-pasta maiņas (**M1**). Pēc **`001`**/`015`. Ja DB sūdzas par `execute function`, pamēģini `execute procedure` ( kā **`001`** ).
   - Opcionāli **`002_migrate_profiles_to_users.sql`**, ja projektā bijusi vecā `profiles` shēma.
   - **`database/supabase/003_admin_users_select_policy.sql`** - **`current_user_is_admin()`** (`SECURITY DEFINER`) + SELECT politika **`users_select_all_if_admin`**, kas izsauc šo funkciju. Tas ļauj adminiem (`is_admin > 0`) lasīt visu `public.users` sarakstu **bez** RLS rekursijas. Vecais variants ar `EXISTS (SELECT … FROM public.users …)` politikā izraisīja kļūdu `infinite recursion detected in policy for relation users` - ja to redzi, palaid šo failu **pilnībā** vēlreiz. Bez `003` anon sesijā admin lapa redz tikai savu rindu.
   - **`database/supabase/004_signup_email_exists_rpc.sql`** - funkcija `signup_email_exists` (`SECURITY DEFINER`), ko izsauc Server Action, lai pirms „Izveidot kontu“ noteiktu, vai e-pasts jau ir `auth.users`. Bez šī soļa forma darbojas, bet aizņemta e-pasta brīdinājums neparādās.
   - Opcionāli **`database/supabase/005_current_user_is_admin_rpc.sql`** - idempotents **`current_user_is_admin`** + `GRANT` atkārtojums; **pilna** administrācijas RLS labošana vienmēr ir **`003`** (politika + funkcija kopā).
   - **`database/supabase/006_user_display_preferences.sql`** - kolonna **`users.display_preferences`** (jsonb) iestatījumu saglabāšanai (`/settings`).
   - **`database/supabase/007_languages.sql`** - tabula **`public.languages`** (kods, nosaukums, `sort_order`, `updated_at`), sēkla, RLS adminu pārvaldībai; **`/admin/languages`**. Bez šī soļa valodu lapa ziņo par migrācijas trūkumu.
   - **`database/supabase/008_admin_subscriptions_select_policy.sql`** - SELECT politika **`subscriptions_select_all_if_admin`**, lai admini (`current_user_is_admin()`) varētu lasīt visus **`public.subscriptions`** ierakstus (piem. `/admin/users` kopsavilkumi). Bez šī soļa parasts lietotājs redz tikai savus abonementus; admin sarakstā skaiti var neielādēties.
   - **`database/supabase/009_languages_select_authenticated.sql`** - SELECT politika ielogotajiem (`languages_select_authenticated`), lai **`public.languages`** būtu nolasāms ārpus admin (piem. valodu atlase **`/settings`**). Pēc **`007`**.
   - **`database/supabase/010_languages_is_default_anon_select.sql`** - kolonna **`is_default`** (viena sistēmas noklusējuma valoda jaunajiem apmeklētājiem), un **`SELECT`** politika **anon** lomai, lai katalogu varētu lasīt bez sesijas (`getLanguagesCatalog`, `<html lang>`). Pēc **`007`**.
   - **`database/supabase/011_site_translations.sql`** - tabula **`public.site_translations`** (atslēga, lokālis, teksts), RLS: admin **`SELECT`/CRUD**, citiem bez papildu politikas nav lasīšanas. **`/admin/translations`**. Pēc **`007`**.
   - **`database/supabase/012_site_translations_select_public.sql`** - **`SELECT`** politika lomām **`anon`** un **`authenticated`**, lai publiskais Next.js layout varētu ielasīt tulkošanas mapes bez admin sesijas (`getPublicSiteTranslationsMerged` iekš `lib/site-translations-public.ts`). Pēc **`011`**.
   - **`database/supabase/013_site_translations_seed_subtrack_ui.sql`** - **`INSERT … ON CONFLICT … DO UPDATE`** sēklas UI tekstiem vairākās lokāļos (skripta ģenerēts kopums). Pēc **`012_site_translations_select_public`** (vai arī pēc **`011`**, ja ielādē kā SQL editors ar tiesībām, kas apiet RLS; ieteicami vispirms publiskā **SELECT** politika). Kad mainīts **`lib/i18n/fallback-phrases.ts`**, pārlikt failu ar **`python scripts/export_site_translations_sql.py`** (skatīt **[UI tulkošana](#ui-tulkošana)**).
   - **`database/supabase/014_languages_seed_ru.sql`** - **`public.languages`** krievu valodas rinda **`ru`** / **`Русский`** (sēkla esošiem projektiem; jaunajā `007` kopā tas jau ir). Pēc **`007`**.
   - **`database/supabase/012_system_settings.sql`** - tabula **`public.system_settings`** (viena rinda): produkta **`system_name`** + **`default_display_preferences`** jaunajiem lietotājiem (`handle_new_user` apvieno ar kodu līdzīgu bāzi `DISPLAY_PREFERENCES_DEFAULTS`). RLS: anon/ielogotiem **SELECT**; **`UPDATE`** tikai adminam. **`/admin/system`**. Neatkarīgs no tulkošanu soļiem; mapē ir **divi** faili ar prefiksu **`012_`** – **nav** jānumurē par jaunu; pietiek ar loģisko secību: tulkošanu **`012_site_translations_select_public`** pēc **`011`**, sistēmas tabula pēc **`006`** (vai jebkurā brīdī pēc **`001`**).

6. **Administrators (`is_admin`)** – vienīgi **Dashboard SQL** vai ar **service_role** (skatīt **`security_check.md` H3**), piem.:

   ```sql
   update public.users set is_admin = 1 where lower(trim(email)) = lower(trim('tev@epasts'));
   ```

7. `npm run dev`. Serverī `createServerSupabaseClient()` (`lib/supabase/server.ts`), pārlūkā `createBrowserSupabaseClient()` (`lib/supabase/client.ts`).


## UI tulkošana

Virknes UI: **`useSubtrackIntl().t('atslēga')`**, dati no **`site_translations`**, trūkstot - no **`FALLBACK_PHRASES`** (`lib/i18n/fallback-phrases.ts`).

- **Lokāle** - sīkdatne **`subtrack_ui_locale`** un/vai **`Accept-Language`**, salīdzinājumā ar **`public.languages`** (`getLanguagesCatalog`, `resolveUiLocaleCodeFromRequest` iekš `lib/ui/ui-locale-from-request.ts`; `<html lang>` arī `lib/html-lang.ts`). **`/settings`** – skatīt **Galvenās iespējas → Iestatījumi**: pēc valodas maiņas **`router.refresh()`**, lai klients dabūtu jaunu **`SubtrackIntlProvider`** no **`app/layout.tsx`** (tikai sīkdatnes maiņa vien nepārlādē RSC kontekstu).
- **Serveris** - saknes **`app/layout.tsx`** paraleli ielādē **`getPublicSiteTranslationsMerged(locale, defaultLocale)`** (`lib/site-translations-public.ts`, anon Supabase klients + **`unstable_cache`**, tags **`site-translations-public`**) un **`getSystemSiteName()`** (`system-settings-public`), tad ietin saturu **`SubtrackIntlProvider`** (`locale`, **`systemSiteName`**, **`dbMap`**).
- **Lappušu `<title>` (App Router)** - daudzos maršrutos **`generateMetadata`** izsauc **`getUiPhraseForRequest('meta.title.*')`** (`lib/ui/server-ui-phrases.ts`; tās pašas lokāļa izvēles kā layout), piem.: **`/admin/*`**, **`/login`**, **`/signup`**, **`/dashboard`**, **`/analytics`**, **`/settings`**, **aizmirstā parole / mainīt paroli**.
- **Klients** - **`useSubtrackIntl().t('atslēga')`**: vispirms vērtība no DB mapes, citādi **fallback** no **`lib/i18n/fallback-phrases.ts`** (`pickFallbackPhrase`); rezultātā vietturu aizvietošana (**`{SYSTEM_NAME}`** / **`{SISTEM_NAME}`**) ar **`system_settings.system_name`** (`applySystemNamePlaceholders`). Datuma/mēneša formatēšanai atsevišķi izmanto **`Intl`** ar **`uiLocaleCodeToBcp47ForIntl`** (`lib/ui/ui-locale-from-request.ts`).
- **FS demo scripts** – **`app/dashboard/page.tsx`** / **`app/analytics/page.tsx`** (Server Component): **`getUiPhrasesForRequest(fs*PhraseKeys)`** (`lib/ui/server-ui-phrases.ts`, atslēgu saraksti **`lib/fs/fs-page-i18n-keys.ts`**) + **`FsI18nBootstrap`** (`components/fs/fs-i18n-bootstrap.tsx`) bez **`use client`**, lai inline **`<script>`** izpildītos dokumenta parsē laikā (`window.__SUBTRACK_FS_I18N`, **`window.__SUBTRACK_FS_META.intlLocale`**). Tikai tad **`DashboardFsView` / Analytics** **`loadScriptOnce('/fs/js/…')`**. Paneļa JS lasa frāzes (piem. globālais **`FsT`**) **`public/fs/js/subscriptions-helpers.js`**, **`dashboard.js`**, **`analytics.js`**).
- **Sēkla / SQL** - pēc izmaiņām **`FALLBACK_PHRASES`** palaid **`python scripts/export_site_translations_sql.py`** – tiek pārrakstīts **`database/supabase/013_site_translations_seed_subtrack_ui.sql`**. Importē Supabase SQL Editor (kā pārējās migrācijas).
- **Admin** - saglabājot tulkojumus, **`lib/admin/translations-actions.ts`** izsauc **`revalidateTag('site-translations-public', 'default')`**, lai atsvaidzinātu publisko kešu.

## Struktūra (īsumā)

```
app/                      # App Router + `generateMetadata` ar tulkošanas atslēgām kur attiecas
components/               # nav-landing, subtrack-intl-provider, auth/*, signup-form …
components/subtrack-tooltip.tsx  # admin (u.c.) hover tooltipi: portal + fine-pointer; stili `subtrack.css`
components/auth/          # auth-login-flow.tsx, auth-signup-flow.tsx (kartīšu saturs lokālei)
components/admin/         # admin-shell, admin-users-view, admin-intros, paneļu formas …
components/fs/            # Paneļa / analītikas skati; `fs-i18n-bootstrap.tsx` – servera inlīnas `window.__SUBTRACK_*` pirms /fs/js
lib/admin/                # Server Actions, `system-actions.ts` (sistēmas iest.), `translations-actions` …
lib/system-name-placeholder.ts # {SYSTEM_NAME} aizvietošana `t()` ceļā
lib/system-settings-public.ts  # anon kešots sistēmas nosaukums + display prefs pamats
lib/site-translations-public.ts  # anon kešots `site_translations` merge sabiedriskajam UI
lib/ui/server-ui-phrases.ts     # `getUiPhraseForRequest`, `getUiPhrasesForRequest` (bulk), `resolveRequestUiLocales`
lib/ui/ui-locale-from-request.ts
lib/use-supports-hover-tooltip.ts  # `(hover: hover) and (pointer: fine)` – SubtrackTooltip ieslēgšana
lib/fs/fs-page-i18n-keys.ts      # tulkošanas atslēgu saraksti FS demo (`/dashboard`, `/analytics`)
lib/i18n/                 # FALLBACK_PHRASES (`fallback-phrases.ts`) un apkārtējā palīgfunkcionalitāte
lib/auth/                 # user-display, is-admin, password-strength, require-admin, actions (ieskaitot changePassword)
lib/user-display-preferences.ts  # display_preferences forma + **`mergeDisplayPreferencesFromSources`** (DB + LS; LS lauki pārklāj DB)
lib/languages-catalog.ts  # kešots valodu katalogs + noklusējuma `code` (anon lasījums)
lib/supabase/             # anon/server klienti, middleware-logika sesijai (+ **rate limit** – skatīt `middleware.ts`)
middleware.ts             # **rate limit** auth ceļiem, tad `updateSession` + redirecti; sk. **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**
database/supabase/        # Postgres + RLS (`001` … `016` utt.)
scripts/                  # `export_site_translations_sql.py`; tulkošanas palīgvietas; **`security-smoke-users-rls.mjs`** (`SECURITY_SMOKE_*` vai izlaist)
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

**Ja izstrādē konsolē parādās:** `Router action dispatched before initialization` (**`use-action-queue`**, **`hmrRefresh`**) – tā ir **Next.js 16 Turbopack HMR** sacīkšu klases kļūda (parasti tikai **`next dev`**). Pagaidu risinājums: **`npm run dev:webpack`** vai pilna lapas pārlādēšana.

**Uzmanību:** nekādā **`next.config`** nelietojiet `deploymentId: process.env.X ?? ""`, ja rezultāts var būt **`""`** – tukša virkne Turbopack režīmā var salauzt hidratāciju un līdzīgas kļūdas (skat. [next.js #92858](https://github.com/vercel/next.js/issues/92858)).

**Drošības papildinājumi:** Middleware **vietējo pieprasījumu līdzību** piemēro ceļiem `/login`, `/signup`, `/auth/callback`, `/forgot-password`, `/change-password` (`lib/security/auth-rate-limit.ts`). Lokālei testiem var **`DISABLE_RATE_LIMIT=true`** (`.env.local`). **`npm run audit`** (**`audit-level=high`**, CI arī) un **`npm run security:smoke-users-rls`** (iekšējais **`SECURITY_SMOKE_EMAIL`/`PASSWORD`; ja nav – izlaiž). Drošības **HTTP galvenes** (`next.config.ts`, CSP kā **report-only**). Detalizēti: **`security_check.md`**.

```bash
npm run build
npm run start
npm run lint
```

## Pēc Git atjauninājuma (`git pull`)

Šī sadaļa ir domāta izstrādātājiem un tiek izmantota arī kā **kopīga zināšanu bāze asistentiem** (Cursor u.tml.), lai pēc jaunākā commit ievilkšanas būtu skaidrs, ko darīt un kā īsi komunicēt.

### Obligātie / ieteicamie soļi

1. **`npm install`** – vienmēr pēc pull, ja mainījies `package.json` vai `package-lock.json`; ja šaubies, atkārto arī tad, kad lock fails nav mainījies (ātri un novērš „missing dependency’’ lokāli).
2. **Žurnāls** – salīdzināt ar **[Izmaiņu žurnālu](#izmaiņu-žurnāls)** un rindiņu **`Versija:`** README augšā: tur tiek apkopotas būtiskākās izmaiņas (Auth, middleware, SQL, ENV, paneļa FS slānis).
3. **Supabase un ENV** – ja žurnālā vai commit aprakstā ir jauni Postgres soļi, salīdzināt **`database/supabase/`** jaunos vai labotos `.sql` failus un **`supabase.env.template`** ar savu **`.env.local`**; migrācijas palaist saskaņā ar **SQL sarakstu** README sadaļā **Supabase iestatīšana** (**divi faili `012_*`** – sekot aprakstam, ne tikai alfabetiskai kārtībai).
4. **Pārbaude** – pēc lielākām atkarību vai tipu izmaiņām ieteicams **`npm run lint`** un **`npm run build`**; ikdienas darbam **`npm run dev`**.

### Ko „pateikt’’ / kā īsi atbildēt pēc jauna Git atjauninājuma

- **Lietotājam vai komandai:** īsi uzskaitīt: vai būtu jāpalaiž `npm install`; vai README žurnālā ir kas jauns (ENV, SQL); vai šķietami mainījušies paneļa faili (`public/fs/js/`, `components/fs/`); tad **`npm run dev`** un manuāli pārbaudīt galvenās lapas (sākumlapa, panelis, auth, admin – skatīt augšāk **Galvenās iespējas**).
- **AI palīgam:** neatkārtot visu README; izmantot šo sadaļu kā čeklisti. Ja žurnālā ir konkrētas jaunās funkcijas – nosaukt tās īsi; ja nav pieraksta žurnālā bet pull saturēja tikai mazus labojumus – to arī norādīt un ieteikt tikai `npm install` / `npm run dev`, ja nav redzamu `package-lock` vai DB izmaiņu.

### Uzturētājiem

Pie būtiskām izmaiņām **papildināt [Izmaiņu žurnālu](#izmaiņu-žurnāls)** (datums; nepieciešams – jauna apakšversija): jauni SQL faili ja ENV atslēgas, jauni maršruti, lauztās izmaiņas lokālajā prototipa JS.

## Vide un drošība

- Nekommitē `.env.local` un sensitīvus atslēgu ierakstus.
- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **demonstrācijas** dati pašlaik no `localStorage` + `public/fs/js`. Supabase (**Auth**, **`users`**, **`subscriptions`** shēmas, RLS) ir sagatavojums; funkcionalitātes sinhronizācija uz Server Actions/API un vienots datu modelis būs kā turpmākie uzdevumi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām; detalizētākās funkcijas un SQL skatīt augšējās sadaļās.

### 0.2.16 (2026-05-17)

- **Dependabot – `.github/dependabot.yml`** – formāts kā GitHub dokumentācijā (**`directory: "/"`**, pēdiņām ap **`npm`** un **`weekly`**, augšējā `#` sakārt kā komentāru), lai nebūtu validatora „invalid details’’.

### 0.2.15 (2026-05-17)

- **Atkarības – PostCSS GHSA-qx2v-qp2m-jg93** – `package.json` **`overrides`**: **`postcss` ≥ 8.5.10**, lai `next` piedāvātā vecā **`postcss`** transītīvā atkarība vairs nerāda **`npm audit` moderate**. Neizmantot **`npm audit fix --force`** (tas mēģina atgriezt veco **Next**).

### 0.2.14 (2026-05-17)

- **Drošība – H2, H3, M1, M2, M3, L1, L2** – Middleware **vietējam rate-limit** (`lib/security/auth-rate-limit.ts`, arī **`DISABLE_RATE_LIMIT`**, **`RATE_LIMIT_MULTIPLIER`**); **`next.config.ts`** drošības galvenes (**CSP `report-only`**); **`016_sync_public_users_email_from_auth.sql`**; **`npm run audit`**, **`npm run security:smoke-users-rls`**; GitHub **`security-audit.yml`**, **`dependabot.yml`**; **`security_check.md`** (**L2** checklist, jauns vērtējums); README – ENV, struktūras koks, **`H3`** administrators SQL snippets.

### 0.2.13 (2026-05-17)

- **Krievu UI tulkojumi** – **`lib/i18n/fallback-phrases.ts`**: **`ru`** no angļu teksta ar **`scripts/translate_fallback_ru.py`** (**`deep-translator`**, EN→RU; vietturas **`{…}`** saglabātas). Viens neveiksmīgs API atgriešanas gadījums labots rokām (**`landing.faq.q_saved`**). **`013_site_translations_seed_subtrack_ui.sql`** pārrakstīts ar **`export_site_translations_sql.py`**.

### 0.2.12 (2026-05-17)

- **Paziņojumu FS lokāle** – **`FsNotifyI18nBootstrap`** (`components/fs/fs-notify-i18n-bootstrap.tsx`): uz **`/`** (ielogots), **`/settings`**, **`/change-password`**, **`/admin/*`** iestāda **`window.__SUBTRACK_FS_META.intlLocale`** un **`FsT(fs.dashboard.overdue_*)`**, lai **`dash-alerts.js`** (`formatOverdueLabel`, datumu **`Intl`**) sakristu ar UI lokāli; **`lib/fs/fs-page-i18n-keys.ts`** – **`fsNotifyBarPhraseKeys`**.

### 0.2.11 (2026-05-17)

- **Drošības audits** – **`security_check.md`**: atzīme (~5/10 pirms RLS papildinājuma, ~8 pēc **`015_*`**), riski (`signup_email_exists`, publiskie SELECT u.c.) un ieteiktā secība. SQL **`015_users_rls_protect_privileged_columns.sql`** – **novērta** iespēja ielogotam lietotājam pacelt **`is_admin`**, izmantojot veco **`users_update_own`**.

### 0.2.10 (2026-05-17)

- **Krievu valoda (UI)** – **`public.languages`**: **`007_languages.sql`** (svaigām DB) un **`014_languages_seed_ru.sql`** (esošām); **`fallback-phrases.ts`** / **`FallbackLocaleCode`**: **`ru`**; **`scripts/export_site_translations_sql.py`** un pārrakstīts **`013_site_translations_seed_subtrack_ui.sql`** (septiņi lokāļi; **`ru`** sākumā **no angļu** teksta – pēc `git pull` iespējams precizēt **`/admin/translations`**); **`pickFallbackPhrase`**: **`en` → `lv` → `ru`**; **`uiLocaleCodeToBcp47ForIntl`**: **`ru` → `ru-RU`**.

### 0.2.9 (2026-05-17)

- **Palaišana lokāli** – `package.json`: skripts **`npm run dev:webpack`** (`next dev --webpack`), ja Turbopack HMR konsolē rāda **`Router action dispatched before initialization`**; README – īss traucējummeklēšanas punkts un brīdinājums par **`deploymentId: ""`**.
- **Administrācija → Tulkojumi** – **`admin-translations-panel.tsx`**, **`admin-intros.tsx`**: poga vienā rindā ar virsrakstu; meklētājs **100%** platumā; **lazy** rindu izvadīšana bez aktīvas meklēšanas (**IntersectionObserver**); meklējums joprojām pār **visu** ielādēto katalogu; **`styles/subtrack.css`**; **`013_*`** / **`fallback-phrases.ts`** (jaunas atslēgas, piem. `lazy_partial_hint`, `lazy_search_scope_hint`).
- **Iestatījumi / saskarnes valoda** – **`settings-fs-view-client.tsx`**: **`router.refresh()`** uzreiz pēc **`interface_language_code`** maiņas kopā ar **`applyUiLocaleInBrowser`** un **`localStorage`**; **`mergeDisplayPreferencesFromSources`** (`lib/user-display-preferences.ts`) – DB + LS merge, kur **LS lauki ar priekšrocību** pārklāj DB (saskaņot ar jauno refresh plūsmu).

### 0.2.8 (2026-05-17)

- **README** – jauna sadaļa **[Navigācija un veiktspēja (kopīgas sajūtas)](#navigācija-un-veiktspēja-kopīgas-sajūtas)**: App Router Flight, middleware **`getUser`**, atkārtota **`getSessionUserDisplay`**, admin layouts dubultais admin RPC un pilna **`dbMap`**, **`Link prefetch`**.

### 0.2.7 (2026-05-17)

- **Admin tooltipi** – **`components/subtrack-tooltip.tsx`** + **`lib/use-supports-hover-tooltip.ts`**: vietā HTML **`title`** uz ikonu pogām un saistītajiem elementiem (**`admin-languages-panel`**, **`admin-translations-panel`**, **`admin-users-view`**); burbulis **`createPortal(..., document.body)`** ar **`position: fixed`** un **`width: max-content`**, lai tabulu **`overflow`** neapgriež un teksts nelaužas šaurā kolonnā; **`styles/subtrack.css`**. Cursor: **`.cursor/rules/subtrack-tooltips.mdc`**.

### 0.2.6 (2026-05-16)

- **FS demo lokālizācija un inicializācija** – **`FsI18nBootstrap`**: tikai kā **Server Component** (bez `use client`), lai inline skripts ar **`window.__SUBTRACK_FS_I18N`** / **`__SUBTRACK_FS_META`** izpildītos pirms klientā **`loadScriptOnce('/fs/js/…')`**; **`getUiPhrasesForRequest`** + **`lib/fs/fs-page-i18n-keys.ts`**; **`subscriptions-helpers.js`**, **`dashboard.js`**, **`analytics.js`** (**`Intl`**, **`FsT`** u.tml.).
- **Paneļa kalendārs** – **`dashboard.js`** mēnesa virsraksts **`#pay-calendar-title`** (novērsts **`ReferenceError: titleEl is not defined`**).
- **Tipi** – **`types/window-fs-dash.d.ts`**: **`window.fsBootDashAlerts`** (kopā ar **`dash-alerts.js`**).

### 0.2.5 (2026-05-16)

- **Administrācija → Tulkojumi** – **`components/admin/admin-translations-panel.tsx`**: jaunu ierakstu pievienošana un labošana **modāļos**, tabulā **atslēga + teksts aktīvajā lokālē**, **dzīvā meklēšana** pēc atslēgas un jebkuras valodas vērtības (pilnais servera katalogs vienā pieprasījumā); **`styles/subtrack.css`**, **`013`** un **`fallback-phrases.ts`**. *(Plašāks UX un lazy rindas – žurnālā **0.2.9**.)*
- **Augšējās joslas paziņojumi** – **`public/fs/js/dash-alerts.js`**: klikšķa apstrāde ar **delegēšanu uz `document` (capture fāze)**, lai zvans atvērtu paneli arī tad, kad notiek **Next.js klienta navigācija** (poga tiek pārmontēta) vai skripts ielādējas **pirms/pēc** React DOM; `target` normalizācija teksta mezgliem; globāli **`window.fsBootDashAlerts`**. **`components/authed-notify-bootstrap.tsx`**: pēc **`ensureAuthedNotifyScriptsLoaded()`** izsauc **`fsBootDashAlerts`**, lai sākotnējā reizē badge un listeneri sakristu ar augšu.
- **Lokālizācija papildinājumi** – **`admin-translations-panel`** (tabula + **`t()`**), **`admin-languages-panel`**, **`settings-fs-view-client`**, **`/settings`** valodu kārtošana pēc lokāļa (**`resolveRequestUiLocales`**), **`change-password-fs-view`** + **`change-password-form`** (**`auth.pass_strength.level_*`** kā signup); **`subtrack.css`** (**`password-strength *--very_weak`**); **`013_site_translations_seed_subtrack_ui.sql`** pēc **`python scripts/export_site_translations_sql.py`**.

### 0.2.4 (2026-05-16)

- **UI tulkošana (padziļinājums)** – **`components/admin/admin-users-view.tsx`** (`t()` + **`Intl`**); **`admin-intros.tsx`**; **`AdminSystemPanel`**; auth **`auth-login-flow`**, **`auth-signup-flow`**, **`signup-form`**; **`generateMetadata`** + **`getUiPhraseForRequest`**; **`013`** pēc **`export_site_translations_sql.py`** (**`lv/en/fr/de/es/pt`**, vēlāk **`ru`** – sk. **0.2.10**). Turpinājums **0.2.5** – arī admin valodu/tulkošumu paneļi, **`/settings`** klients, **`/change-password`**.

### 0.2.3 (2026-05-16)

- **UI tulkošana** – saknes **`SubtrackIntlProvider`**, **`getPublicSiteTranslationsMerged`**, **`systemSiteName`** + vietturas **`{SYSTEM_NAME}`**, koda fallback **`lib/i18n/fallback-phrases.ts`**; navigācijas, admin čaula un sākumlappas blokā **`t('…')`**; **`012_site_translations_select_public.sql`** (anon/`authenticated` **SELECT** uz `site_translations`); **`013_site_translations_seed_subtrack_ui.sql`** (sēklas; ģenerēšana ar **`scripts/export_site_translations_sql.py`**); tulkošanu saglabājot **`revalidateTag('site-translations-public')`**.

### 0.2.2 (2026-05-16)

- **Sistēmas iestatījumi** – `database/supabase/012_system_settings.sql`: `public.system_settings` (nosaukums, `default_display_preferences`), `handle_new_user` kopē kombinētās preferences jaunā `users.display_preferences`; `/admin/system` forma (`AdminSystemPanel`, `saveSystemSettingsAction`); aplikācijas **`generateMetadata`** un `/settings` bāzes preferenču avots caur **`getPublicSystemSettings`** (keša tags `system-settings`).

### 0.2.1 (2026-05-16)

- **Mobilā – paziņojumi** – pilnekrāna fona slānis ar tumšu, caurspīdīgu pārklājumu un **backdrop blur** zem paziņojumu karties (`dash-notify-menu-backdrop`, `dash-alerts.js`, `subtrack.css`); paneļa `z-index` saskaņots ar lietotāja dropdown.
- **Lietotāja izvēlne** – tam pašam mobilajam fona slānim pievienots **blur**, lai vizuāli atbilstu paziņojumu overlay.
- **Augšējā josla** – paziņojumu un lietotāja izvēļņu savstarpēja izslēgšana (`CustomEvent`), lai netiktu duplicēti pilnekrāna overlay.

### 0.2.0 (2026-05-16)

- **Supabase** – servera/pārlūka klienti (`lib/supabase/*`), sesijas `middleware.ts`, OAuth/apmaiņas maršruts `app/auth/callback/route.ts`, ENV paraugi (`supabase.env.template`, `.env.example`).
- **Datubāze** – Postgres + RLS skripti `database/supabase/001` … `013` (ieskaitot **`languages.is_default`** un anon kataloga lasīšanu **`010`**, tulkošanu **`011`–`013`**).
- **Auth UX** – `/login`, `/signup`, `/forgot-password`, `/change-password` ar Server Actions un komponentēm (`signup-form`, `change-password-form`), peldošie toast kļūdām un ziņām (`flash-param-toast`, `auth-toasts-host`), sociālo pogu komponente.
- **Aizsargātie maršruti** – panelis, analītika, iestatījumi, admin; novirzes sesijas stāvoklim atbilstoši `middleware`.
- **Administrācija** – `/admin` un apakšlapas (`components/admin/*`), piekļuve tikai adminiem; **valodas** – CRUD + **noklusējuma valoda jaunajiem apmeklētājiem** (`public.languages.is_default`, `010` SQL, kolonna „Noklus.“, `lib/languages-catalog.ts`).
- **Admin lietotāju UI** – `/admin/users`: pilna platuma submenu + saturs mobilajā (`admin-body` stretch), tabulas **kompaktais** variants tikai **≤640 px** (kolonnas „Loma“/„Reģistrēts“ zem e-pasta, bez iniciāļu apļa); **virs 640 px** – kolonnas un aplis kā šķīvākā skatā (`styles/subtrack.css`).
- **Iestatījumi** – preferences JSON + sinhronizācija ar DB un `localStorage` (`006`, FS skats un klienta žogs kur nepieciešams).
- **Mobilā vide** – apakšējā navigācija (`mobile-bottom-nav`), admin horizontālā ritināšana šauros ekrānos; admin kolonnas izkārtojums un platuma līdzināšana ar augšējo joslu skatīt **Mobilā vide**.
- **Paneļa FS slānis** – skati `components/fs/*`, ielādes helpers; JS atjauninājumi `public/fs/js/` (ieskaitot paziņojumus `dash-alerts.js`; vecā `dash-notifications.js` aizstāta/noņemta).
- **Pārējās lietas** – navigācija ar sesijas darbībām un lietotāja izvēlni (`nav-session-actions`, `nav-user-menu`), palīgfunkcijas (`lib/auth/*`, `lib/user-display-preferences.ts`), `next.config.ts`, globālie/stila labojumi.

### 0.1.0 un agrāk

- Sākotnējais Next.js 16 / React 19 projekts ar FS prototipa importu un pirmo README (sk. git vēsturi: `ea3bc70`, `0233c26`).

## Licence

Privāts projekts. Precizē licenci publiskota repo gadījumā.
