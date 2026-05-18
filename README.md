# SubTrack (subtrack-web)

**Versija:** `0.3.33` (skatīt lapas lejas daļā **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**).

**SubTrack** ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. **Paneļa dati** (`/dashboard`, `/analytics`) lasās no **Supabase** (`public.subscriptions`, RLS); CRUD notiek caur **Route Handlers** (`app/api/subscriptions/*`) un sesijas sīkdatēm; prototipa **FS** JavaScript (`public/fs/js/`) renderē UI un izsauc API (kopā ar **Supabase Auth** un **`database/supabase/`** migrācijām).

## Galvenās iespējas (UI)

- **Sākumlapa** (`/`) - prezentācija, FAQ, saites uz **publiskajām demonstrācijām** **`/demo/dashboard`** un **`/demo/analytics`**, reģistrāciju un ieeju; **ar aktīvu sesiju** serveris novirza uz **`/dashboard`** (**`app/page.tsx`**, `redirect`). Ja **`/admin/system`** ir ieslēgts **maksas plāns**, viesiem rādās **cenu / brīvā līmeņa** bloks ar kafijas ilustrāciju (`#pricing`), **ievads** no kopīgā **`subscribe.hero.lead`** un **`landing.pricing.blurb`** ar **`{count}`** / **`{price}`**, dati no **`public.system_settings` + `SubtrackIntlProvider`**. Paneļa augšējās joslas **produkta nosaukuma** saite (**`components/nav-dash.tsx`**) ved uz **`/dashboard`**, nevis **`/`**.
- **Autentifikācija** - ieeja un reģistrācija caur **Supabase Auth** (Server Actions), OAuth (Google / Apple) **tikai tad**, ja **`public.integrations`** ir **`enabled`** uz **`login_google`** un/vai **`login_apple`** (admin: **`/admin/integrations`**; SSR lasīšana **`getLoginSocialIntegrationFlags`** – **`lib/integrations/login-social-flags.ts`**; pogas **`components/login-social-buttons.tsx`**; tulkošanas atslēgas **`auth.social.*`** – migrācija **`025_site_translations_auth_social_login.sql`**). **Aizmirstā parole** (`/forgot-password`), **mainīt paroli** (`/change-password` ar `changePasswordAction`, **`components/fs/change-password-fs-view.tsx`** + **`components/change-password-form.tsx`** – **`t()`** un **`auth.pass_strength.level_*`** kā signup, atkārtojums, paroles rādīšanas poga; vecā parole netiek vērtēta pirms „Saglabāt”). **Pieteikšanās / reģistrācijas** formu virknes un maršruta **`<title>`** seko izvēlētajai lokālei (**`components/auth/auth-login-flow.tsx`**, **`components/auth/auth-signup-flow.tsx`** + **`components/signup-form.tsx`**, **`getUiPhraseForRequest`** no **`lib/ui/server-ui-phrases.ts`**). **Reģistrācija** (`/signup`): e-pasta formāta validācija, paroles stipruma indikators, atkārtotās paroles pārbaude, e-pasta aizņemtība (**`signup_email_exists`**, `004_*`; pēc **`023_*`** izsaukums caur Server Action **`signupEmailExistsAction`** ar **`service_role`**, tāpēc `.env.local` ieteicams **`SUPABASE_SERVICE_ROLE_KEY`**; ja atslēgas nav, kods mēģina anon klientu – **pēc `023`** tā pārbaude parasti **neizdodas**, kamēr nav pievienota **`SUPABASE_SERVICE_ROLE_KEY`**). **Flash ziņojumi** (kļūdas un īsie info teksti no `?error=` / `?message=` un OAuth kļūdas) tiek rādīti kā **peldošie toast** (`components/flash-param-toast.tsx`, `components/auth-toasts-host.tsx`): apmerami auto-aizvēršanās, uzvedot kursoru virs ziņojuma taimeris apstājas, pēc kursora nost no jauna. Query parametri pēc rādīšanas tiek tīrīti ar `history.replaceState`, lai pārlādē neatkārtojas. Izmantošana: `/login`, `/signup`, `/forgot-password` (gatavs nākotnes redirectiem), `/change-password`.
- **Panelis** (`/dashboard`) - maksājumu kalendārs (ja vienā datumā vairāki maksājumi, šūnā **`+N`** apakšējā labajā stūrī; **šodienas** šūnai indikatora krāsa kā **ring** apmalei; **„atzīmēts samaksāts”** dienas **`localStorage`** **`subtrack_cal_paid_marked_v1`**; slēdzis **`subtrack_cal_include_paid_marks`** – ja atslēgas vēl nav, **noklusējums ieslēgts**; marķējums un skaidrojums **`SubtrackTooltip`** (hover / fokuss; **bez** pārlūka **`title`**), **`aria-label`** pieejamībai; kājenes **leģenda vienā rindā**), kopsavilkums, abonementu CRUD pret **`public.subscriptions`** (**`GET`/`POST` `/api/subscriptions`**, **`PATCH`/`DELETE` `/api/subscriptions/[id]`** ); ja admin ieslēdz **maksas plāna** ierobežojumu, **`POST`** atgriež **403** brīvā līmeņa **ierakstu skaita** sasniegšanā (**`paid_plan_active`** `public.users` – pašpārvaldei nē, skat. **`027`**); lietotāja izvēlnē pie avatāra **`fa-crown`**, ja **`paid_plan_active`**. Sākuma dati SSR bootstraps (**`#subtrack-subs-bootstrap-json`**); **FS JS** (`public/fs/js/dashboard.js` …) dabū frāzes un **`Intl`** lokāli pirms **`loadScriptOnce`**, jo **`app/dashboard/page.tsx`** renderē **`FsI18nBootstrap`** (skatīt **UI tulkošana**); kalendārā **lv** nedēļas dienu galvenes **Pr … Sv**; **pievienošanas / labošanas modālis** (`#modal-main`) – elpīgākas vertikālās atstarpes galvenajai formai un **Papildu opcijām** (**`styles/subtrack.css`**); augšējā joslā **paziņojumi** (tie paši dati no **`subscriptions`**; **šodienas** un **kavētie** ar **atzīmēšanu kā samaksātu** – API laikā **ielādes riņķis** un **neaktīva** poga, lai nepieļautu dubultklikšķi; tā pati uzvedība abonementu **sarakstā**; kopīga **`subtrackSetMarkPaidPending`** **`subscriptions-helpers.js`**); **gaidāmie** sākas no **nākamās dienas**; mobilajā skatā – pilnekrāna fons ar **backdrop blur**; abas izvēlnes nevar būt atvērtas vienlaikus). **Modālis – IKONA:** izvēlei **`fa-solid`** klases no **`FA_ICONS_ALL`** (`lib/fs-icons.ts`; ~**102** **`fa-solid`** klases – **nav** pilnās Font Awesome Free kopas, Free satur **daudz vairāk** ikonu nekā šīs ~102). Hintu josla un režģis „Parādīt visas“ **tā pati secība**; augšējā rinda – tikai tik pogas, cik **`dashboard.js`** aprēķina pēc **`#icon-picker-hints-shell`** (bez apgriešanas). Meklēšana ar sinonīmiem – **`lib/fs-icon-picker-search.ts`**, JSON **`#subtrack-icon-search-bootstrap`** (**`components/fs/dashboard-fs-view.tsx`**). Ja **maksas plāns** ieslēgts un lietotājam nav **`paid_plan_active`**, zem **„Pievienot”** ir saite **„Iegūt Pro”** uz **`/subscribe`**; šajā gadījumā **kalendāra kolonna** paneļī netiek rādīta (**`dashboard-overview-main--no-calendar`**).
- **Pro iepazīšanās** (`/subscribe`) – **`SubscribeProView`**: **`subscribe.hero.*`**, **`subscribe.free_tier.note`** ar **`{price}`** / **`{n}`** (EUR formātēts, brīvā līmeņa limits); **`subscribe.coffee.line`** noņemts (**`032_remove_subscribe_coffee_line.sql`** DB). Tulkošanas **`029`**, **`028`** / **`031`**, **`030`**, **`032`**, **`033`** (hero lead teksta precizējums).
- **Demonstrācijas** (`/demo/dashboard`, `/demo/analytics`) – **publiski** (nav **`proxy`** aizsargātas kā `/dashboard`); **`/demo/dashboard`** lieto to pašu **`DashboardFsView`** + **`public/fs/js/dashboard.js`** kā **`/dashboard`** (kalendārs, modāļi, CRUD pogas); **API netiek izsaukti** (`window.__SUBTRACK_DEMO_DASHBOARD__`). **Paziņojumu zvans** (`DashNotifyDropdown`) rāda parauga sarakstu arī viesiem; analītikas demo `window.__SUBTRACK_DEMO_ANALYTICS__`. Papildu parauga maksājumi (kavētie, šodien, nākamajā nedēļā) un analītikas kopsavilkums veidojas no tiem pašiem datiem. **`/demo/analytics`** – izkārtojums kā analītika (kopsavilkumi, kategorijas; **nav** izmaksu tendences/prognozes diagrammas). Ar **`paid_plan_enabled`** sākumlapas hero rāda **`landing.hero.calendar_mock_paid_note`**. Tulkošanas **`034`**, **`036`**, **`037`**, **`041`**, **`demo.*`**.
- **Analītika** (`/analytics`) - kopsavilkumi, kategoriju joslas un **CSS donut** sadalījums (`demo-analytics-*`, kā demo; bez Chart.js CDN); **`FsI18nBootstrap`** + **`public/fs/js/analytics.js`** (**`app/analytics/page.tsx`**). Ja **`paid_plan_enabled`**, maršruts **`/analytics`** tikai ar **`users.paid_plan_active`** (**`canAccessAnalytics`**, citādi **`redirect('/dashboard')`**). Brīvā līmenī **nav** analītikas saites augšējā joslā un mobilajā navigācijā (**`nav-dash.tsx`**, **`nav-landing.tsx`**, **`mobile-bottom-nav.tsx`** – **`showAnalytics`**). Publiskā **`/demo/analytics`** paliek viesiem; sākumlapas **„Explore”** kartē – **`landing.explore.analytics.pro_hint`** un **`/demo/analytics`**.
- **Iestatījumi** (`/settings`) - preferences: **`public.users.display_preferences`** (JSON), DB sinhronizācija + dublējums `localStorage` (kad ir migrācija `006_*`). Forma **`components/fs/settings-fs-view-client.tsx`** ar **`useSubtrackIntl`**; **`app/settings/page.tsx`** kārto **`languages`** atlasi ar **`Intl.Collator`** pēc **`resolveRequestUiLocales`** (nevis fiksētu `lv-LV`). **Saskarnes valoda** – pēc izvēles tiek uzreiz **`applyUiLocaleInBrowser`** + **`writeDisplayPreferencesToLocalStorage`** + **`updateSessionDisplayPreferences`** (`lib/auth/display-preferences-client.ts`) + **`router.refresh()`**, lai **`app/layout.tsx`** (**`SubtrackIntlProvider`**, tulkošanas `dbMap`) atbilstu jaunajai lokālei. **Ielogots:** SSR lokāle no profila (`interface_language_code`), nevis sīkdatnes; **`mergeDisplayPreferencesFromSources`** ar **`prioritizeDbInterfaceLanguage`** – profila valoda pār **`localStorage`**. **Viesis:** sīkdatne **`subtrack_ui_locale`**. **Nav josla** (`NavUiLanguageSwitcher`) ielogotam lietotājam saglabā to pašu profila JSON. Bāzes noklusējumi no **`public.system_settings`** (`012`), ja nav lietotāja ieraksta; `/admin/system` ietekmē jaunos kontus un formas bāzi.
- **Administrācija** (`/admin`, `/admin/users`, `/admin/languages`, `/admin/translations`, `/admin/integrations`, `/admin/system`) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne. **Ikonu tooltipi** admin tabulās – **`SubtrackTooltip`** (`components/subtrack-tooltip.tsx`): melns burbulis, teksts portalā uz **`document.body`** (`position: fixed`), lai **`admin-table-wrap`** `overflow` to neapgriež; uz **touch / coarse pointer** nerāda (**`useSupportsHoverTooltip`**). **Lietotāji** – servera lapa **`app/admin/users/page.tsx`** atlasa datus; **`components/admin/admin-users-view.tsx`** (klienta): **`IERAKSTI`** kolonna rāda **kopējo abonementu skaitu** uz lietotāju (bez sadalījuma pa kategorijām); ja **`paid_plan_enabled`**, arī **VIP** slēdzis (`users.pro_vip`, **`POST /api/admin/users/pro-vip`**, RPC **`admin_set_user_pro_vip`**); **Pro** vizuāli – **kronītis** pie avatāra; **Administrators** birka zem e-pasta; **`Intl`** datumi. Admin kopsavilkumi (RLS + **`008`**). **Vadteksti** (īsi intro, bez tabulu `<code>` un liekiem hintiem) – **`components/admin/admin-intros.tsx`**, **`045_*`**. **Sistēma** – panelis **`AdminSystemPanel`** (tulkošanu atslēgas formas virsrakstiem un kļūdām; dažu **`<select>` opciju** iekšējā teksta vēl var atšķirties). **Sistēma** (`/admin/system`) dati: **`012_system_settings.sql`**, Server Actions **`lib/admin/system-actions.ts`**, publiskā nosaukuma lasīšana **`lib/system-settings-public.ts`**. **Valodas** – CRUD pret **`public.languages`**, noklusējuma valoda jaunajiem apmeklētājiem (**`010`**; Server Actions **`lib/admin/languages-actions.ts`**, **`components/admin/admin-languages-panel.tsx`**; pamatā **`007`**); saraksta **`Intl.Collator`** – pēc pašreizējās UI lokāļa. **Integrācijas** – **`public.integrations`** (tehniska atslēga, nosaukums, `enabled`), Server Actions **`lib/admin/integrations-actions.ts`**, **`app/admin/integrations/page.tsx`**, **`components/admin/admin-integrations-panel.tsx`**; migrācija **`024_integrations.sql`**; **SELECT** visa pasaule (lasāms arī no API/feature flagām), rakstīt tikai admins; pēc mutācijas – **`revalidatePath`** arī **`/login`** un **`/signup`**. SSO karodziņas: **`login_google`**, **`login_apple`** (skatīt **Autentifikācija** augšā). **Tulkojumi** - **`public.site_translations`**: **`components/admin/admin-translations-panel.tsx`** + **`AdminTranslationsIntro`** (`titleActions`: poga vienā rindā ar virsrakstu); **modāļi** jaunai atslēgai un labošanai; tabulā **atslēga + teksts tikai aktīvajai UI lokālei**; **meklētājs** pilnā platuma rindā; **bez meklēšanas** papildu rindas ar **IntersectionObserver** (lazy DOM), **ar meklēšanu** filtrs pār **visu** servera ielasīto katalogu (`loadAdminTranslationsData`). Migrācija **`011`**; publiskā **SELECT** – **`012_site_translations_select_public.sql`**; sēkla – **`013_site_translations_seed_subtrack_ui.sql`**, skatīt **[UI tulkošana](#ui-tulkošana)** (**`python scripts/export_site_translations_sql.py`** pēc **`fallback-phrases.ts`** izmaiņām). Atšķiras **prototipa paneļu** vai citu **`components/fs/*`** vietu līmenis par fiksētām virknēm – papildināšana vienmēr ar **`t('…')`**. Admin pazīme: RLS un RPC **`current_user_is_admin`** (pēc **`023`** – **`SECURITY INVOKER`**). Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~768 px platums)

Šaurām ekrānplatēm horizontālā augšējā navigācija ir slēpta; vietā **`components/mobile-bottom-nav.tsx`** liek peldošu, daļēji caurspīdīgu **apakšējo navigāciju** („glass’’ pill): ielogoti – Panelis / Analītika (tikai ja atļauta **`/analytics`** – ar **`paid_plan_active`**, ja ieslēgts maksas plāns) / Administrācija (adminiem); **`/demo/*`** lapās – demo panelis / demo analītika / mājas (`/`) vai **Admin**; bez sesijas sākumlapā - Iespējas / Demonstrācija / FAQ. `position: fixed` tiek pārnests uz **`document.body`** ar **`createPortal`**, lai izkārtojums vienmēr balstās pret viewport.

**ADMIN sadaļā** (`@media (max-width: 768px)`, `styles/subtrack.css`): izkārtojums kolonnā (`admin-body`); **`align-items: stretch`**, lai **submenu josla un galvenais saturs** aizpildītu to pašu platumu kā augšējā josla (`dash-topbar-shell`), nevis sarautos pa kreisi. Apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

**`/admin/users` tabula**: ļoti šaurā skatā (**≤640 px**) kolonnas „VIP“ un „Reģistrēts“ tiek rādītas zem e‑pasta, iniciāļu aplis paslēpts (**Pro** kronītis tad zem e‑pasta); **virs 640 px** redzamas **pilnas kolonnas** un **iniciāļu aplis** ar kronīti, ja kontam ir **Pro** (apmaksāts vai VIP).

**Paziņojumi (`@media (max-width: 768px)`)** – **`public/fs/js/dash-alerts.js`** paneli pozicionē ar `position: fixed` pret viewport un platuma **clamp**, lai karte neaizslīd malā. **`components/nav-session-actions.tsx`** satur pogu **`#dash-notify-backdrop`**; kad panelis ir vaļā, tiek lietots tas pats slāņošanas modelis kā lietotāja izvēlnei (`z-index` fons **188**, karte **200**, `styles/subtrack.css`). Fona slānim ir **`backdrop-filter: blur(12px)`** (un **`prefers-reduced-motion`** – bez blur). **`components/nav-user-menu.tsx`** un **`dash-alerts.js`** savstarpēji aizver otras izvēlnes, izmantojot `CustomEvent` (`subtrack:notify-opened` / `subtrack:user-menu-opened`), lai nepārlietotu divus pilnekrāna overlay. **Visās platēm:** zvana poga strādā arī pēc React klienta navigācijas un ātrās skriptu ielādes – klikšķa delegēšana uz **`document` (capture)** un pēc ielādes **`components/authed-notify-bootstrap.tsx`** izsauc globālo **`window.fsBootDashAlerts()`**, lai sakristu ar DOM.

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | `styles/subtrack.css` (no `FS` prototipa); `app/globals.css` – pēc **`@import ../styles/subtrack.css`** arī **login sociālais** tweaks un **`admin-integration-*` / `admin-switch*`** (admin integrācijas slēdzis), lai **Turbopack + `@tailwindcss/postcss`** neuzrādītu **`CssSyntaxError`** lielākā vienotā **`subtrack.css`** importā; skatīt komentārus failā |
| Ikonas | Font Awesome 6 **Free** (`app/layout.tsx` CDN): navigācijā / admin u.c. **inline SVG**; paneļa abonementa **ikona** – atlasīts **`fa-solid`** **klases** saraksts **`lib/fs-icons.ts`** (**~102** vienības `FA_ICONS_ALL`), **tikai šis apakškopums**, ne visa FA bibliotēka; licences jēga – skatīt [Font Awesome licenci](https://fontawesome.com/license/free). Meklēšanas sinonīmi panelī: **`lib/fs-icon-picker-search.ts`** |
| Demo paneļi | `public/fs/js/*.js` (kalendārs, modāļi, paziņojumi; **`/dashboard`** CRUD pret `/api/subscriptions`; **`/demo/dashboard`** – tas pats UI, bez API; analītika – **`/fs/js/analytics.js`** kategoriju donut kā demo) |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `proxy.ts`, `database/supabase/*.sql` |

## Maršrutu aizsardzība (`proxy.ts` → `lib/supabase/middleware.ts`)

- **Sesijas nav**: **`/dashboard`**, **`/analytics`**, **`/settings`**, **`/subscribe`**, **`/change-password`**, **`/admin`** (kopā `/admin/*`) - novirze uz **`/`**. **`/demo/dashboard`** un **`/demo/analytics`** ir **publiski** (demonstrācija ar parauga datiem).
- **Sesija ir**: **`/login`**, **`/signup`**, **`/forgot-password`** - novirze uz **`/dashboard`** (proxy **`GUEST_ONLY_PATHS`** iekš `lib/supabase/middleware.ts`).
- **Sesija ir + saknes `/`**: papildus **`app/page.tsx`** izsauc **`redirect('/dashboard')`** (sākumlapas saturs tikai viesiem).

Sesijas cookie atjaunošana arī šeit; saknes **`proxy.ts`** izsauc `updateSession`.

## Navigācija un veiktspēja (kopīgas sajūtas)

Pat salīdzinoši mazā lietotnē **`App Router`** maršruta maiņa parasti nav tūlītēja kā **klasiskajās vienlapās** (pilnīgi lokālā CSR pāreja): klients gaida **React Server Components (Flight)** payload no servera, tāpēc reizēm šķiet, ka **„kaut kas velkas, tad tikai pārslēdzas“**. Turklāt:

| Ko dara projekts | Sekas |
|------------------|--------|
| **`proxy`** (`updateSession`) | uz maršruta / bieži arī **`<Link prefetch>`** pieprasījumu izsauc **`supabase.auth.getUser()`** – papildus tīkla solis pret Supabase katrā ceļā. |
| **Aizsargātās lapas** | **`getSessionUserDisplay`**, **`fetchSubscriptionsForSession`** un **`requireAdminUser`** dalās **`loadAuthContext`** (**`lib/auth/load-auth-context.ts`**) – viens **`getUser()`** + viens servera Supabase klients uz RSC pieprasījumu. |
| **`current_user_is_admin` RPC** | **`resolveSessionIsAdmin`** (**`lib/auth/is-admin.ts`**) kešo RPC uz vienu klienta instanci vienā renderī (funkcija pēc **`023`** – **INVOKER**). |
| **`/admin/*`** (**`app/admin/layout.tsx`**) | **`requireAdminUser`** tad **`getSessionUserDisplay`** – vairs nav atkārtota **`getUser()`** un nav otra tā paša RPC vienā pieprasījumā (ja nepieciešams, **`users.is_admin`** joprojām kā rezerves datu avots). |
| **Saknes layout** (**`app/layout.tsx`**) | **`cookies()`** / **`headers()`** padara shell **dinamisku**; **`getPublicSiteTranslationsMerged`** joprojām dod **lielu** `dbMap` (**`SubtrackIntlProvider`** ar **`paidPlan`**); **`unstable_cache`** mazina DB slogu. **`getLanguagesCatalog`** ir arī **`react/cache`** vienam pieprasījumam. |
| **`generateMetadata` / `getUiPhraseForRequest`** | **`resolveRequestUiLocales`** un sapludinātais tulkošanu objekts (**`lib/ui/server-ui-phrases.ts`**) tiek **memoizēti** uz dokumenta pieprasījumu. **`getSystemSiteName`** (**`generateMetadata`** + layout) – viens izsaukums uz pieprasījumu. |

**`<Link prefetch={false}`** (admin, iestatījumi, parole, izvēlnes „Panelis”) samazina fonā **`proxy`** / prefetch slogu; **`/dashboard`** ↔ **`/analytics`** galvenajā nav izslēgts prefetch.

**`<Link>`** citur noklusējumā (**prefetch**) var sākt līdzīgu darbu **pirms** klikšķa. Tiešām izmaiņu meklēji sāk **`lib/supabase/middleware.ts`**, **`lib/auth/load-auth-context.ts`**, **`lib/ui/server-ui-phrases.ts`**, **`app/layout.tsx`**.

## Supabase iestatīšana

1. Izveido projektu [supabase.com](https://supabase.com).
2. **Project Settings → API** : URL un anon atslēga.
3. Projekta saknē `.env.local` (paraugu skatīt **`supabase.env.template`**):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<projekts>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-atslēga>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   # Pēc SQL 023: signup e-pasta pārbaude (service_role RPC) – no Dashboard → Settings → API:
   # SUPABASE_SERVICE_ROLE_KEY=<service_role_atslēga>
   ```

4. **Authentication → URL Configuration**: redirect URIs (piem. `…/auth/callback`). **OAuth (Google / Apple)** – providerus ieslēdz Supabase pusē (**Authentication → Providers**); aplikācijā pogas **`/login`** un **`/signup`** rādās tikai tad, kad **`/admin/integrations`** **`login_google`** un/vai **`login_apple`** ir **`enabled`** (skatīt **`024_integrations.sql`**).

5. **Supabase Security Advisor / Auth paroles (ieteicams):**
   - Palaid SQL **`022_security_advisor_hardening.sql`** un **`023_security_advisor_rpcs.sql`** secīgā kārtā (sk. zemāk sarakstā).
   - **Leaked password protection** (HaveIBeenPwned): **Authentication** → **Providers** → **Email** – ieslēdz aizsardzību pret zināmām noplūdušām parolēm. **Piezīme:** pēc [Supabase dokumentācijas](https://supabase.com/docs/guides/auth/password-security) šis ir **Pro plāns un augstāk**; Free projektā Advisor brīdinājums var **palikt** arī pēc pareizas konfigurācijas.

6. **SQL** (secībā pēc vajadzības):
   - **`database/supabase/001_initial_schema.sql`** - tabulas, RLS, trigeri. Ja Postgres sūdzas par `execute function` pie `auth.users` triggera, skatīt faila komentāru par `execute procedure`.
   - **`database/supabase/015_users_rls_protect_privileged_columns.sql`** – `public.users`: politika **`users_update_own`** ar papildu `WITH CHECK`, lai ar parasto Supabase klientu netiktu mainīti **`is_admin`** un **`email`** (novērsti privilēģiju pacelšanu); pēc **`001`** (**obligāti** produkcijas vidē ja `001` bija palaista vecajā variantā bez šī papildinājuma). Apraksts: **`security_check.md`**.
   - **`database/supabase/016_sync_public_users_email_from_auth.sql`** – trigeris uz **`auth.users`**: **`public.users.email`** sinhronizācija no Auth pēc e-pasta maiņas (**M1**). Pēc **`001`**/`015`. Ja DB sūdzas par `execute function`, pamēģini `execute procedure` ( kā **`001`** ).
   - **`database/supabase/017_site_translations_fs_dashboard_api.sql`** – **`site_translations`** ieraksti API un „atzīmēts samaksāts” ziņām (**`fs.dashboard.toast_api_*`**, **`notify_paid_today_*`**). Pēc **`012`**.
   - **`database/supabase/018_site_translations_dashboard_empty_state.sql`** – **`fs.dashboard.empty_lead`** (īsāks teksts); **`empty_secondary`** – **`DELETE`** no DB (nav tukšu `INSERT`). Pēc **`012`**.
   - **`database/supabase/019_site_translations_optional_term_dates.sql`** – **`fs.dashboard.advanced_hint_credit`**: termiņa datumi kā neobligāti (progress josla tikai ja abi lauki). Pēc **`012`**.
   - **`database/supabase/020_site_translations_dashboard_subscription_optional_fields.sql`** – paneļa ziņas: galvenais nosaukums obligāts tikai ar papildu rindām; papildu rindai – nosaukums, ja aizpildīts jebkurš lauks; saraksta „bez nosaukuma’’ teksts. Pēc **`012`**.
   - **`database/supabase/021_site_translations_notify_empty_state.sql`** – **`session.notify_empty_lead`**: paziņojumu paneļa tukšais stāvoklis; **`session.notify_empty_hint`** dzēsts no DB. Pēc **`012`**.
   - **`database/supabase/022_security_advisor_hardening.sql`** – Supabase **Security Advisor**: `set_updated_at` ar fiksētu **`search_path`**, trigeru funkcijām **revoke EXECUTE** no `anon`/`authenticated`, admin RLS politikas uz **`to authenticated`**, **`current_user_is_admin`** RPC sākotnēji tikai **`authenticated`** (pilnīgai Advisor atbilstībai skat. **`023`**). **ielekto paroļu aizsardzību** ieslēdz Auth iestatījumos. Pēc **`003`**, **`007–012`**, **`016`**.
   - **`database/supabase/023_security_advisor_rpcs.sql`** – **`current_user_is_admin`** → **`SECURITY INVOKER`** (no DEFINER brīdinājuma); **`signup_email_exists`** → **EXECUTE tikai `service_role`**. Serverim jāiestata **`SUPABASE_SERVICE_ROLE_KEY`** (`supabase.env.template`); signup forma izmanto to caur **`signupEmailExistsAction`**. Pēc **`022`**.
   - **`database/supabase/024_integrations.sql`** – tabula **`public.integrations`** (`integration_key`, `label`, `enabled`), RLS: **SELECT** visiem sesijas stāvokļiem **`USING (true)`**; **`INSERT`/`UPDATE`/`DELETE`** tikai adminiem. **`/admin/integrations`**; OAuth pogas **`/login`** un **`/signup`** – **`login_google`**, **`login_apple`**.
   - **`database/supabase/025_site_translations_auth_social_login.sql`** – tulkošanas atslēgas **`auth.social.*`** (OAuth pogas teksti). Pēc **`012`**.
   - **`database/supabase/026_site_translations_dashboard_cal_toggle.sql`** – paneļa kalendāra slēdzis (**`fs.dashboard.cal_toggle_all_payments_*`**). Pēc **`012`**.
   - **`database/supabase/027_paid_plan.sql`** – **`system_settings`**: `paid_plan_enabled`, `paid_plan_price_eur`, `paid_plan_free_subscription_limit`; **`users.paid_plan_active`**; **`users_update_own` papildu `WITH CHECK`** (klients nevar pats ieslēgt maksas plānu). Pēc **`012`**, **`015`**.
   - **`database/supabase/028_site_translations_paid_plan.sql`** – tulkošanas atslēgas admin formai, sākumlapas cenai, kronītim, API kļūdai. Pēc **`012`**.
   - **`database/supabase/029_site_translations_subscribe.sql`** – **`/subscribe`** Pro lapa un paneļa **`dashboard.link_get_pro`**. Pēc **`012`**.
   - **`database/supabase/030_remove_subscribe_cta_translations.sql`** – dzēš **`subscribe.cta.*`**, ja tās jau bija DB (pēc vecā **`029`**). Pēc **`029`** (vai aplūkot, ja **`029` vairs neieliek šīs atslēgas).
   - **`database/supabase/031_subscribe_remove_reminders_benefit.sql`** – dzēš **`subscribe.benefit.reminders.*`**; atjaunina **`admin.forms.paid_plan_hint`** (atgādinājumu panelis visiem). Pēc **`028`** / **`029`**.
   - **`database/supabase/032_remove_subscribe_coffee_line.sql`** – dzēš **`subscribe.coffee.line`**, ja vēl DB (pēc vecā **`029`**).
   - **`database/supabase/033_site_translations_subscribe_hero_lead.sql`** – atjaunina **`subscribe.hero.lead`** (kafija + „neaizmirst maksājumus”), ja DB jau bija ar vecāku **`029`**.
   - **`database/supabase/034_site_translations_demo_pages.sql`** – tulkošanas atslēgas **`demo.*`**, **`meta.title.app.demo.*`** (publiskās **`/demo/dashboard`**, **`/demo/analytics`** lapas). Pēc **`012`**.
   - **`database/supabase/035_site_translations_landing_mock_sample_bill.sql`** – **`landing.mock.sample_bill_name`** (piem. `en` → „Phone bill”); noņem **`demo.analytics.next_name_sample`**. Pēc **`012`**.
   - **`database/supabase/036_site_translations_landing_paid_plan_ux.sql`** – maksas plāna UX sākumlapā un navigācijā (**`landing.hero.calendar_mock_paid_note`**, **`landing.explore.*`**, **`nav.analytics_demo_hint`**, **`nav.pro_badge`**). Pēc **`012`**.
   - **`database/supabase/037_site_translations_demo_dashboard_fs.sql`** – demonstrācijas paneļa parauga nosaukumi (**`demo.dashboard.*`**) un **`fs.dashboard.toast_demo_only`**. Pēc **`012`**.
   - **`database/supabase/038_site_translations_landing_mock_payments_heading.sql`** – paneļa / hero **`landing.mock.subscriptions_title`** / **`subtitle`** („maksājumi” visās lokāļu). Pēc **`012`**.
   - **`database/supabase/039_site_translations_demo_device_watch_names.sql`** – demo ierīču parauga vārdi **`demo.dashboard.device_watch_*`** (lokāli tipiski, nav „Zane”/„Sandris” katrā valodā). Pēc **`012`**.
   - **`database/supabase/040_site_translations_landing_mock_payments_labels.sql`** – **`landing.mock.stat_active_label`**, **`landing.mock.subscription_list_heading`** („maksājumi”). Pēc **`012`**.
   - **`database/supabase/041_site_translations_demo_dashboard_mock_payment_names.sql`** – **`demo.dashboard.mock_*`**: parauga maksājumu nosaukumi (kavētie, šodien, nākamajā nedēļā) demo panelī / analītikai. Pēc **`012`**.
   - **`database/supabase/042_site_translations_nav_ui_language.sql`** – **`nav.ui_language_*`**: globālā saskarnes valodas izvēlne (ARIA teksti). Pēc **`012`**.
   - **`database/supabase/043_users_pro_vip.sql`** – **`users.pro_vip`** un **`users_update_own`** `WITH CHECK` (klients nevar mainīt VIP); SECURITY DEFINER **`admin_set_user_pro_vip`**. Pēc **`027`**.
   - **`database/supabase/044_site_translations_admin_users_pro_vip.sql`** – admin lietotāju tabulas un **`api.admin.pro_vip.*`**. Pēc **`012`**.
   - **`database/supabase/045_site_translations_shorter_admin_ui_hints.sql`** – īsāki admin intro teksti; **`admin.forms.preview_intro`**; **`fs.dashboard.advanced_hint_devices`** (lv „termiņu”). Pēc **`044`**.
   - **`database/supabase/046_site_translations_landing_faq_public.sql`** – sākumlapas FAQ produkcijas teksti (konta dati, mobilais, pārlūks, demo vs konts); dzēš novecojušās **`landing.faq.q_ready`** / **`a_ready`**. Pēc **`012`**.
   - Opcionāli **`002_migrate_profiles_to_users.sql`**, ja projektā bijusi vecā `profiles` shēma.
   - **`database/supabase/003_admin_users_select_policy.sql`** - **`current_user_is_admin()`** (sākotnēji **SECURITY DEFINER**; pēc **`023`** – **SECURITY INVOKER**) + SELECT politika **`users_select_all_if_admin`**. Tas ļauj adminiem (`is_admin > 0`) lasīt visu `public.users` sarakstu **bez** RLS rekursijas. Vecais variants ar `EXISTS (SELECT … FROM public.users …)` politikā izraisīja kļūdu `infinite recursion detected in policy for relation users` - ja to redzi, palaid šo failu **pilnībā** vēlreiz. Bez `003` anon sesijā admin lapa redz tikai savu rindu. **Pēc `022`/`023` politikas un grants atbilst jaunajai kārtībai** (Atkārtota palaišana ir idempotenta, ja izmanto jaunākos failus.)
   - **`database/supabase/004_signup_email_exists_rpc.sql`** - sākotnēja `signup_email_exists` (`SECURITY DEFINER`). **Pēc `023`:** `EXECUTE` tikai **`service_role`**; aplikācija izsauc caur **`signupEmailExistsAction`** ar **`SUPABASE_SERVICE_ROLE_KEY`**. Bez migrācijas **`023`** un bez atslēgas – vecais anon izsaukums var vairs nedarboties pēc grants maiņas.
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

7. **Administrators (`is_admin`)** – vienīgi **Dashboard SQL** vai ar **service_role** (skatīt **`security_check.md` H3**), piem.:

   ```sql
   update public.users set is_admin = 1 where lower(trim(email)) = lower(trim('tev@epasts'));
   ```

8. `npm run dev`. Serverī `createServerSupabaseClient()` (`lib/supabase/server.ts`), pārlūkā `createBrowserSupabaseClient()` (`lib/supabase/client.ts`). Servera **`service_role`** klients: **`lib/supabase/service-role-client.ts`** (tikai ar `SUPABASE_SERVICE_ROLE_KEY`).


## UI tulkošana

Virknes UI: **`useSubtrackIntl().t('atslēga')`**, dati no **`site_translations`**, trūkstot - no **`FALLBACK_PHRASES`** (`lib/i18n/fallback-phrases.ts`).

- **Lokāle** – **`resolveUiLocaleCodeForRequest`** (`lib/ui/ui-locale-from-request.ts`), izsaukts caur **`resolveRequestUiLocales`** (`lib/ui/server-ui-phrases.ts`): **ielogots** – `users.display_preferences.interface_language_code` → **`Accept-Language`** (sīkdatne **`subtrack_ui_locale` netiek lietota SSR); **viesis** – sīkdatne → **`Accept-Language`**, salīdzinājumā ar **`public.languages`** (`getLanguagesCatalog`). Saknes **`app/layout.tsx`** un **`<html lang>`** (`localeCodeToHtmlLang`) izmanto to pašu atrisinājumu; **`HtmlLangBridge`** viesim var sinhronizēt no **`localStorage`**, ielogotam – tikai servera lokāli. **`/settings`** un **`NavUiLanguageSwitcher`** – skatīt **Iestatījumi**; pēc maiņas **`router.refresh()`**, lai **`SubtrackIntlProvider`** atjaunotos.
- **Serveris** - saknes **`app/layout.tsx`** paraleli ielādē **`getPublicSiteTranslationsMerged(locale, defaultLocale)`** (`lib/site-translations-public.ts`, anon Supabase klients + **`unstable_cache`**, tags **`site-translations-public`**) un **`getSystemSiteName()`** (`system-settings-public`), tad ietin saturu **`SubtrackIntlProvider`** (`locale`, **`systemSiteName`**, **`dbMap`**).
- **Lappušu `<title>` (App Router)** - daudzos maršrutos **`generateMetadata`** izsauc **`getUiPhraseForRequest('meta.title.*')`** (`lib/ui/server-ui-phrases.ts`; tās pašas lokāļa izvēles kā layout), piem.: **`/admin/*`**, **`/login`**, **`/signup`**, **`/dashboard`**, **`/analytics`**, **`/settings`**, **aizmirstā parole / mainīt paroli**.
- **Klients** - **`useSubtrackIntl().t('atslēga')`**: vispirms vērtība no DB mapes, citādi **fallback** no **`lib/i18n/fallback-phrases.ts`** (`pickFallbackPhrase`); rezultātā vietturu aizvietošana (**`{SYSTEM_NAME}`** / **`{SISTEM_NAME}`**) ar **`system_settings.system_name`** (`applySystemNamePlaceholders`). Datuma/mēneša formatēšanai atsevišķi izmanto **`Intl`** ar **`uiLocaleCodeToBcp47ForIntl`** (`lib/ui/ui-locale-from-request.ts`).
- **FS demo scripts** – **`app/dashboard/page.tsx`** / **`app/analytics/page.tsx`** (Server Component): **`getUiPhrasesForRequest(fs*PhraseKeys)`** (`lib/ui/server-ui-phrases.ts`, atslēgu saraksti **`lib/fs/fs-page-i18n-keys.ts`**) + **`FsI18nBootstrap`** (`components/fs/fs-i18n-bootstrap.tsx`) bez **`use client`**, lai inline **`<script>`** izpildītos dokumenta parsē laikā (`window.__SUBTRACK_FS_I18N`, **`window.__SUBTRACK_FS_META.intlLocale`**). Tikai tad **`DashboardFsView` / Analytics** **`loadScriptOnce('/fs/js/…')`**. Paneļa JS lasa frāzes (piem. globālais **`FsT`**) **`public/fs/js/subscriptions-helpers.js`**, **`dashboard.js`**, **`analytics.js`**).
- **Sēkla / SQL** - pēc izmaiņām **`FALLBACK_PHRASES`** palaid **`python scripts/export_site_translations_sql.py`** – tiek pārrakstīts **`database/supabase/013_site_translations_seed_subtrack_ui.sql`**. Importē Supabase SQL Editor (kā pārējās migrācijas). **Atsevišķas tulkošanu migrācijas** (piem. **`025_*`** **`auth.social.*`**, **`026_*`** kalendāra slēdzim, **`029_*`** **`/subscribe`**, **`030_*`**, **`031_*`**, **`032_*`**, **`033_*`**) arī pēc **`012`**; kodā turēt līdz **`fallback-phrases.ts`** līdzvērtības.
- **Admin** - saglabājot tulkojumus, **`lib/admin/translations-actions.ts`** izsauc **`revalidateTag('site-translations-public', 'default')`**, lai atsvaidzinātu publisko kešu.

## Struktūra (īsumā)

```
app/                      # App Router + `generateMetadata` ar tulkošanas atslēgām kur attiecas
app/globals.css           # `@import` `subtrack.css`; papildu CSS (login sociālais tweak, admin integrāciju slēdzis – sk. Tehniskais steks)
app/api/subscriptions/    # autentificēts CRUD (cookie sesija, Supabase server klients)
components/               # nav-landing, nav-dash (paneļa augšējā josla), subtrack-intl-provider, auth/*, signup-form …
components/subtrack-tooltip.tsx  # admin (u.c.) hover tooltipi: portal + fine-pointer; stili `subtrack.css`
components/auth/          # auth-login-flow.tsx, auth-signup-flow.tsx (kartīšu saturs lokālei)
components/admin/         # admin-shell, admin-users-view, admin-intros, paneļu formas …
components/fs/            # Paneļa / analītikas skati; `fs-i18n-bootstrap.tsx` – servera inlīnas `window.__SUBTRACK_*` pirms /fs/js
lib/admin/                # Server Actions: `system-actions.ts`, `languages-actions.ts`, `integrations-actions.ts`, `translations-actions.ts` …
lib/system-name-placeholder.ts # {SYSTEM_NAME} aizvietošana `t()` ceļā
lib/system-settings-public.ts  # anon kešots sistēmas nosaukums + display prefs pamats
lib/site-translations-public.ts  # anon kešots `site_translations` merge sabiedriskajam UI
lib/ui/server-ui-phrases.ts     # `getUiPhraseForRequest`, `getUiPhrasesForRequest` (bulk), `resolveRequestUiLocales`
lib/ui/ui-locale-from-request.ts  # `resolveUiLocaleCodeForRequest` (profils vs sīkdatne)
lib/auth/display-preferences-server.ts  # `getSessionDisplayPreferencesRow`, `getSessionInterfaceLanguageCode`
lib/auth/display-preferences-client.ts  # `updateSessionDisplayPreferences` (settings + nav valodas slēdzis)
lib/use-supports-hover-tooltip.ts  # `(hover: hover) and (pointer: fine)` – SubtrackTooltip ieslēgšana
lib/fs/fs-page-i18n-keys.ts      # tulkošanas atslēgu saraksti FS demo (`/dashboard`, `/analytics`)
lib/fs-icons.ts            # paneļa atļautās FA Solid klases (`FA_ICONS_ALL`)
lib/fs-icon-picker-search.ts  # ikonu meklēšanas baiti / bootstrap (`haystack`, sinonīmi) pirms `dashboard.js`
lib/i18n/                 # FALLBACK_PHRASES (`fallback-phrases.ts`) un apkārtējā palīgfunkcionalitāte
lib/auth/                 # user-display, is-admin, password-strength, require-admin, actions (ieskaitot changePassword)
lib/subscriptions/        # `analytics-access.ts` (`canAccessAnalytics` – klients bez `next/headers`); `dashboard-free-tier-gate.ts` (live `paid_plan` lasījums, re-eksporte arī `canAccessAnalytics`)
lib/integrations/       # SSR lasāmas funkciju karodziņas (OAuth: `login-social-flags.ts`)
lib/user-display-preferences.ts  # display_preferences forma + **`mergeDisplayPreferencesFromSources`** (DB + LS; opcija **`prioritizeDbInterfaceLanguage`**)
lib/languages-catalog.ts  # kešots valodu katalogs + noklusējuma `code` (anon lasījums)
lib/supabase/             # anon/server klienti, `service-role-client.ts` (service_role tikai serverim), sesijas loģika (+ **rate limit** – skatīt `proxy.ts`)
proxy.ts                  # **rate limit** auth ceļiem, tad `updateSession` + redirecti; sk. **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**
database/supabase/        # Postgres + RLS (`001` … `033` utt.)
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

**Ja izstrādē konsolē vai pārlūkā parādās:** `Router action dispatched before initialization` (**`use-action-queue`**, **`hmrRefresh`**) vai **`ChunkLoadError` / `Failed to load chunk`** (`/_next/static/chunks/...`) – tipiska **Next.js 16 Turbopack** HMR / fragmentu sacīkste (parasti tikai **`next dev`** bez **`--webpack`**). **Risinājums:** apturēt serveri, izdzēst mapi **`.next`**, palaist **`npm run dev`** no jauna un **cietā pārlādēšana**; ja atkārtojas – **`npm run dev:webpack`** (stabilāks izstrādes serveris).

**Uzmanību:** nekādā **`next.config`** nelietojiet `deploymentId: process.env.X ?? ""`, ja rezultāts var būt **`""`** – tukša virkne Turbopack režīmā var salauzt hidratāciju un līdzīgas kļūdas (skat. [next.js #92858](https://github.com/vercel/next.js/issues/92858)).

**Drošības papildinājumi:** Saknes **proxy** (`proxy.ts`) **vietējo pieprasījumu līdzību** piemēro ceļiem `/login`, `/signup`, `/auth/callback`, `/forgot-password`, `/change-password` (`lib/security/auth-rate-limit.ts`). Lokālei testiem var **`DISABLE_RATE_LIMIT=true`** (`.env.local`). **`npm run audit`** (**`audit-level=high`**, CI arī) un **`npm run security:smoke-users-rls`** (iekšējais **`SECURITY_SMOKE_EMAIL`/`PASSWORD`; ja nav – izlaiž). Drošības **HTTP galvenes** (`next.config.ts`, CSP kā **report-only**). Detalizēti: **`security_check.md`**.

```bash
npm run build
npm run start
npm run lint
```

## Pēc Git atjauninājuma (`git pull`)

Šī sadaļa ir domāta izstrādātājiem un tiek izmantota arī kā **kopīga zināšanu bāze asistentiem** (Cursor u.tml.), lai pēc jaunākā commit ievilkšanas būtu skaidrs, ko darīt un kā īsi komunicēt.

### Obligātie / ieteicamie soļi

1. **`npm install`** – vienmēr pēc pull, ja mainījies `package.json` vai `package-lock.json`; ja šaubies, atkārto arī tad, kad lock fails nav mainījies (ātri un novērš „missing dependency’’ lokāli).
2. **Žurnāls** – salīdzināt ar **[Izmaiņu žurnālu](#izmaiņu-žurnāls)** un rindiņu **`Versija:`** README augšā: tur tiek apkopotas būtiskākās izmaiņas (Auth, proxy/sesija, SQL, ENV, paneļa FS slānis).
3. **Supabase un ENV** – ja žurnālā vai commit aprakstā ir jauni Postgres soļi, salīdzināt **`database/supabase/`** jaunos vai labotos `.sql` failus un **`supabase.env.template`** ar savu **`.env.local`**; pēc **`023`** pārbaudīt **`SUPABASE_SERVICE_ROLE_KEY`** signup e-pasta pārbaudei. Migrācijas palaist saskaņā ar **SQL sarakstu** README sadaļā **Supabase iestatīšana** (**divi faili `012_*`** – sekot aprakstam, ne tikai alfabetiskai kārtībai).
4. **Pārbaude** – pēc lielākām atkarību vai tipu izmaiņām ieteicams **`npm run lint`** un **`npm run build`**; ikdienas darbam **`npm run dev`**. Ja Turbopack rāda **`CssSyntaxError: Missing opening {`** ar trace uz **`globals.css`** / **`subtrack.css`** – izdzēst mapi **`.next`**, restartēt **`npm run dev`** (vai **`npm run dev:webpack`**); līdzvērtīgi žurnālā **[0.3.8](#izmaiņu-žurnāls)**.

### Ko „pateikt’’ / kā īsi atbildēt pēc jauna Git atjauninājuma

- **Lietotājam vai komandai:** īsi uzskaitīt: vai būtu jāpalaiž `npm install`; vai README žurnālā ir kas jauns (ENV, SQL); vai šķietami mainījušies paneļa faili (`public/fs/js/`, `components/fs/`); tad **`npm run dev`** un manuāli pārbaudīt galvenās lapas (sākumlapa, panelis, auth, admin – skatīt augšāk **Galvenās iespējas**).
- **AI palīgam:** neatkārtot visu README; izmantot šo sadaļu kā čeklisti. Ja žurnālā ir konkrētas jaunās funkcijas – nosaukt tās īsi; ja nav pieraksta žurnālā bet pull saturēja tikai mazus labojumus – to arī norādīt un ieteikt tikai `npm install` / `npm run dev`, ja nav redzamu `package-lock` vai DB izmaiņu.

### Uzturētājiem

Pie būtiskām izmaiņām **papildināt [Izmaiņu žurnālu](#izmaiņu-žurnāls)** (datums; nepieciešams – jauna apakšversija): jauni SQL faili ja ENV atslēgas, jauni maršruti, lauztās izmaiņas lokālajā prototipa JS.

## Vide un drošība

- Nekommitē `.env.local` un sensitīvus atslēgu ierakstus.
- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **abonementu CRUD** izmanto **Supabase Postgres** (`001` → **`subscriptions`**, RLS) un **Next Route Handlers** (`app/api/subscriptions`). Citas funkcijas un paplašinājumi dokumentē atsevišķi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām; detalizētākās funkcijas un SQL skatīt augšējās sadaļās.

### 0.3.33 (2026-05-18)

- **Saskarnes valoda (ielogots vs viesis)** – SSR prioritāte: profila **`display_preferences.interface_language_code`** (ne sīkdatne); viesim – **`subtrack_ui_locale`**. **`resolveUiLocaleCodeForRequest`**, **`resolveRequestUiLocales`**, **`app/layout.tsx`**, **`HtmlLangBridge`**. **`NavUiLanguageSwitcher`** ielogotam saglabā **`display_preferences`** Supabase (**`updateSessionDisplayPreferences`**); **`settings-fs-view-client.tsx`** lieto to pašu helperi; **`mergeDisplayPreferencesFromSources`** – **`prioritizeDbInterfaceLanguage`**.

### 0.3.32 (2026-05-18)

- **„Atzīmēt kā samaksāts”** – abonementu sarakstā un paziņojumu panelī (šodien / kavētie): API laikā **spinneris**, poga **disabled** un **`aria-busy`**, dubultklikšķis bloķēts; ja tas pats ieraksts redzams abās vietās, abas pogas iet ielādē vienlaikus. **`public/fs/js/subscriptions-helpers.js`** (`subtrackSetMarkPaidPending`, `subtrackMarkPaidButtonInnerHtml`), **`dashboard.js`**, **`dash-alerts.js`**, **`styles/subtrack.css`**.

### 0.3.31 (2026-05-18)

- **Sākumlapas FAQ** – produkcijas atbildes (datu saglabāšana kontā, mobilais, bez instalācijas, demo vs bezmaksas konts); noņemtas atsauces uz prototipu/Supabase „vēlāk”; **`landing-page.tsx`**, **`fallback-phrases.ts`**, **`046_site_translations_landing_faq_public.sql`**.

### 0.3.30 (2026-05-18)

- **Paneļa abonementa modālis** – lielākas vertikālās atstarpes galvenajiem laukiem un **Papildu opcijām** (kredīta termiņš, papildu pozīciju kartes); **`#modal-main`** **`styles/subtrack.css`**.
- **Admin / iestatījumi – īsāki teksti** – intro bez `public.users` u.c. `<code>`; noņemti liekie hinti (tulkojumu lazy rinda, sistēmas forma, iestatījumu apakšvirsraksts u.tml.); **`admin-intros.tsx`**, **`fallback-phrases.ts`**, **`045_site_translations_shorter_admin_ui_hints.sql`**.

### 0.3.29 (2026-05-18)

- **Admin lietotāji (`/admin/users`)**: ja **`paid_plan_enabled`**, **VIP** slēdzis; **Pro** – kronītis pie avatāra (šaurā skatā zem e-pasta); admina birka zem e-pasta. **`043_users_pro_vip.sql`**, **`044_*`**, **`POST /api/admin/users/pro-vip`**. **Paneļa Pro līmenis**: **`paid_plan_active` OR `pro_vip`** – analītika, kalendārs/brīvais līmenis (**`analytics-access.ts`**, **`dashboard-free-tier-gate`**, **`POST /api/subscriptions`**, kronītis **`nav-user-menu`**), **`/subscribe`** novirza prom, ja piekļuve jau ir.

### 0.3.28 (2026-05-18)

- **Analītika un navigācija (precizējums)** – ja **`paid_plan_enabled`** un lietotājam nav **`paid_plan_active`**, **nav** analītikas saites **`nav-dash`**, **`nav-landing`** un **`mobile-bottom-nav`** (ne **`/demo/analytics`** „preview” ielogotajiem). **`/analytics`** joprojām **`redirect('/dashboard')`** (**`app/analytics/page.tsx`**).
- **Build / klienta imports** – **`canAccessAnalytics`** iznests **`lib/subscriptions/analytics-access.ts`**, lai **`use client`** navigācija nepavilktu **`lib/supabase/server.ts`** (`next/headers`). **`dashboard-free-tier-gate.ts`** re-eksportē to servera kodam.

### 0.3.27 (2026-05-18)

- **Globālais UI valodas slēdzis** – karoga poga augšējā joslā (`NavUiLanguageSwitcher`) + mobilajā apakšējā joslā; viesim – `subtrack_ui_locale` + `localStorage`; ielogotam – arī **`updateSessionDisplayPreferences`** (profils); **`router.refresh()`**; valodu katalogs **`getLanguagesCatalog()`**; tulkošanas **`042`**; **`dash-alerts.js`** aizver paziņojumus atverot valodu. (SSR prioritāte profilam – **`0.3.33`**.)

### 0.3.26 (2026-05-18)

- **Demo** (`/demo/dashboard`, `/demo/analytics`): bagātāki parauga maksājumi (kavētie, šodien, nedēļa), **paziņojumu** UI kā panelītī, analītika no **tā paša** `SubscriptionClient[]`; SQL **`041`**, **`fallback-phrases.ts`** (`demo.dashboard.mock_*`). **React 19:** paneļa FS bootstrap kā `<template>` (ne `<script>` klientā), demo `window` karodziņi – `FsDemoDashboardWindowFlag` / `FsDemoAnalyticsWindowFlag`; `subtrackReadBootstrapJsonTextById` (`subscriptions-helpers.js`, `dashboard.js`).

### 0.3.25 (2026-05-18)

- **Publiskās demo lapas** **`/demo/dashboard`**, **`/demo/analytics`**: **`/demo/dashboard`** – **`DashboardFsView`** kā **`/dashboard`**, demo navigācija (**`nav-dash.tsx`** `demoMode`), lokāls FS stāvoklis bez API (**`037`**, **`dashboard.js`**, **`subscriptions-helpers.js`**). **`/demo/analytics`** – parauga analītika (**bez** tendences/prognozes SVG līnijas; **`demo-analytics-page.tsx`**). **Īstā analītika** **`/analytics`** – kategoriju joslas un donut kā demo (**`analytics.js`**, **`analytics-fs-view.tsx`**; bez Chart.js CDN). Sākumlapas / hero / CTA saites uz **`/demo/*`** (**`landing-page.tsx`**). **Mobilā apakšējā josla** režīms **`demo`** (**`mobile-bottom-nav.tsx`**). Paneļa virsrakstu teksti „maksājumi” – **`038`**, **`040`**. Demo ierīču parauga vārdi – **`039`**. SQL **`034`**–**`040`**, **`fallback-phrases.ts`**, **`subtrack.css`**.

### 0.3.24 (2026-05-18)

- **`subscribe.hero.lead`** – pielabo kopsavilkumu (kafija mēnesī + „neaizmirst maksājumus”) **`fallback-phrases.ts`**, **`029`**, **`013`** (eksports), **`033_*`** esošām DB; **sākumlapa `#pricing`** – **`landing-page.tsx`**, **`subtrack.css`** (rinda ar **`subscribe.hero.lead`** pirms **`landing.pricing.blurb`**).

### 0.3.23 (2026-05-18)

- **Pro lapa (`/subscribe`)** – jauni virsraksts / lead / brīvā līmeņa rinda ar **`Intl`** cenu un **`{n}`**; noņemta **`subscribe.coffee.line`** (**`subscribe-pro-view.tsx`**, **`029`**, **`fallback-phrases.ts`**, **`032_*`**, **`subtrack.css`**).

### 0.3.22 (2026-05-18)

- **Pro / atgādinājumi** – Pro lapā vairs nav **„Atgādinājumi”** kā ekskluzīvs ieguvums (**`subscribe-pro-view.tsx`**); **`subscribe.benefit.reminders.*`** izņemts no **`029`**, **`fallback-phrases.ts`**. Admin **`admin.forms.paid_plan_hint`** precizēts: maksājumu atgādinājumu panelis pieejams **visiem** (**`028`** atjaunināts, **`031_subscribe_remove_reminders_benefit.sql`** esošām DB).

### 0.3.21 (2026-05-18)

- **Panelis** – ja **`paid_plan_enabled`** un lietotājam nav **`paid_plan_active`**, maksājumu kalendārs netiek rādīts (**`dashboard-fs-view.tsx`**, **`dashboard-overview-main--no-calendar`** `subtrack.css`); **`dashboard.js`** jau droši izlaiž renderi bez **`#pay-calendar`**.

### 0.3.20 (2026-05-18)

- **Analītika un maksas plāns** – ja **`paid_plan_enabled`**, **`/analytics`** tikai ar **`paid_plan_active`**; navigācijā un sākumlapas explore **kartē** analītikai paslēpta brīvā līmeņa lietotājiem. **`canAccessAnalytics`** – skat. **`0.3.28`** / **`analytics-access.ts`**.

### 0.3.19 (2026-05-18)

- **Pro lapa** – noņemts **„Maksāšana drīzumā”** un piezīmes bloks; **`subscribe.cta.*`** izņemts no **`029`** (jaunās instalācijas), **`030_remove_subscribe_cta_translations.sql`** – dzēš DB ierakstus, ja **`029`** jau bija palaists ar šīm atslēgām; **`fallback-phrases.ts`**, **`subtrack.css`**.

### 0.3.18 (2026-05-18)

- **Pro abonementa lapa** – **`/subscribe`** (tikai ielogotiem; **`paid_plan_enabled`** izslēgts → novirze uz **`/dashboard`**); paneļa saite **„Iegūt Pro”** pie **„Pievienot”**, kad spēkā brīvā līmeņa limits un lietotājam nav **`paid_plan_active`**. Tulkošanas **`029_site_translations_subscribe.sql`**, **`fallback-phrases.ts`**, **`subscribe-pro-view.tsx`**, **`subtrack.css`**. Maršruta aizsardzībā **`/subscribe`** kopā ar paneli.

### 0.3.17 (2026-05-18)

- **Maksas plāns (MVP)** – admin **`/admin/system`**: slēdzis, EUR cena, brīvā līmeņa limits; sākumlapas **`#pricing`** + **`public/landing-coffee.svg`**; **`POST /api/subscriptions`** respektē limitu (tostarp skaitīšanas kļūdā **503**, nav „klusā apiešana”); **`users.paid_plan_active`** + kronītis **`nav-user-menu`**. **Panelis**: **`fetchSystemPaidPlanLiveForDashboard`** (bez **`getPublicSystemSettings`** keša), **`#subtrack-free-tier-gate-json`**, **`openAddModal`** neļauj modāli; pogas **`data-subtrack-add-sub`** pēc **`renderList`** **disabled** pie limita. SQL **`027_paid_plan.sql`**, **`028_site_translations_paid_plan.sql`**; **`fallback-phrases.ts`**, **`SubtrackIntlProvider`**, **`dashboard.js`**.

### 0.3.16 (2026-05-17)

- **Kalendāra slēdzis „Visi maksājumi”** – skaidrojums kā **`SubtrackTooltip`** (`dashboard-fs-view.tsx`), nevis **`title`**; **`aria-label`** paliek.

### 0.3.15 (2026-05-17)

- **README** – **Versija** `0.3.15`; **[Galvenās iespējas → Panelis](#galvenās-iespējas-ui)** – IKONA / **`FA_ICONS_ALL`**, hintu rinda, **`fs-icon-picker-search`**, atšķirība pret pilno FA katalogu; **[Tehniskais steks](#tehniskais-steks)** (ikonu rinda) – **~102** kuratorētās klases un licence; **[Struktūra](#struktūra-īsumā)** – **`lib/fs-icons.ts`**, **`lib/fs-icon-picker-search.ts`**.

### 0.3.14 (2026-05-17)

- **README** – **Versija** `0.3.14`; **[Galvenās iespējas → Panelis](#galvenās-iespējas-ui)** atjaunināts (kalendārs: **„atzīmēts samaksāts”**, slēdzis, **`localStorage`**, tooltip; paziņojumi: **kavētie** ar apmaksu); **[Struktūra](#struktūra-īsumā)** un **[UI tulkošana](#ui-tulkošana)** – SQL diapazons līdz **`026`**.

### 0.3.13 (2026-05-17)

- **Kalendāra slēdzis** – apakšā labajā pusē **`admin-switch`**: **ieslēgts** = rāda arī **„atzīmēts samaksāts”** dienas; **izslēgts** = tikai **neapmaksātie** termiņi (`next_payment_date`). **Noklusējums:** ja **`localStorage`** vēl nav **`subtrack_cal_include_paid_marks`**, uzskatīt par **ieslēgtu** (lai **veiktās** dienas pēc apmaksas redzamas bez lieka soļa). **Kalendāra kājene:** leģenda **vienā rindiņā** (horizontāla ritināšana ļoti šaurā skatā); **„Visi maksājumi”** slēdža skaidrojums (vēlāk **`SubtrackTooltip`**, sk. **0.3.16**); **`aria-label`**. **Paziņojumi:** **kavēto** ierakstu rindās **apmaksas poga** (tā pati kā šodienai). Tulkošanas **`026_site_translations_dashboard_cal_toggle.sql`**, **`fallback-phrases.ts`**, **`fs-page-i18n-keys.ts`**, **`dashboard-fs-view.tsx`**, **`dashboard.js`**, **`subscriptions-helpers.js`**, **`dash-alerts.js`**, **`subtrack.css`**.

### 0.3.12 (2026-05-17)

- **Kalendārs „atzīmēts samaksāts”** – pēc apmaksas diena tiek saglabāta **`localStorage`** (`subtrack_cal_paid_marked_v1`), lai **17.05. u.tml.** šūna ar ✓ / **+N** paliek redzama arī tad, kad `next_payment_date` jau pārcelts uz nākamo periodu; panelis un zvans izsauc **`subtrackAddPaidCalendarDay`**. Leģenda atjaunota (**`dashboard-fs-view.tsx`**). Skatīt **`subscriptions-helpers.js`**, **`dashboard.js`**, **`dash-alerts.js`**, **`subtrack.css`**.

### 0.3.11 (2026-05-17)

- **Kalendārs pēc „apmaksāts”** – šūnas balstās uz **normalizētu `YYYY-MM-DD`**; pēc veiksmīgas `GET /api/subscriptions` **neatgriežas pie SSR bootstrap**, lai vecie termiņi neuzrakstītu svaigo stāvokli; pēc atzīmēšanas seko **atkārtota API sinhronizācija**. **`public/fs/js/subscriptions-helpers.js`**, **`subscriptions-data.js`**, **`dashboard.js`**, **`dash-alerts.js`**, **`analytics.js`**; noņemts neizmantotais „apmaksāts šajā dienā” kalendāra zars un leģendas trešā daļa (**`dashboard-fs-view.tsx`**).

### 0.3.10 (2026-05-17)

- **Paziņojumu panelis** – termiņš **šodien** rādās tikai sadaļā **„Šodien jāmaksā…”** ar **atzīmēšanas pogu katram** ierakstam; **„Gaidāmie maksājumi”** sākas no **rītdienas** (7 dienu logs). **`public/fs/js/dash-alerts.js`**, **`components/nav-session-actions.tsx`**, **`styles/subtrack.css`**; **FsNotify** bootstrap frāzes **`lib/fs/fs-page-i18n-keys.ts`** (`aria_mark_paid`, `toast_marked_paid`). **`public/fs/js/subscriptions-helpers.js`** – kopīga **`escAttr`**.

### 0.3.9 (2026-05-17)

- **Paneļa kalendārs** – ja vienā datumā ir **vairāki maksājumi**, datumā rāda **`+N`** (mazā šriftā) apakšējā labajā stūrī (**`public/fs/js/dashboard.js`**, **`styles/subtrack.css`** – `.pay-cal-cell-more`); **šodienas** šūnai **`+N`** krāsa **`var(--primary)`** (gaidāms) vai **`var(--danger)`** (kavēts), lai sakristu ar **ring** ap šodienas šūnu; pārējām dienām gaidāmajam – vājāks **border** tonis.

### 0.3.8 (2026-05-17)

- **Turbopack / CSS** – **`admin-integration-*`**, **`admin-switch*`** (integrācijas slēdzis un forma) pārcelti no **`styles/subtrack.css`** uz **`app/globals.css`** aiz **`@import "../styles/subtrack.css"`**, workaround pret **`@tailwindcss/postcss`** kļūdu **`CssSyntaxError: Missing opening {`** (ziņojumā bieži minēta **`subtrack.css`~4485**). Ja kļūda paliek pēc `git pull`: izdzēst **`.next`**, restartēt **`npm run dev`**.
- **README** – stilu tabula; **`lib/admin/`**, **`lib/integrations/`** un **OAuth / integrāciju** dokumentācijas precizējumi; versija.

### 0.3.7 (2026-05-17)

- **`/login` / `/signup`** – Google un Apple pogas **`LoginSocialButtons`** rādīt tikai pēc **`public.integrations`** ar atslēgām **`login_google`** un **`login_apple`** (**`enabled`**); SSR lasīšana **`getLoginSocialIntegrationFlags`** (**`lib/integrations/login-social-flags.ts`**). OAuth **`next`** sakrīt ar e-pasta pieteikšanās **`next`**. Migrācijas tekstiem **`025_site_translations_auth_social_login.sql`**, **`fallback-phrases.ts`**.

### 0.3.6 (2026-05-17)

- **Admin integrācijas** – jauna sānizvēlne pirms **`/admin/system`**; lapa **`/admin/integrations`**, tabula **`public.integrations`** + **`024_integrations.sql`**, tulkošanas atslēgas un atjaunināts **`013_site_translations_seed_subtrack_ui.sql`**.
- **Panelis ikonas** – augšējā IKONA tai pašā **`FA_ICONS_ALL`** secībā kā „Parādīt visas“ (`dashboard.js`): vienā hintu rindā **tikai tik ikonas**, cik nesatur apgriešanu (**`#icon-picker-hints-shell` platuma** aprēķins). Zem „Parādīt visas“, ja meklētājam nav nevienas sakritības, saglabāts **pilns katalogs** (`lib/fs-icon-picker-search.ts`, `subtrack.css`, `dashboard-fs-view.tsx`, `dashboard.js`).

### 0.3.5 (2026-05-17)

- **Supabase Security Advisor** – SQL **`022_security_advisor_hardening.sql`** (`search_path`, trigeru **REVOKE**, admin RLS **`to authenticated`**), **`023_security_advisor_rpcs.sql`** (`current_user_is_admin` → **SECURITY INVOKER**, `signup_email_exists` → **EXECUTE** tikai **`service_role`**). Serveris: **`lib/supabase/service-role-client.ts`**, **`signupEmailExistsAction`** izmanto service_role (fallback uz anon klientu, ja atslēgas nav – **pēc `023` signup e-pasta pārbaudei vajadzīga `SUPABASE_SERVICE_ROLE_KEY`**). **`security_check.md`**, **`supabase.env.template`**, **`.env.example`**.
- **Admin lietotāji** – **`admin-users-view.tsx`**: kolonna **`IERAKSTI`** rāda tikai **kopējo abonementu skaitu**.
- **Dashboard FS** – **`dashboard-fs-view.tsx`** / **`analytics-fs-view.tsx`**: salabots **`try` / `catch`** ap paneļa skriptu ielādi (parsēšanas kļūda pēc Strict Mode labojumiem).
- **README** – ENV (`SUPABASE_SERVICE_ROLE_KEY`), Advisor / **leaked password** (Pro), **`proxy.ts`**, soļu numerācija līdz **`023`**, Supabase setup.

### 0.3.4 (2026-05-17)

- **Panelis / analītika (FS JS)** – izstrādē **React Strict Mode** un `loadScriptOnce` kešs lika **`dashboard.js` / `analytics.js` otrajā mountā nepalaist inicializāciju**; tagad **`window.fsBootDashboard` / `window.fsBootAnalytics`** izsauc **`useEffect`** pēc ielādes. Kalendāra / ikonu / krāsu listeneriem **`data-subtrackBound`**, lai uz tiem pašiem mezgliem nepiemērotu divreiz.

### 0.3.3 (2026-05-17)

- **Analītika** – klientā **pārlasa bootstrap** un **`GET /api/subscriptions`**, lai rādītu **īstos `subscriptions` datus** arī pēc **client navigācijas** no paneļa; tās pašas izmaiņas paneļa boot, lai saraksts vienmēr sakristu ar DB. JS: **`subscriptions-data.js`** (`subtrackReloadSubscriptionsFromBootstrap`), **`subscriptions-helpers.js`** (`subtrackSyncSubscriptionsFromApi`), **`analytics.js`**, **`dashboard.js`**. UI teksti bez „demo’’ (`**`analytics-fs-view.tsx`**, **`fallback-phrases.ts`**, pārrakstīts **`013_site_translations_seed_subtrack_ui.sql`**).

### 0.3.2 (2026-05-17)

- **Next.js 16** – saknes **`middleware.ts`** aizstāts ar **`proxy.ts`** (`export async function proxy`, kopā ar `export const config`); brīdinājums par novecojušo middleware konvenciju vairs nedraudzē `next dev`. **`README`**, **`security_check.md`**, īsi komentāri kodā.

### 0.3.1 (2026-05-17)

- **Veiktspēja (RSC)** – **`react/cache`**: kopīgs **`loadAuthContext`** (**`getUser`** + servera klients) **`getSessionUserDisplay`**, **`requireAdminUser`**, **`fetchSubscriptionsForSession`**; viena **`current_user_is_admin`** RPC uz klientu vienā renderī; **`resolveRequestUiLocales`**, sapludinātie **`site_translations`**, **`getLanguagesCatalog`**, **`getSystemSiteName`** – viena reize uz dokumenta pieprasījumu kur piemērots. **`prefetch={false}`** admin / settings / change-password / izvēlnes saitēm – mazāk fonā proxy sloga.

### 0.3.0 (2026-05-17)

- **Abonementu forma (panelis)** – galvenais **nosaukums** un **summa** nav obligāti, ja nav papildu rindu; summa tukša → **0**; ar papildu rindām galvenajam nosaukumam jābūt; katrai papildu rindai ar jebkuru aizpildītu lauku (ieskaitot piezīmi) – arī pozīcijas nosaukums. **`lib/subscriptions/subscription-map.ts`** (`normalizeDevicesForSubscription`), **`PATCH`** sapludināta validācija (**`app/api/subscriptions/[id]/route.ts`**), **`public/fs/js/dashboard.js`**, **`components/fs/dashboard-fs-view.tsx`** (summa – „neobligāti’’). Tulkošanas atslēgas **`fallback-phrases.ts`**, **`fs-page-i18n-keys.ts`**, SQL **`020_site_translations_dashboard_subscription_optional_fields.sql`**.
- **Paziņojumu panelis** – gaidāmie ierobežoti līdz **nākamajām 7 dienām**; ja nav ko rādīt, profesionāls tukšais stāvoklis (**`components/nav-session-actions.tsx`**, **`public/fs/js/dash-alerts.js`**, **`styles/subtrack.css`**). SQL **`021_site_translations_notify_empty_state.sql`**.

### 0.2.17 (2026-05-17)

- **Navigācija ielogotajiem** – **`app/page.tsx`**: pie aktīvas sesijas **`/`** → **`/dashboard`** (`redirect`). **`components/nav-dash.tsx`**: zīmola saite uz **`/dashboard`**. **`components/nav-landing.tsx`**: ja tiek padots **`userDisplay`**, zīmols arī uz **`/dashboard`** (landing ar sesiju).
- **Abonementu backend + FS panelis** – **`app/api/subscriptions`**, **`app/api/subscriptions/[id]`** ( **`GET`/`POST`/`PATCH`/`DELETE`** , Supabase RLS); **`lib/subscriptions/*`**, **`fetchSubscriptionsForSession`** uz **`/dashboard`** un **`/analytics`**; **`#subtrack-subs-bootstrap-json`** + **`public/fs/js/subscriptions-data.js`** (bez iepriekšējiem demo ierakstiem); **`dashboard.js`** un **`dash-alerts.js`** sinhronizācija ar API; kalendārs **lv**: nedēļas dienas **Pr–Sv**; jaunas tulkošanu atslēgas **`fallback-phrases.ts`** + SQL **`017_site_translations_fs_dashboard_api.sql`**.
- **Paneļa tukšais stāvoklis** – īsāks **`fs.dashboard.empty_lead`**, **`empty_secondary`** noņemts ar **`DELETE`** migrācijā (**nav** tukšu virkņu kā tulkojumu); pilna platuma karte; **`018_site_translations_dashboard_empty_state.sql`**.
- **Termiņa datumi (papildu opcijas)** – nav jāaizpilda abi lauki; API un **`dashboard.js`** validācija tikai tad, ja abi norādīti; **`019_site_translations_optional_term_dates.sql`**; noņemtas atslēgas **`toast_term_dates_invalid`** / **`toast_device_term_both_dates`** (fallback).

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
- **Iestatījumi / saskarnes valoda** – **`settings-fs-view-client.tsx`**: **`router.refresh()`** uzreiz pēc **`interface_language_code`** maiņas kopā ar **`applyUiLocaleInBrowser`** un **`localStorage`**; **`mergeDisplayPreferencesFromSources`** – DB + LS merge (skatīt arī **`0.3.33`** – profila valoda SSR un **`prioritizeDbInterfaceLanguage`**).

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

- **Supabase** – servera/pārlūka klienti (`lib/supabase/*`), sesijas **`proxy.ts`**, OAuth/apmaiņas maršruts `app/auth/callback/route.ts`, ENV paraugi (`supabase.env.template`, `.env.example`).
- **Datubāze** – Postgres + RLS skripti `database/supabase/001` … `013` (ieskaitot **`languages.is_default`** un anon kataloga lasīšanu **`010`**, tulkošanu **`011`–`013`**).
- **Auth UX** – `/login`, `/signup`, `/forgot-password`, `/change-password` ar Server Actions un komponentēm (`signup-form`, `change-password-form`), peldošie toast kļūdām un ziņām (`flash-param-toast`, `auth-toasts-host`), sociālo pogu komponente.
- **Aizsargātie maršruti** – panelis, analītika, iestatījumi, admin; novirzes sesijas stāvoklim atbilstoši saknes **`proxy`** un `lib/supabase/middleware.ts`.
- **Administrācija** – `/admin` un apakšlapas (`components/admin/*`), piekļuve tikai adminiem; **valodas** – CRUD + **noklusējuma valoda jaunajiem apmeklētājiem** (`public.languages.is_default`, `010` SQL, kolonna „Noklus.“, `lib/languages-catalog.ts`).
- **Admin lietotāju UI** – `/admin/users`: pilna platuma submenu + saturs mobilajā (`admin-body` stretch), tabulas **kompaktais** variants tikai **≤640 px** (kolonnas „VIP“ / „Reģistrēts“ zem e‑pasta, bez aplīša; administrators birka vienmēr zem e‑pasta); **virs 640 px** – aplis+kronītis, ja **Pro**, un tabulas kolonnas (`styles/subtrack.css`).
- **Iestatījumi** – preferences JSON + sinhronizācija ar DB un `localStorage` (`006`, FS skats un klienta žogs kur nepieciešams).
- **Mobilā vide** – apakšējā navigācija (`mobile-bottom-nav`), admin horizontālā ritināšana šauros ekrānos; admin kolonnas izkārtojums un platuma līdzināšana ar augšējo joslu skatīt **Mobilā vide**.
- **Paneļa FS slānis** – skati `components/fs/*`, ielādes helpers; JS atjauninājumi `public/fs/js/` (ieskaitot paziņojumus `dash-alerts.js`; vecā `dash-notifications.js` aizstāta/noņemta).
- **Pārējās lietas** – navigācija ar sesijas darbībām un lietotāja izvēlni (`nav-session-actions`, `nav-user-menu`), palīgfunkcijas (`lib/auth/*`, `lib/user-display-preferences.ts`), `next.config.ts`, globālie/stila labojumi.

### 0.1.0 un agrāk

- Sākotnējais Next.js 16 / React 19 projekts ar FS prototipa importu un pirmo README (sk. git vēsturi: `ea3bc70`, `0233c26`).

## Licence

Privāts projekts. Precizē licenci publiskota repo gadījumā.
