# SubTrack (subtrack-web)

**Versija:** `0.4.13` (skatīt **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**; **0.4.x** sākas ar **0.4.0** = agrāk žurnāla **0.3.54**; PWA – **[PWA (repazy)](#pwa-repazy)**).

**repazy** (repozitorijs `subtrack-web`) ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. **Paneļa dati** (`/dashboard`, `/analytics`) lasās no **Supabase** (`public.subscriptions`, **`public.subscription_payments`** maksājumu žurnālam, RLS); CRUD notiek caur **Route Handlers** (`app/api/subscriptions/*`) un sesijas sīkdatēm; prototipa **FS** JavaScript (`public/fs/js/`) renderē UI un izsauc API (kopā ar **Supabase Auth** un **`database/supabase/`** migrācijām).

## Galvenās iespējas (UI)

- **Sākumlapa** (`/`) - prezentācija, FAQ (navigācijā LV **`BUJ`**, ne angl. „FAQ”), saites uz **publiskajām demonstrācijām** **`/demo/dashboard`** un **`/demo/analytics`**, reģistrāciju un ieeju; **ar aktīvu sesiju** serveris novirza uz **`/dashboard`** (**`app/page.tsx`**, `redirect`). Ja **`/admin/system`** ir ieslēgts **maksas plāns**, viesiem rādās **cenu / brīvā līmeņa** bloks ar kafijas ilustrāciju (`#pricing`), **ievads** no kopīgā **`subscribe.hero.lead`** un **`landing.pricing.blurb`** ar **`{count}`** / **`{price}`**, dati no **`public.system_settings` + `SubtrackIntlProvider`**. Paneļa augšējās joslas **logo** (tikai ja augšupielādēts no **`/admin/system`**) vai teksta nosaukums (**`DashBrandLink`**, **`components/nav-dash.tsx`**) ved uz **`/dashboard`**, nevis **`/`**; lapas **`<title>`** = produkta nosaukums.
- **Autentifikācija** - ieeja un reģistrācija caur **Supabase Auth** (Server Actions), OAuth (Google / Apple) **tikai tad**, ja **`public.integrations`** ir **`enabled`** uz **`login_google`** un/vai **`login_apple`** (admin: **`/admin/integrations`**; SSR lasīšana **`getLoginSocialIntegrationFlags`** – **`lib/integrations/login-social-flags.ts`**; pogas **`components/login-social-buttons.tsx`**; tulkošanas atslēgas **`auth.social.*`** – migrācija **`025_site_translations_auth_social_login.sql`**). **Aizmirstā parole** (`/forgot-password`), **mainīt paroli** (`/change-password` ar `changePasswordAction`, **`components/fs/change-password-fs-view.tsx`** + **`components/change-password-form.tsx`** – **`t()`** un **`auth.pass_strength.level_*`** kā signup, atkārtojums, paroles rādīšanas poga; vecā parole netiek vērtēta pirms „Saglabāt”). **Pieteikšanās / reģistrācijas** formu virknes un maršruta **`<title>`** seko izvēlētajai lokālei (**`components/auth/auth-login-flow.tsx`**, **`components/auth/auth-signup-flow.tsx`** + **`components/signup-form.tsx`**, **`getUiPhraseForRequest`** no **`lib/ui/server-ui-phrases.ts`**). **Reģistrācija** (`/signup`): e-pasta formāta validācija, paroles stipruma indikators, atkārtotās paroles pārbaude, e-pasta aizņemtība (**`signup_email_exists`**, `004_*` / **`023_*`**): Server Action **`signupEmailExistsAction`** izsauc RPC tikai ar **`SUPABASE_SERVICE_ROLE_KEY`** (serverī); bez atslēgas pārbaude **nedarbojas**. **Flash ziņojumi** (kļūdas un īsie info teksti no `?error=` / `?message=` un OAuth kļūdas) tiek rādīti kā **peldošie toast** (`components/flash-param-toast.tsx`, `components/auth-toasts-host.tsx`): apmerami auto-aizvēršanās, uzvedot kursoru virs ziņojuma taimeris apstājas, pēc kursora nost no jauna. Query parametri pēc rādīšanas tiek tīrīti ar `history.replaceState`, lai pārlādē neatkārtojas. Izmantošana: `/login`, `/signup`, `/forgot-password` (gatavs nākotnes redirectiem), `/change-password`.
- **Panelis** (`/dashboard`) - maksājumu kalendārs (ja vienā datumā vairāki maksājumi, šūnā **`+N`** apakšējā labajā stūrī; **šodienas** šūnai indikatora krāsa kā **ring** apmalei; **„atzīmēts samaksāts”** dienas no **`public.subscription_payments`** (**`paidCalendarDays`**, **`061_*`**); slēdzis **`subtrack_cal_include_paid_marks`** – ja atslēgas vēl nav, **noklusējums ieslēgts**; marķējums un skaidrojums **`SubtrackTooltip`** (hover / fokuss; burbulis portalā paliek, kamēr kursors virs pogas vai burbuļa; **bez** pārlūka **`title`**), **`aria-label`** pieejamībai; kājenes **leģenda vienā rindā**); **peldošie toast** (`showToast` **`subscriptions-helpers.js`**) – auto-aizvēršanās aptur, kamēr kursors virs ziņojuma), **kopsavilkums** (kopējā / aktīvie maksājumi; **kategoriju josla** virs saraksta – segmentu tooltip uz desktop, leģenda mobilajā; **Nākamais maksājums** sadalīts kolonnās: **kavētie** / **šodien jāmaksā** / nākamais – krāsainas kartes ar kopējo € un rēķinu skaitu zem summas; trīs kolonnās nākamais kompakts: € + nosaukums, bez datuma labajā; saraksta darbību pogas – diskrētas krāsas: rediģēt, dzēst, samaksāts), abonementu CRUD pret **`public.subscriptions`** (**`GET`/`POST` `/api/subscriptions`**, **`PATCH`/`DELETE` `/api/subscriptions/[id]`** ); ja admin ieslēdz **maksas plāna** ierobežojumu, **`POST`** atgriež **403** brīvā līmeņa **ierakstu skaita** sasniegšanā (**`paid_plan_active`** `public.users` – pašpārvaldei nē, skat. **`027`**); lietotāja izvēlnē pie avatāra **`fa-crown`**, ja **`paid_plan_active`**. Sākuma dati SSR bootstraps (**`#subtrack-subs-bootstrap-json`**, **`#subtrack-family-sharing-bootstrap-json`**); **`GET /api/subscriptions`** ietver arī **ģimenes dalīšanas** kopīgos ierakstus, ja integrācija ieslēgta; **FS JS** (`public/fs/js/dashboard.js` …) dabū frāzes un **`Intl`** lokāli pirms **`loadScriptOnce`**, jo **`app/dashboard/page.tsx`** renderē **`FsI18nBootstrap`** (skatīt **UI tulkošana**); kalendārā **lv** nedēļas dienu galvenes **Pr … Sv**; **pievienošanas / labošanas modālis** (`#modal-main`) – elpīgākas vertikālās atstarpes galvenajai formai un **Papildu opcijām** (**`styles/subtrack.css`**); augšējā joslā **paziņojumi** (**`dash-alerts.js`**) – tikai **paši** abonementi (**bez** partnera kopīgotajiem: kavētie / šodien / gaidāmie un zvana skaitītājs); **šodienas** un **kavētie** ar **atzīmēšanu kā samaksātu** – API laikā **ielādes riņķis** un **neaktīva** poga; kopīga **`subtrackSetMarkPaidPending`** **`subscriptions-helpers.js`**); **gaidāmie** sākas no **nākamās dienas**; mobilajā skatā – pilnekrāna fons ar **backdrop blur**; abas izvēlnes nevar būt atvērtas vienlaikus). **Modālis – IKONA:** izvēlei **`fa-solid`** klases no **`FA_ICONS_ALL`** (`lib/fs-icons.ts`; ~**102** **`fa-solid`** klases – **nav** pilnās Font Awesome Free kopas, Free satur **daudz vairāk** ikonu nekā šīs ~102). Hintu josla un režģis „Parādīt visas“ **tā pati secība**; augšējā rinda – tikai tik pogas, cik **`dashboard.js`** aprēķina pēc **`#icon-picker-hints-shell`** (bez apgriešanas). Meklēšana ar sinonīmiem – **`lib/fs-icon-picker-search.ts`**, JSON **`#subtrack-icon-search-bootstrap`** (**`components/fs/dashboard-fs-view.tsx`**). Ja **maksas plāns** ieslēgts un lietotājam nav **`paid_plan_active`**, zem **„Pievienot”** ir saite **„Iegūt Pro”** uz **`/subscribe`**; šajā gadījumā **kalendāra kolonna** paneļī netiek rādīta (**`dashboard-overview-main--no-calendar`**). **Pievienošanas modālis – ikona:** nejaušā izvēle no **pirmās redzamās** hint rindas; **`Parādīt vairāk`** (LV; SQL **`062_*`**) atver pilnu katalogu.
- **Pro iepazīšanās** (`/subscribe`) – **`SubscribeProView`**: **`subscribe.hero.*`**, **`subscribe.free_tier.note`** ar **`{price}`** / **`{n}`** (EUR formātēts, brīvā līmeņa limits); **`subscribe.coffee.line`** noņemts (**`032_remove_subscribe_coffee_line.sql`** DB). Tulkošanas **`029`**, **`028`** / **`031`**, **`030`**, **`032`**, **`033`** (hero lead teksta precizējums).
- **Demonstrācijas** (`/demo/dashboard`, `/demo/analytics`) – **publiski** (nav **`proxy`** aizsargātas kā `/dashboard`); **`/demo/dashboard`** lieto to pašu **`DashboardFsView`** + **`public/fs/js/dashboard.js`** kā **`/dashboard`** (kalendārs, modāļi, CRUD pogas); **API netiek izsaukti** (`window.__SUBTRACK_DEMO_DASHBOARD__`). **Paziņojumu zvans** (`DashNotifyDropdown`) rāda parauga sarakstu arī viesiem; analītikas demo `window.__SUBTRACK_DEMO_ANALYTICS__`. Papildu parauga maksājumi (kavētie, šodien, nākamajā nedēļā) un analītikas kopsavilkums veidojas no tiem pašiem datiem. **`/demo/analytics`** – izkārtojums kā analītika (kopsavilkumi, kategorijas; **nav** izmaksu tendences/prognozes diagrammas). Ar **`paid_plan_enabled`** sākumlapas hero rāda **`landing.hero.calendar_mock_paid_note`**. Tulkošanas **`034`**, **`036`**, **`037`**, **`041`**, **`demo.*`**.
- **Analītika** (`/analytics`) - kopsavilkumi, kategoriju joslas un **CSS donut** sadalījums (`demo-analytics-*`, kā demo; bez Chart.js CDN); **`FsI18nBootstrap`** + **`public/fs/js/analytics.js`** (**`app/analytics/page.tsx`**). Ja **`paid_plan_enabled`**, maršruts **`/analytics`** tikai ar **`users.paid_plan_active`** (**`canAccessAnalytics`**, citādi **`redirect('/dashboard')`**). Brīvā līmenī **nav** analītikas saites augšējā joslā un mobilajā navigācijā (**`nav-dash.tsx`**, **`nav-landing.tsx`**, **`mobile-bottom-nav.tsx`** – **`showAnalytics`**). Publiskā **`/demo/analytics`** paliek viesiem; sākumlapas **„Explore”** kartē – **`landing.explore.analytics.pro_hint`** un **`/demo/analytics`**.
- **PWA (Progressive Web App)** – instalējama **repazy** lietotne: Serwist SW, manifest, **`/offline`**, mobilais instalācijas banneris, **`/settings`** instalācijas bloks, admin **`/admin/pwa`**. Pilns apraksts: **[PWA (repazy)](#pwa-repazy)**.
- **Iestatījumi** (`/settings`) - preferences: **`public.users.display_preferences`** (JSON), DB sinhronizācija + dublējums `localStorage` (kad ir migrācija `006_*`). Forma **`components/fs/settings-fs-view-client.tsx`** ar **`useSubtrackIntl`**; saglabāšanas toast (**`pushDomToast`**) ar hover apturētu auto-aizvēršanu; **`app/settings/page.tsx`** kārto **`languages`** atlasi ar **`Intl.Collator`** pēc **`resolveRequestUiLocales`** (nevis fiksētu `lv-LV`). **Saskarnes valoda** – pēc izvēles tiek uzreiz **`applyUiLocaleInBrowser`** + **`writeDisplayPreferencesToLocalStorage`** + **`updateSessionDisplayPreferences`** (`lib/auth/display-preferences-client.ts`) + **`router.refresh()`**, lai **`app/layout.tsx`** (**`SubtrackIntlProvider`**, tulkošanas `dbMap`) atbilstu jaunajai lokālei. **Ielogots:** SSR lokāle no profila (`interface_language_code`), nevis sīkdatnes; **`mergeDisplayPreferencesFromSources`** ar **`prioritizeDbInterfaceLanguage`** – profila valoda pār **`localStorage`**. **Viesis:** sīkdatne **`subtrack_ui_locale`**. **Nav josla** (`NavUiLanguageSwitcher`) ielogotam lietotājam saglabā to pašu profila JSON. Bāzes noklusējumi no **`public.system_settings`** (`012`), ja nav lietotāja ieraksta; `/admin/system` ietekmē jaunos kontus un formas bāzi. Ja ieslēgts **`pwa_install_settings_enabled`**, rāda **`PwaSettingsInstall`**; **`PwaPushSettings`** (Web Push: kavētie + šodien) – skatīt **[PWA](#pwa-repazy)**.
- **Ģimenes dalīšana** (`/family-sharing`) – tikai ja admin **`/admin/integrations`** ieslēdz **`family_sharing`**; saite lietotāja izvēlnē (**`session.family_sharing`**, **`components/nav-user-menu.tsx`**, karodziņš no **`SubtrackIntlProvider.integrations`**). Uzaicinājums pa e-pastu (lietotājam jāeksistē **`public.users`**), pieņemšana, atcelšana (**owner**), **pamest dalību** (**partner**). UI: **Saņemtie uzaicinājumi** (pieņemt); **Tavi uzaicinājumi** (tikai **owner** – gaidošie + aktīvie ar krāsu, slēdzi, atcelšanu); **Dalība ar mani** (**partner** – read-only krāsa, darbīgs slēdzis **„saskaitīt kopā”**, **Pamest dalību**). **`/dashboard`**: abpusēji kopīgotie ieraksti **tikai lasāmi** (vieglā fona krāsa, birka „Kopīgots”), kalendārā krāsaina apmale; kopsumma ar **\*** un **`data-tooltip`** uz €, ja slēdzis ieslēgts (skatītāja **`viewerUserId`** no bootstrap); apakšā labajā – **„tikai mani izdevumi”**. UI platums un formas kā analītikā (**`stat-card`**, **`form-group`**, **`--app-shell-max`**; saites viena kolonna). DB: **`084`–`088`** (`family_sharing_links`, RLS: owner/partner **`subscriptions`** SELECT abpusēji **`086`**, partner **`leave`→revoked** **`087`**, partner **`combine_in_totals`** **`088`**). API **`PATCH`**: `accept`, `revoke`, `leave`, `color` (owner), `combineInTotals` (owner un partner). **`GET /api/subscriptions`** + bootstrap ar kopīgotajiem ierakstiem. Kods: **`lib/family-sharing/*`**, **`components/family-sharing/family-sharing-view.tsx`**, **`public/fs/js/dashboard.js`**, **`subscriptions-helpers.js`** (`subtrackSubscriptionsForNotifyList`). Tulkošanas **`085_*`**, **`database/translations_daily/2026-05-21.sql`**, **`fallback-phrases.ts`**. Uzaicinājumam nepieciešams **`SUPABASE_SERVICE_ROLE_KEY`** (e-pasta meklēšana).
- **Administrācija** (`/admin`, `/admin/users`, `/admin/languages`, `/admin/translations`, `/admin/integrations`, `/admin/system`, **`/admin/pwa`**) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne. **Ikonu tooltipi** admin tabulās – **`SubtrackTooltip`** (`components/subtrack-tooltip.tsx`): melns burbulis, teksts portalā uz **`document.body`** (`position: fixed`), lai **`admin-table-wrap`** `overflow` to neapgriež; burbulis paliek atvērts, kamēr kursors virs pogas vai burbuļa; uz **touch / coarse pointer** nerāda (**`useSupportsHoverTooltip`**). **Peldošie toast** – **`lib/push-dom-toast.ts`** + **`lib/dom-toast-hover-dismiss.ts`** (tā pati hover loģika kā auth **`HoverPauseToast`**). **Lietotāji** – servera lapa **`app/admin/users/page.tsx`** atlasa datus; **`components/admin/admin-users-view.tsx`** (klienta): **`IERAKSTI`** kolonna rāda **kopējo abonementu skaitu** uz lietotāju (bez sadalījuma pa kategorijām); ja **`paid_plan_enabled`**, arī **VIP** slēdzis (`users.pro_vip`, **`POST /api/admin/users/pro-vip`** – admin sesijas pārbaude, RPC **`admin_set_user_pro_vip`** ar **`service_role`**, **`080_*`**); **Pro** vizuāli – **kronītis** pie avatāra; **Administrators** birka zem e-pasta; **`Intl`** datumi. Admin kopsavilkumi (RLS + **`008`**). **Vadteksti** (īsi intro, bez tabulu `<code>` un liekiem hintiem) – **`components/admin/admin-intros.tsx`**, **`045_*`**. **Sistēma** – panelis **`AdminSystemPanel`** (tulkošanu atslēgas formas virsrakstiem un kļūdām; dažu **`<select>` opciju** iekšējā teksta vēl var atšķirties). **Sistēma** (`/admin/system`) dati: **`012_system_settings.sql`**, Server Actions **`lib/admin/system-actions.ts`**, **`lib/admin/logo-actions.ts`**, publiskā lasīšana **`lib/system-settings-public.ts`** (**`brandLogo`**, **`logo_revision`**). Drag-and-drop logo (**`admin-system-logo-upload.tsx`**) → Storage **`brand`**; topbar, favicon, manifest un **`/offline`** rāda ikonu tikai ja **`logo_revision > 0`** (**`SiteBrandLogo`**, **`DashBrandLink`**). **Valodas** – CRUD pret **`public.languages`**, noklusējuma valoda jaunajiem apmeklētājiem (**`010`**; Server Actions **`lib/admin/languages-actions.ts`**, **`components/admin/admin-languages-panel.tsx`**; pamatā **`007`**); saraksta **`Intl.Collator`** – pēc pašreizējās UI lokāļa. **Integrācijas** – **`public.integrations`** (tehniska atslēga, nosaukums, `enabled`), Server Actions **`lib/admin/integrations-actions.ts`**, **`app/admin/integrations/page.tsx`**, **`components/admin/admin-integrations-panel.tsx`**; migrācija **`024_integrations.sql`**; **SELECT** visa pasaule (lasāms arī no API/feature flagām), rakstīt tikai admins; pēc mutācijas – **`revalidatePath`** arī **`/login`**, **`/signup`**, **`/dashboard`**, **`/family-sharing`**. Karodziņi: **`login_google`**, **`login_apple`** (skatīt **Autentifikācija**); **`family_sharing`** (skatīt **Ģimenes dalīšana**). **Tulkojumi** - **`public.site_translations`**: **`components/admin/admin-translations-panel.tsx`** + **`AdminTranslationsIntro`** (`titleActions`: poga vienā rindā ar virsrakstu); **modāļi** jaunai atslēgai un labošanai; tabulā **atslēga + teksts tikai aktīvajai UI lokālei**; **meklētājs** pilnā platuma rindā; **bez meklēšanas** papildu rindas ar **IntersectionObserver** (lazy DOM), **ar meklēšanu** filtrs pār **visu** servera ielasīto katalogu (`loadAdminTranslationsData`). Migrācija **`011`**; publiskā **SELECT** – **`012_site_translations_select_public.sql`**; sēkla – **`013_site_translations_seed_subtrack_ui.sql`**, skatīt **[UI tulkošana](#ui-tulkošana)** (**`python scripts/export_site_translations_sql.py`** pēc **`fallback-phrases.ts`** izmaiņām). Atšķiras **prototipa paneļu** vai citu **`components/fs/*`** vietu līmenis par fiksētām virknēm – papildināšana vienmēr ar **`t('…')`**. Admin pazīme: RLS un RPC **`current_user_is_admin`** (pēc **`023`** – **`SECURITY INVOKER`**). Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~960 px platums)

Šaurām ekrānplatēm (**≤960 px**, ieskaitot **iPhone landscape**, kur platums bieži **>768 px**) horizontālā atstarpe ir vienota caur **`--app-shell-pad-x`** (**20px**, **24px** desktop) – topbar, panelis, landing, admin, auth. Horizontālā augšējā navigācija (**`dash-nav-links`**) ir slēpta; vietā **`components/mobile-bottom-nav.tsx`** + **`mobile-bottom-nav-item.tsx`** – peldoša **apakšējā navigācija** („glass” pill) ar **īsiem virsrakstiem** zem ikonām aktīvajā valodā (**`nav.dashboard`**, **`nav.analytics`**, u.c.). **Saskarnes valoda** – **`NavUiLanguageSwitcher`** tikai **augšējā joslā** (blakus paziņojumiem), ne apakšējā pill. **`position: fixed`** portāls uz **`document.body`** (`useLayoutEffect`, lai nav hydration kļūdu). **Panelis** mobilajā – viena kolonna (virsraksts → statistika → nākamais maksājums → kalendārs); **`.app-layout`** bez landing kājenes. Mobilās CSS noteikumi **faila beigās** (`styles/subtrack.css`), lai netiktu pārrakstīti ar desktop grid.

**ADMIN sadaļā** (`@media (max-width: 768px)`, `styles/subtrack.css`): izkārtojums kolonnā (`admin-body`); **`align-items: stretch`**, lai **submenu josla un galvenais saturs** aizpildītu to pašu platumu kā augšējā josla (`dash-topbar-shell`), nevis sarautos pa kreisi. Apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

**`/admin/users` tabula**: ļoti šaurā skatā (**≤640 px**) kolonnas „VIP“ un „Reģistrēts“ tiek rādītas zem e‑pasta, iniciāļu aplis paslēpts (**Pro** kronītis tad zem e‑pasta); **virs 640 px** redzamas **pilnas kolonnas** un **iniciāļu aplis** ar kronīti, ja kontam ir **Pro** (apmaksāts vai VIP).

**Paziņojumi (`@media (max-width: 768px)`)** – **`public/fs/js/dash-alerts.js`** paneli pozicionē ar `position: fixed` pret viewport un platuma **clamp**, lai karte neaizslīd malā. **`components/nav-session-actions.tsx`** satur pogu **`#dash-notify-backdrop`**; kad panelis ir vaļā, tiek lietots tas pats slāņošanas modelis kā lietotāja izvēlnei (`z-index` fons **188**, karte **200**, `styles/subtrack.css`). Fona slānim ir **`backdrop-filter: blur(12px)`** (un **`prefers-reduced-motion`** – bez blur). **`components/nav-user-menu.tsx`** un **`dash-alerts.js`** savstarpēji aizver otras izvēlnes, izmantojot `CustomEvent` (`subtrack:notify-opened` / `subtrack:user-menu-opened`), lai nepārlietotu divus pilnekrāna overlay. **Visās platēm:** zvana poga strādā arī pēc React klienta navigācijas un ātrās skriptu ielādes – klikšķa delegēšana uz **`document` (capture)** un pēc ielādes **`components/authed-notify-bootstrap.tsx`** izsauc globālo **`window.fsBootDashAlerts()`**, lai sakristu ar DOM.

**PWA instalācijas banneris** – virs apakšējās navigācijas (`z-index` **185**); tikai **≤960 px** un ceļos **`/dashboard`**, **`/analytics`**, **`/settings`** (skatīt **[PWA](#pwa-repazy)**).

## PWA (repazy)

Produkta **Progressive Web App** slānis (pamats **0.3.51**–**0.3.53**; **0.4.x** līnija no **0.4.0**, agrāk žurnāls **0.3.54**).

### Tehniskā bāze

| Elements | Kur |
|----------|-----|
| Manifest | **`app/manifest.ts`** → **`/manifest.webmanifest`** |
| Service worker | **`app/sw.ts`**, build **`serwist.config.js`** → **`public/sw.js`** |
| SW reģistrācija | **`components/pwa/pwa-sw-register.tsx`** (saknes layout) |
| Middleware | **`proxy.ts`** – **`sw.js`** un manifest **nav** sesijas redirect ceļā |
| Offline | **`app/offline/page.tsx`**, **`components/pwa/offline-page-view.tsx`** |
| Ikonas / favicon | Storage **`brand`** ja **`logo_revision > 0`** (**`071`–`073`**); citādi **`app/icon.tsx`**, **`app/apple-icon.tsx`** |
| Publiskā konfigurācija | **`getPublicSystemSettings().pwa`** (**`lib/system-settings-public.ts`**, **`lib/pwa/public-pwa-settings.ts`**) |

**Build / dev:** **`npm run build`** (`next build && serwist build`); **`npm run dev`** (Serwist watch + Next); **`npm run dev:next-only`** – bez SW (ātrāka UI izstrāde, instalācija/PWA pilnībā pēc **`build`**).

### Datubāze un admin

- **`068_system_settings_pwa.sql`** – **`pwa_enabled`**, **`pwa_install_banner_enabled`**, **`pwa_install_settings_enabled`**, **`pwa_cache_revision`**, **`pwa_theme_color`**, **`pwa_background_color`**, **`pwa_short_name`**.
- Tulkošanas **`067_*`** (lietotāja teksti), **`069_*`** (admin forma), **`074_*`** (logo ↔ manifest hinti); **`070_*`** produkta nosaukums **repazy**.
- **`/admin/pwa`** – **`components/admin/admin-pwa-panel.tsx`**, Server Actions **`lib/admin/pwa-actions.ts`**: ieslēgt PWA, banneri, iestatījumu sadaļu, manifest krāsas, **keša revīzija** (pēc maiņas lietotājiem atjauninās SW kešu).
- Logo manifestam/faviconam nāk no **`/admin/system`** (ne atsevišķa PWA logo augšupielāde).

### Instalācijas UX (lietotājs)

| Vieta | Komponents | Kad rāda |
|-------|------------|----------|
| Mobilais banneris | **`PwaInstallHost`** → **`PwaInstallBanner`** | **`pwa_install_banner_enabled`**, platums zem **961px**, ceļi **`/dashboard`**, **`/analytics`**, **`/settings`**, nav **standalone** |
| Iestatījumi | **`PwaSettingsInstall`** | **`pwa_install_settings_enabled`**, nav standalone |
| Iestatījumi | **`PwaPushSettings`** | PWA ieslēgts; lietotājs ieslēdz push (**`/settings`**) |
| Chrome / Edge | Poga **Instalēt** | **`beforeinstallprompt`** (klausītājs host + settings) |
| iOS Safari | Teksta norāde | **`pwa.banner.ios_hint`** (bez native prompt) |

### Push paziņojumi tālrunī (0.4.8)

- **Kad sūta:** cron **`GET /api/cron/payment-push-notifications`** (tāds pats **`CRON_SECRET`** kā e-pastiem) – **viens kopsavilkums dienā** uz lietotāju, ja ir **kavētie** vai **šodien jāmaksā** (bez gaidāmo 7 dienu – kā zvana panelī bez upcoming).
- **Loģika:** **`lib/push/payment-due-alerts.ts`** + **`lib/subscriptions/due-active.ts`** (termiņš, `term_end`); „šodiena” pēc lietotāja **`display_preferences.timezone`**.
- **Ieslēgšana:** **`/settings`** → **Paziņojumi tālrunī** → atļauja pārlūkā → **`POST /api/push/subscribe`** (`push_subscriptions`).
- **ENV:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (**`supabase.env.template`**; `npx web-push generate-vapid-keys`).
- **SQL:** **`081_push_subscriptions.sql`**, **`082_site_translations_push.sql`**.

### Sākuma ekrāna ikonas badge (0.4.10)

- **Zvana skaitītājs lietotnē** (`#dash-notify-badge`) un **ikonas skaitlis uz iOS/Android sākuma ekrāna** ir atsevišķi: pēdējais sinhronizējas ar **Badging API** (`navigator.setAppBadge` / `clearAppBadge`) no **`lib/pwa/app-badge.ts`** un **`dash-alerts.js`** (kavētie + šodien + gaidāmie 7 d.; **bez** ģimenes kopīgotajiem ierakstiem – **`subtrackSubscriptionsForNotifyList`**).
- **Kad atjauninās:** panelī ielādējot abonementus, pārslēdzoties atpakaļ uz lietotni (`visibilitychange`), un **Web Push** cron (`badgeCount` → **`app/sw.ts`**).
- **iOS:** strādā tikai **instalētai** PWA (atvērt no sākuma ekrāna ikonas, ne Safari cilne); **iOS 16.4+**. Bez push un bez atvēršanas lietotnes ikona var palikt bez skaitļa.

**Bannera uzvedība (0.4.7):**

- **X** („Ne tagad”, `pwa.banner.dismiss`) – **`localStorage`** atslēga **`subtrack_pwa_install_dismissed_v1`** ar **timestamp**; banneris atkal pēc **3 dienām** (**`PWA_INSTALL_DISMISS_COOLDOWN_MS`** – **`lib/pwa/defaults.ts`**). Vecais ieraksts **`"1"`** tiek ignorēts (rāda banneri atkal).
- Pēc veiksmīgas instalācijas vai atteikuma dialogā – tā pati noraidīšanas atzīme (kamēr nav standalone, banneris vairs nerāda).
- **Hidrācija:** host renderē banneri tikai pēc **`mounted`** (**`pwa-install-host.tsx`**), lai serveris un klients nesadalītos.
- **UI:** logo no **`brandLogo`**, fons no **`pwa.background_color`** (admin; ja logo balts kvadrāts – iestati **`#ffffff`** **`/admin/pwa`**), bez atsevišķas logo ēnas; izteiktāka kartes **apmale un ēna**; stili **`styles/subtrack.css`** (`.pwa-install-*`).

### Faili (īsumā)

```
app/layout.tsx              # PwaInstallHost, PwaSwRegister, SubtrackIntlProvider
app/manifest.ts, app/sw.ts, app/offline/page.tsx
components/pwa/pwa-sw-register.tsx
components/pwa/pwa-install-host.tsx
components/pwa/pwa-install-banner.tsx
components/pwa/pwa-settings-install.tsx
components/pwa/pwa-push-settings.tsx
components/pwa/offline-page-view.tsx, offline-wifi-icon.tsx
lib/pwa/install-prompt.ts, defaults.ts, public-pwa-settings.ts, brand-mark.tsx, app-badge.ts
lib/push/push-client.ts, payment-due-alerts.ts, send-web-push.ts, vapid-config.ts
lib/subscriptions/due-active.ts
app/api/push/subscribe, app/api/push/unsubscribe
app/api/cron/payment-push-notifications
lib/i18n/pwa-fallback-phrases.ts
```

### Pārbaude pēc izmaiņām

1. Supabase: **`067`–`070`**, **`074`**, **`081`**, **`082`**; admin **`/admin/pwa`** – PWA ieslēgts.
2. ENV: VAPID atslēgas + **`SUPABASE_SERVICE_ROLE_KEY`** (cron).
3. **`npm run build`** – **`public/sw.js`** ar push handleriem.
4. **`/settings`** → ieslēgt paziņojumus; cron (vai manuāli): **`/api/cron/payment-push-notifications?secret=…`** ar testa kavēto/šodienas abonementu.
5. Mobilā: banneris, instalācija, push uz lock screen (Android/instalēta PWA; iOS atbalsts atkarīgs no Safari/PWA).

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | `styles/subtrack.css` (no `FS` prototipa); `app/globals.css` – pēc **`@import ../styles/subtrack.css`** arī **login sociālais** tweaks un **`admin-integration-*` / `admin-switch*`** (admin integrācijas slēdzis), lai **Turbopack + `@tailwindcss/postcss`** neuzrādītu **`CssSyntaxError`** lielākā vienotā **`subtrack.css`** importā; skatīt komentārus failā |
| Ikonas | Font Awesome 6 **Free** (`app/layout.tsx` CDN): navigācijā / admin u.c. **inline SVG**; paneļa abonementa **ikona** – atlasīts **`fa-solid`** **klases** saraksts **`lib/fs-icons.ts`** (**~102** vienības `FA_ICONS_ALL`), **tikai šis apakškopums**, ne visa FA bibliotēka; licences jēga – skatīt [Font Awesome licenci](https://fontawesome.com/license/free). Meklēšanas sinonīmi panelī: **`lib/fs-icon-picker-search.ts`** |
| Demo paneļi | `public/fs/js/*.js` (kalendārs, modāļi, paziņojumi; **`/dashboard`** CRUD pret `/api/subscriptions`; **`/demo/dashboard`** – tas pats UI, bez API; analītika – **`/fs/js/analytics.js`** kategoriju donut kā demo) |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `proxy.ts`, `database/supabase/*.sql` |
| PWA / logo | [Serwist](https://serwist.pages.dev) (`serwist.config.js`, `app/sw.ts` → `public/sw.js`); instalācijas UX – **`components/pwa/*`**; logo – **`sharp`** + Storage **`brand`** (`lib/brand/process-logo.ts`). Skatīt **[PWA (repazy)](#pwa-repazy)** |

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
| **`generateMetadata` / `getUiPhraseForRequest`** | **`resolveRequestUiLocales`** un sapludinātais tulkošanu objekts (**`lib/ui/server-ui-phrases.ts`**) tiek **memoizēti** uz dokumenta pieprasījumu. **`getPublicSystemSettings`** / **`getSystemSiteName`** (**`generateMetadata`** + layout) – viens izsaukums uz pieprasījumu. |

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
   # Pēc SQL 023 un 080 (obligāti serverī):
   # SUPABASE_SERVICE_ROLE_KEY=<service_role_atslēga>
   #   – signup e-pasta pārbaude (signupEmailExistsAction)
   #   – admin VIP slēdzis (/api/admin/users/pro-vip)
   # Logo (/admin/system, 071–072): admin sesija + SUPABASE_SERVICE_ROLE_KEY + 072_brand_storage.sql
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
   - **`database/supabase/043_users_pro_vip.sql`** – **`users.pro_vip`**; **`users_update_own`** aizsargā VIP; RPC **`admin_set_user_pro_vip`** (pēc **`080`**: tikai **`service_role`**). Pēc **`027`**.
   - **`database/supabase/044_site_translations_admin_users_pro_vip.sql`** – admin lietotāju tabulas un **`api.admin.pro_vip.*`**. Pēc **`012`**.
   - **`database/supabase/045_site_translations_shorter_admin_ui_hints.sql`** – īsāki admin intro teksti; **`admin.forms.preview_intro`**; **`fs.dashboard.advanced_hint_devices`** (lv „termiņu”). Pēc **`044`**.
   - **`database/supabase/046_site_translations_landing_faq_public.sql`** – sākumlapas FAQ produkcijas teksti (konta dati, mobilais, pārlūks, demo vs konts); dzēš novecojušās **`landing.faq.q_ready`** / **`a_ready`**. Pēc **`012`**.
   - **`database/supabase/050_site_translations_landing_footer_hero.sql`** – **`landing.hero.subtitle`** ar **`{SYSTEM_NAME}`**; **`landing.footer.byline`** (pārvaldība, ne prototips). Pēc **`012`**.
   - **`database/supabase/051_system_settings_email_templates.sql`** – sākotnēji **`email_templates`** uz **`system_settings`**; pēc **`078`** – atsevišķa tabula **`system_settings_email_templates`**. Pēc **`012`**.
   - **`database/supabase/052_email_reminder_log.sql`** – žurnāls kavēto maksājumu e-pastu deduplikācijai (RLS + deny politikas). Pēc **`001`**. Ja **`052`** bez politikām: **`079_email_reminder_log_rls_policies.sql`**.
   - **`database/supabase/053_site_translations_admin_email_design.sql`** – admin **`/admin/email-design`**. Pēc **`012`**.
   - **`database/supabase/054_site_translations_admin_email_design_lead.sql`** – admin apraksts par visām e-pasta valodām. Pēc **`053`**.
   - **`database/supabase/055_email_design_migrations_combined.sql`** – apvienots skripts **`051`–`053`** (e-pasta dizains admin). Ja jau palaisti atsevišķi, nav obligāti.
   - **`database/supabase/049_site_translations_legal.sql`** – **`/terms`**, **`/privacy`**, **`/cookies`**, cookie banner. Pēc **`012`**.
   - **`database/supabase/056_site_translations_mobile_nav_home.sql`** – **`mobile.nav.home`** (īss virsraksts demo apakšējā navigācijā). Pēc **`012`**.
   - **`database/supabase/057_site_translations_landing_hero_cta_signup_lv.sql`** – **`landing.hero.cta_signup`** (visas lokāles: „Sākt lietot” / „Start using” u.c.). Pēc **`012`**.
   - **`database/supabase/058_site_translations_modal_backdrop_confirm.sql`** – **`ui.modal.confirm_close_*`** (fona klikšķis aizver modāli tikai pēc apstiprinājuma). Pēc **`012`**.
   - **`database/supabase/059_site_translations_i18n_gaps.sql`** – trūkstošie **`fr`/`de`/`es`/`pt`/`ru`** tulkojumi (t.sk. kalendāra leģenda, FAQ etiķetes). Pēc **`012`**.
   - **`database/supabase/060_site_translations_dashboard_category_bar.sql`** – **`fs.dashboard.category_bar_aria`**. Pēc **`012`**.
   - **`database/supabase/061_subscription_payments.sql`** – tabula **`public.subscription_payments`**: katrs „atzīmēt samaksāts” (`paid_on`, **`amount_paid`**, **`amount_scheduled`**, `period`, `next_payment_date_after`); RLS tikai savam `user_id`; kalendāra atzīmes sinhronizācijai starp ierīcēm. Pēc **`001`**.
   - **`database/supabase/062_site_translations_icon_show_more_lv.sql`** – **`fs.dashboard.icon_show_all`** LV → „Parādīt vairāk”. Pēc **`012`**.
   - **`database/supabase/063_site_translations_faq_nav_lv.sql`** – **`nav.faq_nav`**, **`landing.faq.label`**, **`mobile.aria.faq`** LV (**`BUJ`** u.tml.). Pēc **`012`**.
   - **`database/supabase/064_site_translations_dashboard_stat_urgency.sql`** – paneļa kopsavilkuma kolonnas (**`fs.dashboard.stat_overdue_label`**, **`stat_today_due_label`**, **`stat_bills_*`**). Pēc **`012`**.
   - **`database/supabase/065_subscriptions_dynamic_amount.sql`** – **`public.subscriptions.is_dynamic_amount`**; modāļa slēdzis „Dinamiskais maksājums”; sarakstā **„Mainīt summu”** (inline summa). Pēc **`001`**.
   - **`database/supabase/066_subscriptions_due_amount_override.sql`** – **`due_amount_override`** / **`due_amount_override_for`**: perioda summa (tikai tekošais termiņš); pēc apmaksas / nākamā perioda – atkal **`amount`**. Pēc **`065`**.
   - **`database/supabase/067_site_translations_pwa.sql`** – PWA lietotāja teksti, **`legal.cookies.s5`**. Pēc **`012`**.
   - **`database/supabase/068_system_settings_pwa.sql`** – **`system_settings`**: PWA slēdži, manifest override, **`pwa_cache_revision`**. Pēc **`027`**.
   - **`database/supabase/069_site_translations_admin_pwa.sql`** – admin **`/admin/pwa`**. Pēc **`012`**.
   - **`database/supabase/070_system_settings_product_name_repazy.sql`** – **`system_name`** → **repazy** (ja vēl SubTrack). Pēc **`012`**.
   - **`database/supabase/071_system_settings_logo.sql`** – **`system_settings.logo_revision`** (0 = ģenerētās ikonas). Pēc **`068`**.
   - **`database/supabase/072_brand_storage.sql`** – Storage **`brand`** (publiska lasīšana tikai zināmiem logo failiem; **`080`** precizē politiku). Pēc **`071`**.
   - **`database/supabase/073_site_translations_admin_logo.sql`** – admin logo augšupielādes teksti. Pēc **`012`**.
   - **`database/supabase/074_site_translations_admin_pwa_logo_hint.sql`** – **`/admin/pwa`**: PWA ikonas no **`/admin/system`** logo, hint pēc logo maiņas. Pēc **`069`**.
   - **`database/supabase/075_system_settings_logo_revision_fix.sql`** – labo **`logo_revision`**, ja iepriekš ierakstīts `Date.now()` (integer overflow). Pēc **`071`**.
   - **`database/supabase/076_system_settings_public_read.sql`** – *(vēsturisks)* skats **`system_settings_public`**; **aizstāj ar `078`**, ja jau palaists.
   - **`database/supabase/077_site_translations_admin_logo_err_storage_hint.sql`** – logo kļūdas teksts (vēsturiski). Pēc **`073`**.
   - **`database/supabase/083_site_translations_logo_upload_service_role.sql`** – logo kļūdas teksts (ENV + **`072`**). Pēc **`077`**.
   - **`database/supabase/084_family_sharing.sql`** – integrācija **`family_sharing`**, tabula **`family_sharing_links`**, RLS, partnera **`subscriptions`** SELECT ownerim. Pēc **`024`**, **`001`**.
   - **`database/supabase/085_site_translations_family_sharing.sql`** – tulkošanas **`session.family_sharing`**, **`family_sharing.*`**, paneļa kopsavilkuma teksti. Pēc **`012`**.
   - **`database/supabase/086_family_sharing_partner_read_subscriptions.sql`** – partneris lasa owner **`subscriptions`** (un otrādi) aktīvai saitei; aizstāj **`084`** SELECT politiku. Pēc **`084`**, **`001`**.
   - **`database/supabase/087_family_sharing_partner_leave.sql`** – partner **`UPDATE`** aktīvai saitei → **`revoked`**. Pēc **`084`**.
   - **`database/supabase/088_family_sharing_partner_combine.sql`** – partner var mainīt **`combine_in_totals`**. Pēc **`087`**.
   - **`database/supabase/078_system_settings_email_templates_split.sql`** – **`system_settings_email_templates`** (admin RLS); noņem **`system_settings_public`**. Pēc **`051`** (un **`076`**, ja bija). **Obligāti** pēc drošības audita.
   - **`database/supabase/079_email_reminder_log_rls_policies.sql`** – RLS politikas **`email_reminder_log`** (Advisor). Pēc **`052`**.
   - **`database/supabase/080_security_advisor_warnings.sql`** – **`storage.brand`** bez bucket listing; **`admin_set_user_pro_vip`** tikai **`service_role`**. Pēc **`043`**, **`072`**.
   - **`database/supabase/081_push_subscriptions.sql`** – Web Push endpointi + **`push_notification_log`** (deduplikācija). Pēc **`001`**.
   - **`database/supabase/082_site_translations_push.sql`** – push un **`settings.push.*`** teksti. Pēc **`012`**.
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
- **Serveris** - saknes **`app/layout.tsx`** paraleli ielādē **`getPublicSiteTranslationsMerged(locale, defaultLocale)`** (`lib/site-translations-public.ts`, anon Supabase klients + **`unstable_cache`**, tags **`site-translations-public`**) un **`getPublicSystemSettings()`** (`lib/system-settings-public.ts`: **`systemName`**, **`brandLogo`**, **`pwa`**, display prefs; keša tags **`system-settings`**), tad ietin saturu **`SubtrackIntlProvider`** (`locale`, **`systemSiteName`**, **`brandLogo`**, **`paidPlan`**, **`pwa`**, **`dbMap`**).
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
app/api/family-sharing/   # ģimenes dalīšana: uzaicinājumi, PATCH (accept, revoke, leave, krāsa, combine)
app/family-sharing/       # lapa (integrācijas karodziņš `family_sharing`)
components/               # nav-landing, nav-dash, mobile-bottom-nav(+item), nav-ui-language-switcher, subtrack-intl-provider, auth/* …
components/family-sharing/  # family-sharing-view.tsx
components/legal/         # juridiskās lapas, SiteLandingFooter, cookie consent
components/subtrack-tooltip.tsx  # admin (u.c.) hover tooltipi: portal + fine-pointer; hover uz burbuļa; stili `subtrack.css`
components/flash-param-toast.tsx  # auth flash + HoverPauseToast (hover aptur auto-aizvēršanu)
lib/push-dom-toast.ts         # admin / settings toast (#toast-container)
lib/dom-toast-hover-dismiss.ts  # kopīga hover → auto-aizvēršana (arī FS showToast)
components/auth/          # auth-login-flow.tsx, auth-signup-flow.tsx (kartīšu saturs lokālei)
components/admin/         # admin-shell, admin-users-view, admin-intros, paneļu formas …
components/fs/            # Paneļa / analītikas skati; `fs-i18n-bootstrap.tsx` – servera inlīnas `window.__SUBTRACK_*` pirms /fs/js
lib/admin/                # Server Actions: `system-actions.ts`, `logo-actions.ts`, `pwa-actions.ts`, `languages-actions.ts`, …
lib/brand/                # Storage URL, logo resize (`logo-assets.ts`, `process-logo.ts`); noklusējuma zīmols – `lib/pwa/brand-mark.tsx`
lib/pwa/                  # `install-prompt.ts`, `defaults.ts` (3 dienu dismiss), `public-pwa-settings.ts`, `brand-mark.tsx`
components/brand/         # `site-brand-logo.tsx`, `dash-brand-link.tsx`
components/pwa/           # `pwa-sw-register`, `pwa-install-host`, `pwa-install-banner`, `pwa-settings-install`, `offline-page-view`
lib/system-name-placeholder.ts # {SYSTEM_NAME} aizvietošana `t()` ceļā
lib/system-settings-public.ts  # anon kešots: nosaukums, `brandLogo`, `pwa`, display prefs (`system-settings`)
lib/i18n/pwa-fallback-phrases.ts  # PWA + admin PWA fallback (papildus `fallback-phrases.ts`)
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
lib/subscriptions/        # `analytics-access.ts`, `dashboard-free-tier-gate.ts`, `subscription-payment.ts`, `fetch-paid-calendar-server.ts`, `fetch-subscriptions-server.ts`, `subscription-map.ts`
lib/security/             # `auth-rate-limit.ts` (proxy), `server-action-rate-limit.ts` (signup e-pasta pārbaude)
lib/emails/               # admin e-pasta šabloni, Resend cron, Supabase Auth eksports
app/api/cron/             # `overdue-payment-emails` (CRON_SECRET, Resend)
lib/integrations/       # `integration-enabled.ts`, OAuth: `login-social-flags.ts`
lib/family-sharing/     # `family-sharing-server.ts`, tipi, dashboard bootstrap ar kopīgotajiem ierakstiem
lib/user-display-preferences.ts  # display_preferences forma + **`mergeDisplayPreferencesFromSources`** (DB + LS; opcija **`prioritizeDbInterfaceLanguage`**)
lib/languages-catalog.ts  # kešots valodu katalogs + noklusējuma `code` (anon lasījums)
lib/supabase/             # anon/server klienti, `service-role-client.ts` (service_role tikai serverim), sesijas loģika (+ **rate limit** – skatīt `proxy.ts`)
proxy.ts                  # **rate limit** auth ceļiem, tad `updateSession` + redirecti; sk. **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**
database/supabase/        # Postgres + RLS (`001` … `088` utt.; PWA **`067`–`070`**, logo **`071`–`075`**, drošība **`078`–`080`**, push **`081`–`082`**, family **`084`–`088`**)
serwist.config.js         # Serwist build (CommonJS; ģenerē `public/sw.js`)
scripts/                  # `export_site_translations_sql.py`; **`security-*.mjs`** (smoke, regression, migration-checklist)
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

**PWA:** izstrādē **`npm run dev`** ģenerē/uzrauga **`public/sw.js`**; pilnai instalācijas plūsmai pirms deploy – **`npm run build`**. Detalizēti – **[PWA (repazy)](#pwa-repazy)**.

**Ja izstrādē konsolē vai pārlūkā parādās:** `Router action dispatched before initialization` (**`use-action-queue`**, **`hmrRefresh`**) vai **`ChunkLoadError` / `Failed to load chunk`** (`/_next/static/chunks/...`) – tipiska **Next.js 16 Turbopack** HMR / fragmentu sacīkste (parasti tikai **`next dev`** bez **`--webpack`**). **Risinājums:** apturēt serveri, izdzēst mapi **`.next`**, palaist **`npm run dev`** no jauna un **cietā pārlādēšana**; ja atkārtojas – **`npm run dev:webpack`** (stabilāks izstrādes serveris).

**Uzmanību:** nekādā **`next.config`** nelietojiet `deploymentId: process.env.X ?? ""`, ja rezultāts var būt **`""`** – tukša virkne Turbopack režīmā var salauzt hidratāciju un līdzīgas kļūdas (skat. [next.js #92858](https://github.com/vercel/next.js/issues/92858)).

**Drošība:** skatīt **[Vide un drošība](#vide-un-drošība)** un **`security_check.md`**. Īsumā: **`npm run security:check`** pēc pull ar jauniem SQL (**`078`**, **`079`**, **`080`**).

```bash
npm run build
npm run start
npm run lint
npm run security:check    # pēc DB / drošības izmaiņām
```

## Pēc Git atjauninājuma (`git pull`)

Šī sadaļa ir domāta izstrādātājiem un tiek izmantota arī kā **kopīga zināšanu bāze asistentiem** (Cursor u.tml.), lai pēc jaunākā commit ievilkšanas būtu skaidrs, ko darīt un kā īsi komunicēt.

### Obligātie / ieteicamie soļi

1. **`npm install`** – vienmēr pēc pull, ja mainījies `package.json` vai `package-lock.json`; ja šaubies, atkārto arī tad, kad lock fails nav mainījies (ātri un novērš „missing dependency’’ lokāli).
2. **Žurnāls** – salīdzināt ar **[Izmaiņu žurnālu](#izmaiņu-žurnāls)** un rindiņu **`Versija:`** README augšā: tur tiek apkopotas būtiskākās izmaiņas (Auth, proxy/sesija, SQL, ENV, paneļa FS slānis).
3. **Supabase un ENV** – salīdzināt **`database/supabase/`** (līdz **`088_*`**, ģimenes dalīšana **`084`–`088`**) un **`supabase.env.template`** ar **`.env.local`**. **Drošība (2026-05):** **`078`**, **`079`**, **`080`**; **`SUPABASE_SERVICE_ROLE_KEY`** – signup, VIP, cron, **ģimenes uzaicinājums**. Logo: **`071`–`074`**, **`072`**, **`077`**. PWA SQL: **`067`–`070`**, **`074`**. Pēc SQL: **`npm run security:smoke`**. Migrācijas secība – **Supabase iestatīšana** un **`npm run security:migration-checklist`**. PWA: **`npm run build`** (ģenerē **`public/sw.js`**) vai **`npm run dev`** – skatīt **[PWA](#pwa-repazy)**. Ģimenes dalīšana: admin **`/admin/integrations`** → **`family_sharing`**.
4. **Pārbaude** – **`npm run lint`** un **`npm run build`** pēc lielākām izmaiņām; ikdienas **`npm run dev`**. Ja mainīta drošība/DB: **`npm run security:check`**. Mobilā: PWA banneris + **`/offline`** (**[PWA](#pwa-repazy)**). Turbopack **`CssSyntaxError`** – dzēst **`.next`**, restartēt dev (žurnāls **0.3.8**).

### Ko „pateikt’’ / kā īsi atbildēt pēc jauna Git atjauninājuma

- **Lietotājam vai komandai:** īsi uzskaitīt: vai būtu jāpalaiž `npm install`; vai README žurnālā ir kas jauns (ENV, SQL, PWA); vai šķietami mainījušies paneļa faili (`public/fs/js/`, `components/fs/`, `components/pwa/`); tad **`npm run dev`** un manuāli pārbaudīt galvenās lapas (sākumlapa, panelis, auth, admin, **PWA banneris** mobilā – **[PWA](#pwa-repazy)**).
- **AI palīgam:** neatkārtot visu README; izmantot šo sadaļu kā čeklisti. Ja žurnālā ir konkrētas jaunās funkcijas – nosaukt tās īsi; ja nav pieraksta žurnālā bet pull saturēja tikai mazus labojumus – to arī norādīt un ieteikt tikai `npm install` / `npm run dev`, ja nav redzamu `package-lock` vai DB izmaiņu.

### Uzturētājiem

Pie būtiskām izmaiņām **papildināt [Izmaiņu žurnāls](#izmaiņu-žurnāls)** (datums; jauna apakšversija): jauni SQL faili, ENV atslēgas, jauni maršruti, lauztās izmaiņas. **Pēc 0.3.54** žurnāla ierakstiem lieto **0.4.x** (skatīt žurnāla augšējo piezīmi); **`package.json`** `version` = jaunākā **0.4.***.

## Vide un drošība

- Nekommitē `.env.local` un sensitīvus atslēgu ierakstus; klientā tikai **`NEXT_PUBLIC_*`** (URL, anon key, `SITE_URL`).
- Pilns audits, atzīme un checklist: **`security_check.md`**.

### Servera atslēga (`SUPABASE_SERVICE_ROLE_KEY`)

| Funkcija | Kur |
|----------|-----|
| Signup e-pasta aizņemtība | **`signupEmailExistsAction`** (`023`, `080`) |
| Admin VIP slēdzis | **`POST /api/admin/users/pro-vip`** (`080`) |
| Cron kavētie e-pasti | **`GET /api/cron/overdue-payment-emails`** |
| Cron PWA push (kavētie + šodien) | **`GET /api/cron/payment-push-notifications`** |
| Logo augšupielāde | Admin sesija + **`SUPABASE_SERVICE_ROLE_KEY`** + **`072_brand_storage.sql`** |
| Ģimenes dalīšana – uzaicinājums pa e-pastu | **`lookupUserIdByEmail`** (`lib/family-sharing/family-sharing-server.ts`, **`084`**) |

### Drošības migrācijas (kopsavilkums)

Jaunai videi pēc **`001`** – obligāti vismaz: **`015`**, **`016`**, **`022`**, **`023`**, **`078`**, **`079`**, **`080`**. Saraksts: **`npm run security:migration-checklist`**.

| SQL | Īsumā |
|-----|--------|
| **015** | `users`: nevar pašcelt `is_admin` / `email` |
| **016** | `auth.users` → `public.users.email` sync |
| **022–023** | Advisor: RPC grants, INVOKER admin pārbaude |
| **078** | E-pasta šabloni atsevišķā tabulā (aizstāj **076**, ja palaists) |
| **079** | `email_reminder_log` RLS politikas |
| **080** | `brand` storage bez listing; VIP RPC tikai service_role |

### Komandas un CI

```bash
npm run security:migration-checklist   # obligāto SQL saraksts
npm run security:regression-check      # L2 statika (CI push/PR)
npm run security:smoke                 # DB smoke (.env + opc. SECURITY_SMOKE_*)
npm run security:check                 # regression + audit + smoke
npm run audit
```

- **CI:** `.github/workflows/security-audit.yml` (L2 + `npm audit`, iknedēļas), **`security-smoke.yml`**, Dependabot (npm + GitHub Actions).
- **PR:** checklist `.github/pull_request_template.md`; Cursor rule `.cursor/rules/subtrack-security-l2.mdc`.
- **Proxy rate limit:** `lib/security/auth-rate-limit.ts`, `proxy.ts` (auth ceļi; **`DISABLE_RATE_LIMIT`**, **`RATE_LIMIT_MULTIPLIER`**).
- **Signup e-pasta pārbaude:** `signupEmailExistsAction` – `lib/security/server-action-rate-limit.ts` (sliding window).
- **CSP enforce:** `next.config.ts` (`Content-Security-Policy`).

### Supabase Dashboard (manuāli)

- **Leaked password protection:** Authentication → Providers → Email (Pro plānā; Free var rādīt Advisor brīdinājumu pat pēc ieslēgšanas).
- Pēc SQL pull: **Security Advisor → Refresh**.

- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **abonementu CRUD** izmanto **Supabase Postgres** (`001` → **`subscriptions`**, RLS) un **Next Route Handlers** (`app/api/subscriptions`). Citas funkcijas un paplašinājumi dokumentē atsevišķi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām. **PWA** – **[PWA (repazy)](#pwa-repazy)**. **0.4.x** no **0.4.0** (= agrāk **0.3.54**).

### 0.4.13 (2026-05-21)

- **Ģimenes dalīšana – partneris un RLS** – SQL **`086`–`088`**: partneris redz owner abonementus, var **pamest dalību** un mainīt **„saskaitīt kopā”**. **`/family-sharing`**: sadaļas **Tavi uzaicinājumi** (tikai owner) un **Dalība ar mani** (partner); **`PATCH`** `leave`, partner **`combineInTotals`**. Panelis: abpusēji kopīgotie ieraksti, dedupe; paziņojumi/zvans **bez** kopīgotajiem (**`dash-alerts.js`**, **`subtrackSubscriptionsForNotifyList`**). Kopsummas **\*** + tooltip. Tulkošanas **`database/translations_daily/2026-05-21.sql`**. Faili: **`family-sharing-view.tsx`**, **`family-sharing-server.ts`**, **`[id]/route.ts`**, **`dashboard.js`**, **`086`–`088`**.

### 0.4.12 (2026-05-21)

- **Ģimenes dalīšana – UI un tulkojumi** – **`/family-sharing`**: platums kā **`/analytics`** (`main-content`, bez `max-width: 720px`); formas **`form-group`** / **`color-picker-row`** / **`stat-card`**; sadaļas „Saņemtie” / „Tavi” ar atdalītāju un tukšajiem stāvokļiem kartītēs. **`085_*`**: kolonnas **`translation_key`**, **`locale`**, **`value`**. **`fallback-phrases.ts`** – pilns **`family_sharing.*`** bloks. Faili: **`family-sharing-view.tsx`**, **`subtrack.css`**.

### 0.4.11 (2026-05-21)

- **Ģimenes dalīšana** – admin **`/admin/integrations`**: ieslēdz **`family_sharing`**; lietotāja izvēlnē **`session.family_sharing`** → **`/family-sharing`** (uzaicinājums pa e-pastu, krāsa, slēdzis „saskaitīt kopā”). Panelī kopīgotie ieraksti ar vieglu fona krāsu, kalendārā – apmale; kopsumma ar **\***, apakšā labajā – „tikai mani izdevumi”, ja slēdzis ieslēgts. SQL **`084_*`**, **`085_*`**; API **`/api/family-sharing`**; **`lib/family-sharing/*`**, **`dashboard.js`**.

### 0.4.10 (2026-05-21)

- **PWA ikonas badge** – sākuma ekrānā (Badging API): sinhronizācija ar zvana skaitītāju (`lib/pwa/app-badge.ts`, **`dash-alerts.js`**); push cron **`badgeCount`** + **`app/sw.ts`**.

### 0.4.9 (2026-05-21)

- **Logo augšupielāde** – **`lib/admin/logo-actions.ts`**: pēc admin pārbaudes Storage un **`logo_revision`** ar **`service_role`** (novērš storage RLS kļūdu); **`083_*`** tulkojumi; ENV **`SUPABASE_SERVICE_ROLE_KEY`**.

### 0.4.8 (2026-05-21)

- **PWA Web Push** – kavētie + šodienas maksājumi (kā zvana panelis): **`081_*`**, **`082_*`**, **`lib/push/*`**, **`app/sw.ts`** push/click, **`PwaPushSettings`** **`/settings`**, cron **`/api/cron/payment-push-notifications`**, VAPID ENV.

### 0.4.7 (2026-05-21)

- **PWA instalācijas banneris** – UI (`components/pwa/pwa-install-banner.tsx`, **`styles/subtrack.css`**): logo, fons no **`pwa_background_color`**, izteiktāka apmale/ēna; **X** aizvēršana; **3 dienu** cooldown (**`lib/pwa/defaults.ts`**, timestamp **`localStorage`**).
- **Hidrācija** – **`pwa-install-host.tsx`**: banneris tikai pēc klienta **`mounted`**.
- **README** – sadaļa **[PWA (repazy)](#pwa-repazy)**; **0.4.x** numerācija (0.4.0 = agrāk 0.3.54); struktūra līdz SQL **080**; pēc **`git pull`** PWA čekliste.

### 0.4.6 (2026-05-21)

- **README** – drošības sadaļa (**`078`–`080`**, **`079`**, ENV, `npm run security:*`); migrācijas secība; VIP un e-pasta šabloni atjaunināti.

### 0.4.5 (2026-05-21)

- **Supabase Advisor** – **`078`**: **`system_settings_email_templates`**; noņemts **`system_settings_public`**. **`079`**: **`email_reminder_log`** RLS. **`080`**: **`brand`** + VIP **`service_role`**.

### 0.4.4 (2026-05-21)

- **Drošība LOW (L1/L2)** – `npm run security:regression-check`, `npm run security:check`; CI audit + L2; PR checklist; **`077_*`** logo kļūdas teksts; **`security_check.md`** atjaunināts.

### 0.4.3 (2026-05-21)

- **Logo `logo_revision`** – vairs ne **`Date.now()`** (integer overflow); katrā augšupielādē `+1` (**`logo-actions.ts`**). Ja jau redzēji kļūdu: SQL **`075_system_settings_logo_revision_fix.sql`**.

### 0.4.2 (2026-05-21)

- **Toast un tooltip hover** – peldošie ziņojumi nepazūd, kamēr kursors ir virs tiem: **`lib/dom-toast-hover-dismiss.ts`** (**`pushDomToast`**, **`public/fs/js/subscriptions-helpers.js`** `showToast`); auth jau **`HoverPauseToast`** (**`flash-param-toast.tsx`**). **`SubtrackTooltip`** – burbulis portalā ar **`pointer-events`**, aizkave pārejai no pogas uz burbuli (**`subtrack-tooltip.tsx`**, **`styles/subtrack.css`**).

### 0.4.1 (2026-05-21)

- **README** – ENV/logo skaidrojums; struktūra **`lib/brand/process-logo.ts`**; tehniskais steks (Serwist, **sharp**).

### 0.4.0 (2026-05-21) – 0.4.x sākums

- **Admin PWA + logo** – **`074_site_translations_admin_pwa_logo_hint.sql`**: **`/admin/pwa`** skaidro, ka manifest ikonas/favicon nāk no **`/admin/system`** logo; priekšskatījums, ja **`brandLogo`** ir. **`admin-pwa-panel.tsx`**. *(Agrāk žurnālā kā **0.3.54**.)*

### 0.3.53 (2026-05-21)

- **PWA `/offline`** – pārstrādāts UI (**`components/pwa/offline-page-view.tsx`**, **`offline-wifi-icon.tsx`**, **`styles/subtrack.css`** `.offline-*`): gradienta fons, stikla karte, lielāka pulsa indikatora (2×), **`online`** notikums automātiski pārlādē lapu; augšējais logo **tikai** ar augšupielādētu zīmolu (**`logo_revision > 0`**, **`SiteBrandLogo`** / **`brandLogo`** no layout) – bez noklusējuma **R** un bez teksta nosaukuma. Tulkošanas atslēgas **`pwa.offline.*`** (**`067_*`**, **`lib/i18n/pwa-fallback-phrases.ts`**).

### 0.3.52 (2026-05-21)

- **Produkta logo** – **`/admin/system`**: drag-and-drop augšupielāde; **`sharp`** ģenerē 32/64/180/192/512/maskable PNG Supabase Storage **`brand`**; **`logo_revision`** kešam; favicon + manifest no augšupielādes; topbar rāda ikonu (ne teksta nosaukumu), ja logo ir; bez logo – teksta nosaukums (**`DashBrandLink`**). **`<title>`** = **`system_name`**. Faili: **`lib/brand/*`**, **`components/brand/*`**, **`components/admin/admin-system-logo-upload.tsx`**. SQL **`071`–`074`**. Logo saglabāšana: **admin sesija** + serverī **`service_role`** (**`logo-actions.ts`**, kā VIP API).

### 0.3.51 (2026-05-21)

- **PWA (repazy)** – Serwist SW (`serwist.config.js`, `app/sw.ts`), `app/manifest.ts`, ikonas (`app/icon.tsx`, `app/apple-icon.tsx` vai Storage **`brand`** pēc logo); **`/offline`** fallback + jauns offline UI (skat. **0.3.53**); instalācijas UX (`components/pwa/*`), admin **`/admin/pwa`**, publiskā konfigurācija `getPublicSystemSettings().pwa`. SQL **`067`–`070`**. Produkta nosaukums **repazy** (`070_*`, OG/manifest bez logo). Dev: **`npm run dev`** (concurrently + serwist watch); **`npm run dev:next-only`** bez SW.

### 0.3.50 (2026-05-20)

- **Dinamiskā summa** – **`subscriptions.is_dynamic_amount`** (**`065_*`**); perioda pārklājums **`due_amount_override`** / **`due_amount_override_for`** (**`066_*`**) – **„Mainīt summu”** maina tikai tekošā termiņa summu; nākamais periods atkal no iestatījumiem (`amount`); pēc **„Samaksāts”** pārklājums tiek notīrīts. Modāļa slēdzis; sarakstā **„Mainīt summu”** un **`fa-chart-line`** pie nosaukuma. **`dashboard-fs-view.tsx`**, **`dashboard.js`**, **`subscriptions-helpers.js`**, **`subscription-map.ts`**, **`subscription-payment.ts`**, demo **`mockWeekBill`**.

### 0.3.49 (2026-05-20)

- **Panelis – kopsavilkums un UX** – virs saraksta **kategoriju josla** (`renderDashboardCategoryBar`, tooltip desktop / leģenda touch); **Nākamais maksājums** sadalīts: **kavētie** (sarkana karte), **šodien jāmaksā** (dzeltena), **nākamais**; trīs kolonnās nākamais rāda **€ + nosaukumu** (bez datuma un summas labajā); ikonu izvēle: nejaušā no hint rindas, **`Parādīt vairāk`**; saraksta pogas – diskrētas krāsas. **`dashboard-fs-view.tsx`**, **`dashboard.js`**, **`styles/subtrack.css`**, SQL **`060`**, **`062`–`064`**.
- **Navigācija LV** – FAQ izvēlne **`BUJ`** (**`063_site_translations_faq_nav_lv.sql`**, **`fallback-phrases.ts`**).

### 0.3.48 (2026-05-20)

- **Maksājumu žurnāls** – **`public.subscription_payments`** (**`061_subscription_payments.sql`**): katrs „Samaksāts” (`amount_paid`, `amount_scheduled`, `paid_on`, `next_payment_date_after`); **`PATCH /api/subscriptions/[id]`** ar `markPaid` + `paidOn`; **`GET /api/subscriptions`** atgriež **`paidCalendarDays`**; panelis SSR bootstrap **`#subtrack-paid-calendar-bootstrap-json`**. Sinhronizācija mobilis/PC; sagatavots dinamiskām summām (`amountPaid` PATCH). Faili: **`lib/subscriptions/subscription-payment.ts`**, **`fetch-paid-calendar-server.ts`**, **`subscriptions-helpers.js`**, **`dashboard.js`**, **`dash-alerts.js`**.

### 0.3.47 (2026-05-20)

- **Tulkojumi** – aizpildīti trūkstošie `fr`/`de`/`es`/`pt`/`ru` `lib/i18n/legal-fallback-phrases.ts` (66 atslēgas) un daļa `fallback-phrases.ts` (admin e-pasts, `fs.dashboard.btn_save` u.c.); SQL **`049_site_translations_legal.sql`** (atjaunināts), **`059_site_translations_i18n_gaps.sql`**. Palīgs: **`scripts/fill_missing_fallback_locales.py`**.

### 0.3.46 (2026-05-20)

- **Modāļi** – klikšķis uz fona neaizver uzreiz: **apstiprinājuma modālis** (virs atvērtā loga, **`z-index: 260`**) ar **`ui.modal.confirm_close_*`**, ne **`window.confirm`**. **`ModalBackdropCloseConfirmHost`** (`app/layout.tsx`), **`modal-backdrop-close-confirm-bus.ts`**, **`public/fs/js/modal-overlay-guard.js`**, panelis un admin tulkojumu modāļi. SQL **`058_site_translations_modal_backdrop_confirm.sql`**.

### 0.3.45 (2026-05-19)

- **Mobilais UI** – viewport bez lietotāja tālummaiņas (`app/layout.tsx`); **`touch-action`** un **`overscroll-behavior`** ≤960px. **Modālis** – par 10px šaurāks (5px katrā pusē); **`input[type="date"]`** ietilpst rāmī (`styles/subtrack.css`).

### 0.3.44 (2026-05-19)

- **Panelis – abonementa modālis (mobilais)** – iPhone: **`100dvh`/`100svh`**, **`safe-area`**, modālis pie apakšas; saturs ritinās **`modal-body`**; bez horizontālā pārbīdīšanās; fons **`subtrack-modal-open`**. Faili: **`styles/subtrack.css`**, **`public/fs/js/dashboard.js`**.

### 0.3.43 (2026-05-18)

- **Sākumlapas SEO** – Open Graph, Twitter Card (`summary_large_image`), `canonical` (`metadataBase` no **`NEXT_PUBLIC_SITE_URL`**), JSON-LD **`WebApplication`**; dinamisks **`/opengraph-image`** (1200×630). Faili: **`app/page.tsx`**, **`app/layout.tsx`**, **`app/opengraph-image.tsx`**, **`lib/seo/landing-seo.ts`**, **`lib/site-url.ts`**, **`components/seo/landing-web-app-json-ld.tsx`**.
- **„Nākamais maksājums” izkārtojums** – desktop: karte stiepjas līdz kalendāra apakšai (**`styles/subtrack.css`**, `flex` labajā kolonnā); mobilajā – bez liekā tukšuma apakšā, vienādas atstarpes kā citām stat kartēm. Sākumlapas hero mock – tā pati kolonnu līdzināšana; mobilais mock **viena kolonna** (ne `display: contents`).
- **Sākumlapa** – noņemts `<script>` no **`body-landing-class.tsx`** (React brīdinājums par skriptu klienta komponentā); `body` klase joprojām caur **`useLayoutEffect`**.
- **Sākumlapas CTA** – **`landing.hero.cta_signup`**: „Sākt lietot” / „Start using” (visas lokāles; **`057_site_translations_landing_hero_cta_signup_lv.sql`**, **`fallback-phrases.ts`**).

### 0.3.42 (2026-05-18)

- **Mobilais UI** – panelis **viena kolonna** (CSS mobilie noteikumi faila beigās; desktop grid tikai **`min-width: 961px`**). Apakšējā navigācija ar **tulkotiem virsrakstiem** zem ikonām (**`mobile-bottom-nav-item.tsx`**). **Valodu slēdzis** tikai **topbar** (blakus zvanam), ne apakšējā pill; dropdown **`z-index`** virs apakšējās nav. **`app-layout`** bez landing kājenes mobilajā. Izvēļņu **`CustomEvent`** – **`queueMicrotask`**, lai nav React hydration / setState brīdinājumu.
- **Juridiskās lapas** – ielogots: **`NavDash`** + atpakaļ uz **`/dashboard`** (**`legal-document-page.tsx`**, **`getSessionUserDisplaySafe`**).
- **Kalendārs** – ja **nav abonementu**, notīra kalendāra kešu (**`subtrackClearPaidCalendarMarks`**) un nerāda „samaksāts” atzīmes bez ierakstiem (**`dashboard.js`**, **`subscriptions-helpers.js`**).
- **SQL** – **`056_site_translations_mobile_nav_home.sql`** (`mobile.nav.home`).

### 0.3.41 (2026-05-18)

- **Admin – e-pasta dizains** – **`/admin/email-design`**: priekšskatījums un tekstu rediģēšana **visās 7 valodās** (en, fr, de, es, pt, lv, ru) – reģistrācija, parole, magic link, kavēts maksājums u.c.; noklusējuma teksti katrā valodā; saglabāšana **`system_settings_email_templates`** (pēc **`078`**); „Kopēt Supabase” Auth šabloniem. **`lib/emails/*`**, **`054_site_translations_admin_email_design_lead.sql`**, **`051`–`053`**, **`055_*`** (apvienots).
- **Kavēto maksājumu e-pasts** – cron **`GET /api/cron/overdue-payment-emails`** ( **`CRON_SECRET`**, Resend **`RESEND_API_KEY`** + **`EMAIL_FROM`** ); deduplikācija **`052_email_reminder_log.sql`**. ENV: **`supabase.env.template`**.

### 0.3.40 (2026-05-18)

- **Sākumlapa – teksti** – **`landing.footer.byline`**: „pārvaldība” (ne prototips); **`landing.hero.subtitle`**: **`{SYSTEM_NAME}`** vietā fiksēta „SubTrack”; **`050_site_translations_landing_footer_hero.sql`**, **`fallback-phrases.ts`**.
- **Juridiskās lapas un sīkdatnes** – publiski **`/terms`**, **`/privacy`**, **`/cookies`**; reģistrācijā saites; **`components/legal/*`**. **Ielogots** – **`NavDash`** (ne landing navigācija), atpakaļ uz **`/dashboard`**; **viesis** – **`NavLanding`**. Kājene ar juridiskajām saitēm **`legal-page` / `auth-page`** mobilajā; **`app-layout`** panelī kājene paslēpta. Cookie banner pirmajā apmeklējumā. **`049_site_translations_legal.sql`**.

### 0.3.39 (2026-05-18)

- **Sākumlapa – padding pēc ielādes** – FAQ/CTA horizontālā atstarpe vairs **neatkarīga** no `body.landing-page` (bija tikai pēc React `useEffect`); **`--app-shell-pad-x`** uz `.faq-inner`, `.landing-cta`, u.c. vienmēr; sinhrons **`landing-page`** skripts `app/page.tsx`; **`cta-box`** `max-width: 100%`.

### 0.3.38 (2026-05-18)

- **iPhone landscape / Safari** – mobilie stili pārcelti uz **`@media (max-width: 960px)`** (ne tikai 768): viena kolonna panelim un hero mock, **`--app-shell-pad-x`**, apakšējā navigācija; hero **`calc(100% + 20px)`** tikai **≥961px**; iOS **`100dvw`**, **`overflow-x: hidden`**, **`touch-action: pan-y`**.

### 0.3.37 (2026-05-18)

- **Mobilais UI – horizontālais ritms** – kopīgs **`--app-shell-pad-x`** (mobilajā **20px**): topbar, **`main-content`**, landing, admin, auth, apakšējā navigācija; sākumlapas hero mock vairs neizplešas platāk par joslu; admin negatīvās malas saskaņotas ar mainīgo.

### 0.3.36 (2026-05-18)

- **Mobilais UI – horizontālā ritināšana** – iOS / šauros ekrānos novērsta visa sistēma ~20px plata: **`overflow-x: clip`** uz **`html`**, **`body`**, **`.app-layout`**; augšējās joslas ēnu ietver **`dash-topbar-shell`**; **`mobile-bottom-nav`** bez **`width:100%` + `left/right`** konflikta; admin **`admin-body`** mobilajā; **`viewport`** **`app/layout.tsx`**.

### 0.3.35 (2026-05-18)

- **Panelis – dzēšana** – dzēšanas modālī un saraksta ikonā: **spinneris**, poga **disabled**, **`aria-busy`**, dubultklikšķis bloķēts; Atcelt un overlay aizvēršana atspējota DELETE laikā. **`dashboard.js`**, **`subscriptions-helpers.js`**, **`dashboard-fs-view.tsx`**, **`subtrack.css`**.

### 0.3.34 (2026-05-18)

- **Auth formas – iesniegšanas stāvoklis** – `/login`, `/signup`, `/forgot-password`: poga **disabled**, **spinneris** un statusa teksts ielādes laikā; lauki atspējoti, kamēr notiek Server Action. **`AuthSubmitButton`**, **`AuthFormPendingFieldset`**, **`requestPasswordResetAction`** (Supabase `resetPasswordForEmail`), SQL **`048_site_translations_auth_submit_status.sql`**.

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

- **Globālais UI valodas slēdzis** – karoga poga augšējā joslā (`NavUiLanguageSwitcher`); viesim – `subtrack_ui_locale` + `localStorage`; ielogotam – arī **`updateSessionDisplayPreferences`** (profils); **`router.refresh()`**; valodu katalogs **`getLanguagesCatalog()`**; tulkošanas **`042`**; **`dash-alerts.js`** aizver paziņojumus atverot valodu. (Apakšējā pill vairs nav – **`0.3.42`**; SSR prioritāte profilam – **`0.3.33`**.)

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

- **Kalendārs „atzīmēts samaksāts”** – pēc apmaksas ieraksts **`public.subscription_payments`** (**`061_*`**); kalendāra skaits **`paidCalendarDays`** no API/SSR (sinhronizācija starp ierīcēm). Vecais **`localStorage`** (`subtrack_cal_paid_marked_v1`) tiek lietots tikai kā pagaidu fallback, ja DB vēl tukšs. Panelis un zvans: **`markPaid`**, **`paidOn`**, **`amountPaid`** PATCH. Skatīt **`subscriptions-helpers.js`**, **`dashboard.js`**, **`dash-alerts.js`**.

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

- **Supabase drošība** – **`015`**, **`078`** (šabloni), **`079`** (reminder log), **`080`** (brand + VIP RPC). **`security_check.md`**, **`supabase.env.template`**.
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

- **Sistēmas iestatījumi** – `database/supabase/012_system_settings.sql`: `public.system_settings` (nosaukums, `default_display_preferences`, **`logo_revision`**), `handle_new_user` kopē kombinētās preferences jaunā `users.display_preferences`; `/admin/system` forma (`AdminSystemPanel`, drag-and-drop logo, `saveSystemSettingsAction`, **`logo-actions.ts`** ar **admin sesiju**); favicon/PWA/manifest/topbar no Storage **`brand`** (ja `logo_revision > 0`); topbar bez logo – teksta nosaukums; aplikācijas **`generateMetadata`** un `/settings` bāzes preferenču avots caur **`getPublicSystemSettings`** (keša tags `system-settings`). SQL **`071`–`074`**.

### 0.2.1 (2026-05-16)

- **Mobilā – paziņojumi** – pilnekrāna fona slānis ar tumšu, caurspīdīgu pārklājumu un **backdrop blur** zem paziņojumu karties (`dash-notify-menu-backdrop`, `dash-alerts.js`, `subtrack.css`); paneļa `z-index` saskaņots ar lietotāja dropdown.
- **Lietotāja izvēlne** – tam pašam mobilajam fona slānim pievienots **blur**, lai vizuāli atbilstu paziņojumu overlay.
- **Augšējā josla** – paziņojumu un lietotāja izvēļņu savstarpēja izslēgšana (`CustomEvent`), lai netiktu duplicēti pilnekrāna overlay.

### 0.2.0 (2026-05-16)

- **Supabase** – servera/pārlūka klienti (`lib/supabase/*`), sesijas **`proxy.ts`**, OAuth/apmaiņas maršruts `app/auth/callback/route.ts`, ENV paraugi (`supabase.env.template`, `.env.example`).
- **Datubāze** – Postgres + RLS skripti `database/supabase/001` … `013` (ieskaitot **`languages.is_default`** un anon kataloga lasīšanu **`010`**, tulkošanu **`011`–`013`**).
- **Auth UX** – `/login`, `/signup`, `/forgot-password`, `/change-password` ar Server Actions un komponentēm (`signup-form`, `change-password-form`), peldošie toast kļūdām un ziņām (`flash-param-toast`, `auth-toasts-host`, hover aptur auto-aizvēršanu; skat. **0.4.2** visiem toast), sociālo pogu komponente.
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
