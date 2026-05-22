# SubTrack (subtrack-web)

**Versija:** `0.5.10` (skatīt **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**; **0.4.x** sākas ar **0.4.0** = agrāk žurnāla **0.3.54**; PWA – **[PWA (SubTrack)](#pwa-subtrack)**). Produkcija: **[Vercel un domēns](#vercel-un-produkcijas-domēns)** (`repazy.com`). Lietotājam redzamais nosaukums – **`system_settings.system_name`** (admin **`/admin/system`**).

**SubTrack** (repozitorijs `subtrack-web`; zīmols **repazy**) ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. **Paneļa dati** (`/dashboard`, `/analytics`) lasās no **Supabase** (`public.subscriptions`, **`public.subscription_payments`** maksājumu žurnālam, RLS); CRUD notiek caur **Route Handlers** (`app/api/subscriptions/*`) un sesijas sīkdatēm; prototipa **FS** JavaScript (`public/fs/js/`) renderē UI un izsauc API (kopā ar **Supabase Auth** un **`database/supabase/`** migrācijām).

## Galvenās iespējas (UI)

- **Sākumlapa** (`/`) - prezentācija, FAQ (navigācijā LV **`BUJ`**, ne angl. „FAQ”), saites uz **publiskajām demonstrācijām** **`/demo/dashboard`** un **`/demo/analytics`**, reģistrāciju un ieeju; **ar aktīvu sesiju** serveris novirza uz **`/dashboard`** (**`app/(marketing)/page.tsx`**, `redirect`). Galvenais saturs **`#main`** (`<main id="main">`); augšējā josla ārpus **`main`** (**`NavLanding`** – klienta komponents; **`LandingPageContent`** – **servera** komponents **`components/landing-page.tsx`**, tulkošanas **`getLandingUiPhrases()`** / **`lib/landing/*`**). **`body.landing-page`** – SSR **`app/layout.tsx`** (`x-pathname` no proxy). Ja **`/admin/system`** ir ieslēgts **maksas plāns**, viesiem rādās **cenu / brīvā līmeņa** bloks ar kafijas ilustrāciju (`#pricing`), **ievads** no kopīgā **`subscribe.hero.lead`** un **`landing.pricing.blurb`** ar **`{count}`** / **`{price}`**; ja ieslēgts **`paid_plan_annual_enabled`** un DB ir **`paid_plan_annual_price_eur`**, arī gada cena un aprēķinātais **`{discount}%`** (**`lib/paid-plan-annual.ts`**, **`landing.pricing.annual_*`**). Dati no **`getPublicSystemSettings().paidPlan`** (SSR). Paneļa augšējās joslas **logo** (tikai ja augšupielādēts no **`/admin/system`**) vai teksta nosaukums (**`DashBrandLink`**, **`components/nav-dash.tsx`**) ved uz **`/dashboard`**, nevis **`/`**. **SEO / dalīšana:** **`<title>`**, **`og:title`**, **`og:image:alt`**, **`twitter:title`** – angļu **`{system_name} – subscription and recurring payment tracker`** (**`buildSiteSharePageTitle`**, **`title.absolute`** uz `/`); **`og:locale`** **`en_US`**; logo URL **`/brand/*`** (ne Supabase hostu). **`/opengraph-image`** (1200×630). **`lib/seo/*`**, **`app/brand/[filename]/route.ts`**, **`app/opengraph-image.tsx`**.
- **Autentifikācija** – **Supabase Auth** (Server Actions), OAuth (Google / Apple) tikai ar **`/admin/integrations`** **`login_google`** / **`login_apple`** (**`lib/integrations/login-social-flags.ts`**, **`components/login-social-buttons.tsx`**, SQL **`024_*`**, **`025_*`**); pilns iestatīšanas ceļvedis – **[Google OAuth (Supabase)](#google-oauth-supabase)**. **Google profila bilde** – augšējā joslā un admin lietotāju sarakstā (inicialēs, ja nav OAuth bildes); **`public.users.avatar_url`**, SQL **`125_*`**, **`components/user-avatar.tsx`**, **`lib/auth/oauth-avatar-url.ts`**. **Iziet** → **`/`** (ne `/login`). **E-pasti no `/admin/email-design`** (Resend API, ne Supabase Auth HTML): ja serverī ir **`RESEND_API_KEY`**, **`EMAIL_FROM`**, **`SUPABASE_SERVICE_ROLE_KEY`** – **`confirm_signup`**, **`reset_password`** (UI valoda) un cron (**`overdue_payment`**, **`payment_due_today`**, **`weekly_summary`**, **`trial_ending`** – **`lib/auth/auth-localized-email.ts`**, **`lib/emails/*`**, **`lib/cron/*`**, SQL **`117`–`124`**); citādi fallback uz Supabase **`resetPasswordForEmail`** (plakans šablons). Cron un prefs: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**. Saite e-pastā: **`https://repazy.com/auth/callback?...`** (**`lib/auth/auth-callback-link.ts`**, `token_hash` + `verifyOtp`), ne tikai `*.supabase.co/auth/v1/verify`. **Redirect URLs** Supabase: `https://repazy.com/auth/callback` (skat. **[Supabase](#supabase-obligāti-ar-custom-domēnu)**). **Reģistrācija** (`/signup`, **`useActionState`**): pēc veiksmīgas reģistrācijas – ekrāns **„Pārbaudiet e-pastu”** (kā aizmirstajai parolei; SQL **`122_*`**); e-pasta aizņemtība **`signup_email_exists`** + **`retired_signup_emails`** (dzēstiem kontiem atkārtota reģistrācija liegta, SQL **`119_*`**, **`120_*`**). **Aizmirstā parole** (`/forgot-password`) – success ekrāns „Pārbaudiet e-pastu”. **Parole:** ielogots – **`/change-password`** ar pašreizējo paroli; no e-pasta saites – **`/change-password?recovery=1`** (tikai jaunā parole, SQL **`121_*`**). **`components/auth/auth-signup-flow.tsx`**, **`signup-form.tsx`**, **`auth-login-flow.tsx`**, flash toast auth lapās. Lokāle: **`getUiPhraseForRequest`** / **`resolveRequestUiLocales`**.
- **Panelis** (`/dashboard`) - maksājumu kalendārs (ja vienā datumā vairāki maksājumi, šūnā **`+N`** apakšējā labajā stūrī; **šodienas** šūnai indikatora krāsa kā **ring** apmalei; **„atzīmēts samaksāts”** dienas no **`public.subscription_payments`** (**`paidCalendarDays`**, **`061_*`**); slēdzis **`subtrack_cal_include_paid_marks`** – ja atslēgas vēl nav, **noklusējums ieslēgts**; marķējums un skaidrojums **`SubtrackTooltip`** (hover / fokuss; burbulis portalā paliek, kamēr kursors virs pogas vai burbuļa; **bez** pārlūka **`title`**), **`aria-label`** pieejamībai; kājenes **leģenda vienā rindā**); **peldošie toast** (`showToast` **`subscriptions-helpers.js`**) – auto-aizvēršanās aptur, kamēr kursors virs ziņojuma), **kopsavilkums** (kopējā / aktīvie maksājumi; **kategoriju josla** virs saraksta – segmentu tooltip uz desktop, leģenda mobilajā; **Nākamais maksājums** sadalīts kolonnās: **kavētie** / **šodien jāmaksā** / nākamais – krāsainas kartes ar kopējo € un rēķinu skaitu zem summas; trīs kolonnās nākamais kompakts: € + nosaukums, bez datuma labajā; saraksta darbību pogas – diskrētas krāsas: rediģēt, dzēst, samaksāts), abonementu CRUD pret **`public.subscriptions`** (**`GET`/`POST` `/api/subscriptions`**, **`PATCH`/`DELETE` `/api/subscriptions/[id]`** ); ja admin ieslēdz **maksas plāna** ierobežojumu, **`POST`** atgriež **403** brīvā līmeņa **ierakstu skaita** sasniegšanā (**`paid_plan_active`** `public.users` – pašpārvaldei nē, skat. **`027`**); lietotāja izvēlnē **`fa-crown`**, tikai ja **`navUserHasPaidProMembership`** (apmaksāts vai VIP, **ne** izmēģinājums). Sākuma dati SSR bootstraps (**`#subtrack-subs-bootstrap-json`**, **`#subtrack-family-sharing-bootstrap-json`**); **`GET /api/subscriptions`** ietver arī **ģimenes dalīšanas** kopīgos ierakstus, ja integrācija ieslēgta; **FS JS** (`public/fs/js/dashboard.js` …) dabū frāzes un **`Intl`** lokāli pirms **`loadScriptOnce`**, jo **`app/dashboard/page.tsx`** renderē **`FsI18nBootstrap`** (skatīt **UI tulkošana**); kalendārā **lv** nedēļas dienu galvenes **Pr … Sv**; **pievienošanas / labošanas modālis** (`#modal-main`) – elpīgākas vertikālās atstarpes galvenajai formai un **Papildu opcijām** (**`styles/subtrack.css`**); augšējā joslā **paziņojumi** (**`dash-alerts.js`**) – tikai **paši** abonementi (**bez** partnera kopīgotajiem: kavētie / šodien / gaidāmie un zvana skaitītājs); **šodienas** un **kavētie** ar **atzīmēšanu kā samaksātu** – API laikā **ielādes riņķis** un **neaktīva** poga; kopīga **`subtrackSetMarkPaidPending`** **`subscriptions-helpers.js`**); **gaidāmie** sākas no **nākamās dienas**; mobilajā skatā – pilnekrāna fons ar **backdrop blur**; abas izvēlnes nevar būt atvērtas vienlaikus). **Modālis – IKONA:** izvēlei **`fa-solid`** klases no **`FA_ICONS_ALL`** (`lib/fs-icons.ts`; ~**102** **`fa-solid`** klases – **nav** pilnās Font Awesome Free kopas, Free satur **daudz vairāk** ikonu nekā šīs ~102). Hintu josla un režģis „Parādīt visas“ **tā pati secība**; augšējā rinda – tikai tik pogas, cik **`dashboard.js`** aprēķina pēc **`#icon-picker-hints-shell`** (bez apgriešanas). Meklēšana ar sinonīmiem – **`lib/fs-icon-picker-search.ts`**, JSON **`#subtrack-icon-search-bootstrap`** (**`components/fs/dashboard-fs-view.tsx`**). Ja **maksas plāns** ieslēgts un lietotājam nav **`paid_plan_active`**, zem **„Pievienot”** ir saite **„Iegūt Pro”** uz **`/subscribe`**; šajā gadījumā **kalendāra kolonna** paneļī netiek rādīta (**`dashboard-overview-main--no-calendar`**). **Pievienošanas modālis – ikona:** nejaušā izvēle no **pirmās redzamās** hint rindas; **`Parādīt vairāk`** (LV; SQL **`062_*`**) atver pilnu katalogu.
- **Pro izmēģinājums** – admin **`/admin/system`**: **`pro_trial_enabled`**, **`pro_trial_days`**; jaunajiem **`107_*`** (`handle_new_user`); esošajiem sesijā **`maybeGrantProTrialForSession`** / **`maybeRepairProTrialStartedAt`** (**`lib/auth/grant-pro-trial-session.ts`**, RPC ar **`service_role`** pēc **`116_*`**). Sākums = **`users.created_at`** (**`110_*`**, **`112_*`** backfill, **`113_*`** repair). Piekļuve kā Pro: **`navUserHasProEntitlement`**; kronītis tikai **`navUserHasPaidProMembership`**. **`/dashboard`** / **`/analytics`**: progress josla (**`percentElapsed`**); desktop **`trial.period_dates`**; **≤960px** datumi paslēpti. SQL **`107`–`116`**.
- **Pro iepazīšanās** (`/subscribe`) – **`SubscribeProView`**: **`subscribe.hero.*`**, **`subscribe.free_tier.note`** ar **`{price}`** / **`{n}`**; mēneša cena + (ja konfigurēts) **gada** rinda ar **`subscribe.price.annual_*`** un dinamisku **`{discount}%`**. **`subscribe.coffee.line`** noņemts (**`032_*`**). Tulkošanas **`029`**, **`028`** / **`031`**, **`030`**, **`032`**, **`033`**, **`101`–`106`**.
- **Demonstrācijas** (`/demo/dashboard`, `/demo/analytics`) – **publiski** (nav **`proxy`** aizsargātas kā `/dashboard`); **`/demo/dashboard`** – **`DashboardFsView`** + **`public/fs/js/dashboard.js`** (kalendārs, modāļi; **API netiek izsaukti**, `window.__SUBTRACK_DEMO_DASHBOARD__`); virs satura **info josla** (`.subtrack-demo-banner`) un topbar **`Demo`** birka (`.subtrack-demo-topbar-badge`). **`/demo/analytics`** – **`DemoAnalyticsPage`** (kopsavilkumi, donut; **nav** tendences/prognozes); tā pati info josla; virsrakstā ar ieslēgtu maksas plānu – **`Pro`** pill (`dash-nav-pro-pill`), citādi **Demo** birka. **Paziņojumu zvans** rāda paraugus arī viesiem. Stili **`/demo/*`** – modulis **`styles/modules/demo-app.css`** app bundle (**`css:split`**, ne tikai `landing.css`). Tulkošanas **`034`**, **`036`**, **`037`**, **`041`**, **`demo.*`**.
- **Analītika** (`/analytics`) - kopsavilkumi, kategoriju joslas un **CSS donut** sadalījums (`demo-analytics-*`, kā demo; bez Chart.js CDN); **`FsI18nBootstrap`** + **`public/fs/js/analytics.js`** (**`app/analytics/page.tsx`**). Ja **`paid_plan_enabled`**, maršruts tikai ar Pro (**`canAccessAnalytics`** → **`navUserHasProEntitlement`**: apmaksa, VIP vai aktīvs izmēģinājums; citādi **`redirect('/dashboard')`**). Brīvā līmenī **nav** analītikas saites augšējā joslā un mobilajā navigācijā (**`nav-dash.tsx`**, **`nav-landing.tsx`**, **`mobile-bottom-nav.tsx`** – **`showAnalytics`**). Publiskā **`/demo/analytics`** paliek viesiem; sākumlapas **„Explore”** kartē – **`landing.explore.analytics.pro_hint`** un **`/demo/analytics`**.
- **PWA (Progressive Web App)** – instalējama **SubTrack** lietotne: Serwist SW, manifest, **`/offline`**, mobilais instalācijas banneris, **`/settings`** instalācijas bloks, admin **`/admin/pwa`**. Pilns apraksts: **[PWA (SubTrack)](#pwa-subtrack)**.
- **Iestatījumi** (`/settings`) - preferences: **`public.users.display_preferences`** (JSON), DB sinhronizācija + dublējums `localStorage` (kad ir migrācija `006_*`). Forma **`components/fs/settings-fs-view-client.tsx`** ar **`useSubtrackIntl`**; saglabāšanas toast (**`pushDomToast`**) ar hover apturētu auto-aizvēršanu; **`app/settings/page.tsx`** kārto **`languages`** atlasi ar **`Intl.Collator`** pēc **`resolveRequestUiLocales`** (nevis fiksētu `lv-LV`). **Saskarnes valoda** – pēc izvēles tiek uzreiz **`applyUiLocaleInBrowser`** + **`writeDisplayPreferencesToLocalStorage`** + **`updateSessionDisplayPreferences`** (`lib/auth/display-preferences-client.ts`) + **`router.refresh()`**, lai **`app/layout.tsx`** (**`SubtrackIntlProvider`**, tulkošanas `dbMap`) atbilstu jaunajai lokālei. **Ielogots:** SSR lokāle no profila (`interface_language_code`), nevis sīkdatnes; **`mergeDisplayPreferencesFromSources`** ar **`prioritizeDbInterfaceLanguage`** – profila valoda pār **`localStorage`**. **Viesis:** sīkdatne **`subtrack_ui_locale`**. **Nav josla** (`NavUiLanguageSwitcher`) ielogotam lietotājam saglabā to pašu profila JSON. Bāzes noklusējumi no **`public.system_settings`** (`012`), ja nav lietotāja ieraksta; `/admin/system` ietekmē jaunos kontus un formas bāzi. Ja ieslēgts **`pwa_install_settings_enabled`**, rāda **`PwaSettingsInstall`**; **`PwaPushSettings`** (Web Push: kavētie + šodien) – skatīt **[PWA](#pwa-subtrack)**.
- **E-pasta paziņojumi** (`/email-notifications`) – profila izvēlnē **E-pasta paziņojumi**; slēdži **`users.email_notification_preferences`** (šodienas maksājums, nedēļas kopsavilkums, izmēģinājuma beigas – pēdējais tikai aktīvam Pro trial). Autosaglabāšana caur **`PATCH /api/user/email-notification-preferences`**. UI: **`components/email-notifications/email-notifications-view.tsx`**, stili **`styles/subtrack.css`** (`.email-notif-*`). **Kavētie maksājumi** joprojām sūta atsevišķi (cron, bez šīs izvēlnes). Nedēļas e-pastā saite atslēgt: **`/email-notifications?disable=weekly`**. Pilns apraksts: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**.
- **Ģimenes dalīšana** (`/family-sharing`) – tikai ja admin **`/admin/integrations`** ieslēdz **`family_sharing`** (**`093_*`** SELECT obligāts). Uzaicinājums pa e-pastu, accept/decline/revoke/leave, krāsa, **„saskaitīt kopā”** (**`095`**). Lasīšana: **RLS** (`family-sharing-server.ts`); **`PATCH`** stāvokļiem – sesija, tad **`service_role`** fallback. API: **`/api/family-sharing`**. **`/dashboard`**: kopīgotie ieraksti lasāmi. DB **`084`–`095`**. Tulkošanas **`085_*`**.
- **Administrācija** (`/admin`, `/admin/users`, `/admin/languages`, `/admin/translations`, `/admin/integrations`, `/admin/system`, **`/admin/email-design`**, **`/admin/cron-jobs`**, **`/admin/pwa`**, **`/admin/todos`**) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne (sānizvēlnē **`admin.nav.todos`**). **Ikonu tooltipi** admin tabulās – **`SubtrackTooltip`** (`components/subtrack-tooltip.tsx`): melns burbulis, teksts portalā uz **`document.body`** (`position: fixed`), lai **`admin-table-wrap`** `overflow` to neapgriež; burbulis paliek atvērts, kamēr kursors virs pogas vai burbuļa; uz **touch / coarse pointer** nerāda (**`useSupportsHoverTooltip`**). **Peldošie toast** – **`lib/push-dom-toast.ts`** + **`lib/dom-toast-hover-dismiss.ts`** (tā pati hover loģika kā auth **`HoverPauseToast`**). **Lietotāji** – servera lapa **`app/admin/users/page.tsx`** atlasa datus; **`components/admin/admin-users-view.tsx`** (klienta): **`IERAKSTI`** kolonna rāda **kopējo abonementu skaitu** uz lietotāju (bez sadalījuma pa kategorijām); ja **`paid_plan_enabled`**, arī **VIP** slēdzis (`users.pro_vip`, **`POST /api/admin/users/pro-vip`** – admin sesijas pārbaude, RPC **`admin_set_user_pro_vip`** ar **`service_role`**, **`080_*`**); saite **Dzēst** (**`POST /api/admin/users/delete`**, ne sevi / ne administratorus; pēc **`auth.users`** DELETE noņem e-pastu no **`retired_signup_emails`** – atkārtota reģistrācija, **`121_*`**); **Pro** vizuāli – **kronītis** pie avatāra; **Administrators** birka zem e-pasta; **`Intl`** datumi. Admin kopsavilkumi (RLS + **`008`**). **Vadteksti** (īsi intro, bez tabulu `<code>` un liekiem hintiem) – **`components/admin/admin-intros.tsx`**, **`045_*`**. **Sistēma** – panelis **`AdminSystemPanel`** (tulkošanu atslēgas formas virsrakstiem un kļūdām; dažu **`<select>` opciju** iekšējā teksta vēl var atšķirties). **Sistēma** (`/admin/system`) dati: **`012_system_settings.sql`**, maksas plāns (**`027`**, gada **`101`–`103`**), Server Actions **`lib/admin/system-actions.ts`**, **`lib/paid-plan-annual.ts`**; **`AdminSystemPanel`** (maksas + gada slēdzis/cena vienā `form-row`, autosave). Logo: **`lib/admin/logo-actions.ts`**, **`lib/system-settings-public.ts`**. Drag-and-drop logo (**`admin-system-logo-upload.tsx`**) → Storage **`brand`**; publiski **`/brand/*`**; topbar, favicon, manifest un **`/offline`** rāda ikonu tikai ja **`logo_revision > 0`** (**`SiteBrandLogo`**, **`DashBrandLink`**). **Valodas** – CRUD pret **`public.languages`**, noklusējuma valoda jaunajiem apmeklētājiem (**`010`**; Server Actions **`lib/admin/languages-actions.ts`**, **`components/admin/admin-languages-panel.tsx`**; pamatā **`007`**); saraksta **`Intl.Collator`** – pēc pašreizējās UI lokāļa. **Integrācijas** – **`public.integrations`** (tehniska atslēga, nosaukums, `enabled`), Server Actions **`lib/admin/integrations-actions.ts`**, **`app/admin/integrations/page.tsx`**, **`components/admin/admin-integrations-panel.tsx`**; migrācija **`024_integrations.sql`**; **SELECT** visa pasaule (lasāms arī no API/feature flagām), rakstīt tikai admins; pēc mutācijas – **`revalidatePath`** arī **`/login`**, **`/signup`**, **`/dashboard`**, **`/family-sharing`**. Karodziņi: **`login_google`**, **`login_apple`** (skatīt **Autentifikācija**); **`family_sharing`** (skatīt **Ģimenes dalīšana**). **Tulkojumi** - **`public.site_translations`**: **`components/admin/admin-translations-panel.tsx`** + **`AdminTranslationsIntro`** (`titleActions`: poga vienā rindā ar virsrakstu); **modāļi** jaunai atslēgai un labošanai; tabulā **atslēga + teksts tikai aktīvajai UI lokālei**; **meklētājs** pilnā platuma rindā; **bez meklēšanas** papildu rindas ar **IntersectionObserver** (lazy DOM), **ar meklēšanu** filtrs pār **visu** servera ielasīto katalogu (`loadAdminTranslationsData`). Migrācija **`011`**; publiskā **SELECT** – **`012_site_translations_select_public.sql`**; sēkla – **`013_site_translations_seed_subtrack_ui.sql`**, skatīt **[UI tulkošana](#ui-tulkošana)** (**`python scripts/export_site_translations_sql.py`** pēc **`fallback-phrases.ts`** izmaiņām). **Uzdevumi** (`/admin/todos`) – **`public.admin_todos`** (`sort_order` kolonnā), Server Actions **`lib/admin/admin-todos-actions.ts`**, **`lib/admin/admin-todos-types.ts`**, **`components/admin/admin-todos-board.tsx`**: divas kolonnas (**Uzdevums**, **Procesā**); **manuāla kārtība** – velc karti **augšup/leju** (zaļa strīpa rāda ievietošanas vietu), starp kolonnām arī drag; saglabā **`sort_order`** (`reorderAdminTodosColumnAction`, `moveAdminTodoAction`). **Nav** prioritātes kārtošanas vai UI (bez birkas un formas lauka). Virsraksts + **Pievienot** vienā rindā (**`AdminTodosIntro`**). Kartītē ikonpogas (**✓** pabeigt, labot, dzēst) ar **`SubtrackTooltip`**; pabeigšana/dzēšana – apstiprinājuma **modāļi** (ne `window.confirm`); optimistisks UI. Pabeigts pazūd no dēļa; DB **`done`** dzēsts pēc **8 h**. SQL **`096`–`100`** (backfill **`100_admin_todos_sort_order_backfill.sql`**, ja vecie ieraksti ar `sort_order = 0`), tulkošanas **`admin.todos.*`**. Atšķiras **prototipa paneļu** vai citu **`components/fs/*`** vietu līmenis par fiksētām virknēm – papildināšana vienmēr ar **`t('…')`**. Admin pazīme: RLS un RPC **`current_user_is_admin`** (pēc **`023`** – **`SECURITY INVOKER`**). Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~960 px platums)

Šaurām ekrānplatēm (**≤960 px**, ieskaitot **iPhone landscape**, kur platums bieži **>768 px**) horizontālā atstarpe ir vienota caur **`--app-shell-pad-x`** (**20px**, **24px** desktop) – topbar, panelis, landing, admin, auth. Horizontālā augšējā navigācija (**`dash-nav-links`**) **nav redzama** (tikai logo + valoda / paziņojumi / profils / iziet); primārā navigācija ir **`components/mobile-bottom-nav.tsx`** + **`mobile-bottom-nav-item.tsx`** – peldoša **apakšējā navigācija** („glass” pill) ar **īsiem virsrakstiem** zem ikonām aktīvajā valodā (**`nav.dashboard`**, **`nav.analytics`**, u.c.). Slēpšana: **`@media (max-width: 960px)`** **`styles/subtrack.css`** beigās (iekļauts **`subtrack-app.bundle.css`** pēc **`npm run css:split`**); sākumlapai papildus **`landing.css`**. **Saskarnes valoda** – **`NavUiLanguageSwitcher`** tikai **augšējā joslā** (blakus paziņojumiem), ne apakšējā pill. **`position: fixed`** portāls uz **`document.body`** (`useLayoutEffect`, lai nav hydration kļūdu). **Panelis** mobilajā – viena kolonna (virsraksts → statistika → nākamais maksājums → kalendārs); **`.app-layout`** bez landing kājenes; **`main-content`** / **`admin-main`** – apakšējā atstarpe apakšējai joslai.

**ADMIN sadaļā** (`@media (max-width: 768px)`, `styles/subtrack.css`): izkārtojums kolonnā (`admin-body`); **`align-items: stretch`**, lai **submenu josla un galvenais saturs** aizpildītu to pašu platumu kā augšējā josla (`dash-topbar-shell`), nevis sarautos pa kreisi. Apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

**`/admin/users` tabula**: ļoti šaurā skatā (**≤640 px**) kolonnas „VIP“ un „Reģistrēts“ tiek rādītas zem e‑pasta, iniciāļu aplis paslēpts (**Pro** kronītis tad zem e‑pasta); **virs 640 px** redzamas **pilnas kolonnas** un **iniciāļu aplis** ar kronīti, ja kontam ir **Pro** (apmaksāts vai VIP).

**Paziņojumi (`@media (max-width: 768px)`)** – **`public/fs/js/dash-alerts.js`** paneli pozicionē ar `position: fixed` pret viewport un platuma **clamp**, lai karte neaizslīd malā. **`components/nav-session-actions.tsx`** satur pogu **`#dash-notify-backdrop`**; kad panelis ir vaļā, tiek lietots tas pats slāņošanas modelis kā lietotāja izvēlnei (`z-index` fons **188**, karte **200**, `styles/subtrack.css`). Fona slānim ir **`backdrop-filter: blur(12px)`** (un **`prefers-reduced-motion`** – bez blur). **`components/nav-user-menu.tsx`** un **`dash-alerts.js`** savstarpēji aizver otras izvēlnes, izmantojot `CustomEvent` (`subtrack:notify-opened` / `subtrack:user-menu-opened`), lai nepārlietotu divus pilnekrāna overlay. **Visās platēm:** zvana poga strādā arī pēc React klienta navigācijas un ātrās skriptu ielādes – klikšķa delegēšana uz **`document` (capture)** un pēc ielādes **`components/authed-notify-bootstrap.tsx`** izsauc globālo **`window.fsBootDashAlerts()`**, lai sakristu ar DOM.

**PWA instalācijas banneris** – virs apakšējās navigācijas (`z-index` **185**); tikai **≤960 px** un ceļos **`/dashboard`**, **`/analytics`**, **`/settings`** (skatīt **[PWA](#pwa-subtrack)**).

**Augšējā josla – viesa sākumlapa (≤960 px)** – **`landing.css`**: **`dash-nav-link-text`** paslēpts (**Ieiet** / **Reģistrēties** tikai ikonas); valodu pogā un **izvēlnē** kods **`EN`**, **`LV`** u.c. (**`languageCodeToUiAbbrev`**, **`nav-ui-language-switcher.tsx`**; ne 🇬🇧→„GB” Windows). **Panelis (≤520 px)** – tā pati ikonu loģika **`subtrack-app.bundle.css`**. **`aria-label`** no tulkošanas (**`nav-landing.tsx`**, **`nav-dash.tsx`**).

**Cookie banner** – pilnekrāna scrim (blur + tumšums), karte apakšā; mobilā pogas grid (**`cookie-consent-root.tsx`**, **`styles/subtrack.css`**).

## Pieejamība un Lighthouse

| Tēma | Implementācija |
|------|----------------|
| **Viewport / tālummaiņa** | **`generateViewport()`** (`app/layout.tsx`) – **`width: device-width`**, **`initialScale: 1`**; **nav** `userScalable: false` / `maximumScale: 1` (Lighthouse pieejamība). |
| **Galvenais saturs** | **`<main id="main">`** – sākumlapa (`app/(marketing)/page.tsx`), auth (`login`/`signup`), juridiskās (`legal-document-page.tsx`), forgot-password; panelis jau **`main.main-content`** (`dashboard-fs-view.tsx`). |
| **Kontrasts** | Tumšāks **`--text-muted`** (`#475569`); akcentiem landing **`--primary-dark`**; CTA apakšvirksts bez `opacity` (`styles/subtrack.css`). |
| **Ikonas** | Font Awesome 6 no CDN – **nebloķējoša** ielāde: **`FontAwesomeDeferredHead`** (hinti) + **`next/script`** `afterInteractive` (`lib/icons/font-awesome-deferred-inject.ts`, **`app/layout.tsx`**); `noscript` fallback; ikonas īsi pēc pirmā paint (**0.4.26**). **0.4.39** – bez `<script>` React komponentā (konsoles brīdinājums). |
| **Veiktspēja** | Custom domēns vs **`*.vercel.app`** parasti **nemaina** lab Lighthouse skaitļus; svarīgāk deploy, JS/CSS apjoms un mobilais **LCP**. **`/`** → **`styles/landing.css`** (~110 KB); pārējās lapas → **`styles/subtrack-app.bundle.css`** (~160 KB); avots **`styles/subtrack.css`** (~193 KB). **`css:split`**: **`styles/modules/*`** + bundle bez **`@import`**. App bundle ietver arī **`demo-app.css`** (`/demo/*` banneris un badges). Griezumi **`scripts/split-landing-css.mjs`** – pēc **`subtrack.css`** komentāriem (shell: **`[2889, 4065]`**, **`[7531, 7634]`**, **`[7821, 7831]`**, **`[7833, 8337]`**). **0.4.24** RSC; **0.4.26** FA nebloķējošs. Pārbaude: [PageSpeed Insights](https://pagespeed.web.dev/) uz production URL. |
| **Meklētāji (GSC)** | **`app/robots.ts`**, **`app/sitemap.ts`**, **`lib/seo/search-crawl.ts`**. Sitemap ietver **`/demo/dashboard`**, **`/demo/analytics`** (publiskās demonstrācijas). Domēna verifikācija – **[Google Search Console](#google-search-console-pēc-verifikācijas)** (TXT **Porkbun**; Supabase **nav** jāmaina GSC dēļ). |
| **OG / dalīšana** | Sākumlapa un share kartes: angļu **`{system_name} – subscription and recurring payment tracker`**, **`og:locale`** **`en_US`**; logo **`/brand/*`**. Pārbaude: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) pēc deploy („Scrape Again”). |

## PWA (SubTrack)

Produkta **Progressive Web App** slānis (pamats **0.3.51**–**0.3.53**; **0.4.x** līnija no **0.4.0**, agrāk žurnāls **0.3.54**).

### Tehniskā bāze

| Elements | Kur |
|----------|-----|
| Manifest | **`app/manifest.ts`** → **`/manifest.webmanifest`** |
| Service worker | **`app/sw.ts`**, build **`serwist.config.js`** → **`public/sw.js`** |
| SW reģistrācija | **`components/pwa/pwa-sw-register.tsx`** (saknes layout) |
| Middleware | **`proxy.ts`** – **`sw.js`** un manifest **nav** sesijas redirect ceļā |
| Offline | **`app/offline/page.tsx`**, **`components/pwa/offline-page-view.tsx`** |
| Ikonas / favicon | Storage **`brand`** (augšupielāde); publiski **`/brand/{filename}?v=`** (**`app/brand/[filename]/route.ts`**, **`lib/brand/logo-assets.ts`**); citādi **`app/icon.tsx`**, **`app/apple-icon.tsx`** |
| Publiskā konfigurācija | **`getPublicSystemSettings().pwa`** (**`lib/system-settings-public.ts`**, **`lib/pwa/public-pwa-settings.ts`**) |

**Build / dev:** **`npm run build`** (`next build && serwist build`); **`npm run dev`** (Serwist watch + Next); **`npm run dev:next-only`** – bez SW (ātrāka UI izstrāde, instalācija/PWA pilnībā pēc **`build`**).

### Datubāze un admin

- **`068_system_settings_pwa.sql`** – **`pwa_enabled`**, **`pwa_install_banner_enabled`**, **`pwa_install_settings_enabled`**, **`pwa_cache_revision`**, **`pwa_theme_color`**, **`pwa_background_color`**, **`pwa_short_name`**.
- Tulkošanas **`067_*`** (lietotāja teksti), **`069_*`** (admin forma), **`074_*`** (logo ↔ manifest hinti); **`070_*`** produkta nosaukums **SubTrack**.
- **`/admin/pwa`** – **`components/admin/admin-pwa-panel.tsx`**, Server Actions **`lib/admin/pwa-actions.ts`**: ieslēgt PWA, banneri, iestatījumu sadaļu, manifest krāsas, **keša revīzija** (pēc maiņas lietotājiem atjauninās SW kešu).
- Logo manifestam/faviconam nāk no **`/admin/system`** (ne atsevišķa PWA logo augšupielāde).

### Instalācijas UX (lietotājs)

| Vieta | Komponents | Kad rāda |
|-------|------------|----------|
| Mobilais banneris | **`PwaInstallHost`** → **`PwaInstallBanner`** | **`pwa_install_banner_enabled`**, platums zem **961px**, ceļi **`/dashboard`**, **`/analytics`**, **`/settings`**, nav **standalone** |
| Iestatījumi | **`PwaSettingsInstall`** | **`pwa_install_settings_enabled`**, nav standalone |
| Iestatījumi | **`PwaPushSettings`** | PWA ieslēgts; lietotājs ieslēdz push (**`/settings`**) |
| Chrome / Edge | Poga **Instalēt** | **`PwaDeferredInstallProvider`** – viens **`beforeinstallprompt`** klausītājs; **`preventDefault()`** tikai, ja rādās banneris (mob., ceļi, nav dismiss) vai **`/settings`** instalācijas bloks; pēc pogas **`prompt()`** |
| iOS Safari | Teksta norāde | **`pwa.banner.ios_hint`** (bez native prompt) |

### Push paziņojumi tālrunī (0.4.8)

- **Kad sūta:** cron **`GET /api/cron/payment-push-notifications`** (tāds pats **`CRON_SECRET`** kā e-pastiem) – **viens kopsavilkums dienā** uz lietotāju, ja ir **kavētie** vai **šodien jāmaksā** (bez gaidāmo 7 dienu – kā zvana panelī bez upcoming).
- **Loģika:** **`lib/push/payment-due-alerts.ts`** + **`lib/subscriptions/due-active.ts`** (termiņš, `term_end`); „šodiena” pēc lietotāja **`display_preferences.timezone`**.
- **Ieslēgšana:** **`/settings`** → **Paziņojumi tālrunī** → atļauja pārlūkā → **`POST /api/push/subscribe`** (`push_subscriptions`).
- **ENV:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (**`supabase.env.template`**; `npx web-push generate-vapid-keys`).
- **SQL:** **`081_push_subscriptions.sql`**, **`082_site_translations_push.sql`**.

### E-pasta paziņojumi (cron)

**Priekšnosacījums:** **`RESEND_API_KEY`**, **`EMAIL_FROM`**, **`SUPABASE_SERVICE_ROLE_KEY`**, **`CRON_SECRET`**. Šabloni un teksti: **`/admin/email-design`** (7 valodas), **`system_settings_email_templates`**. Deduplikācija: **`email_reminder_log`** (paplašināts ar **`123_*`**: `due_today`, `weekly_summary`, `trial_end_3d` / `1d` / `0d`).

| Maršruts | Kad sūta | Lietotāja prefs | Laika josla |
|----------|----------|-----------------|-------------|
| **`GET /api/cron/overdue-payment-emails`** | Katru dienu (cron) | Nav (vienmēr, ja Resend) | **UTC** „šodiena” |
| **`GET /api/cron/due-today-payment-emails`** | Ieteicams **ik stundu** | `due_today` | Lietotāja **`display_preferences.timezone`** |
| **`GET /api/cron/weekly-summary-emails`** | Ieteicams **ik stundu** | `weekly` | **Pirmdiena 09:00** lietotāja TZ |
| **`GET /api/cron/trial-ending-emails`** | Ieteicams **ik stundu** | `trial_end` (tikai aktīvs trial) | **09:00** TZ; atlikušās dienas **3 / 1 / 0** |
| **`GET /api/cron/payment-push-notifications`** | Reizi dienā | Push abonements | Lietotāja TZ (skat. [PWA](#pwa-subtrack)) |

**Vercel Cron (piemērs):** visiem – `Authorization: Bearer $CRON_SECRET` ( **`lib/security/cron-auth.ts`** ; bez `?secret=` URL). Bieži **`0 * * * *`** (katru stundu) due-today / weekly / trial; overdue var **`0 8 * * *`** UTC vai arī stundā ar filtru.

**Testa piespiedu palaišana (admin):** **`/admin/cron-jobs`** – **`components/admin/admin-cron-jobs-panel.tsx`**, poga **Piespiedu palaišana** katram darbam; serveris izsauc **`POST /api/admin/cron/run`** (`job`, `forceSchedule`) → iekšējs **`GET /api/cron/*`** ar **`Bearer CRON_SECRET`**. Nedēļas un trial admin režīmā pievieno **`?force=1`** (apiet pirmdienas 09:00 / 09:00 logu; **`lib/cron/cron-force-query.ts`**). **Uzmanību:** var nosūtīt **īstus** e-pastus/push; deduplikācija (`email_reminder_log`) joprojām darbojas. Alternatīva bez UI: `curl` ar **`Authorization: Bearer $CRON_SECRET`** (nedēļas/trial testam arī **`?force=1`**).

**Lietotājs:** **`/email-notifications`** – **`components/email-notifications/email-notifications-view.tsx`**, **`lib/emails/email-notification-preferences.ts`**. Noklusējums visi slēdži **ieslēgti** (`123_*`).

**SQL:** **`123_email_notification_preferences.sql`**, **`124_site_translations_email_cron_notifications.sql`**, **`127_site_translations_admin_cron_jobs.sql`** (admin cron UI).

### Sākuma ekrāna ikonas badge (0.4.10)

- **Zvana skaitītājs lietotnē** (`#dash-notify-badge`) un **ikonas skaitlis uz iOS/Android sākuma ekrāna** ir atsevišķi: pēdējais sinhronizējas ar **Badging API** (`navigator.setAppBadge` / `clearAppBadge`) no **`lib/pwa/app-badge.ts`** un **`dash-alerts.js`** (kavētie + šodien + gaidāmie 7 d.; **bez** ģimenes kopīgotajiem ierakstiem – **`subtrackSubscriptionsForNotifyList`**).
- **Kad atjauninās:** panelī ielādējot abonementus, pārslēdzoties atpakaļ uz lietotni (`visibilitychange`), un **Web Push** cron (`badgeCount` → **`app/sw.ts`**).
- **iOS:** strādā tikai **instalētai** PWA (atvērt no sākuma ekrāna ikonas, ne Safari cilne); **iOS 16.4+**. Bez push un bez atvēršanas lietotnes ikona var palikt bez skaitļa.

**Bannera uzvedība (0.4.7; instalācijas prompt 0.4.44):**

- **X** („Ne tagad”, `pwa.banner.dismiss`) – **`localStorage`** atslēga **`subtrack_pwa_install_dismissed_v1`** ar **timestamp**; banneris atkal pēc **3 dienām** (**`PWA_INSTALL_DISMISS_COOLDOWN_MS`** – **`lib/pwa/defaults.ts`**; lasīšana **`lib/pwa/install-banner-dismiss.ts`**). Vecais ieraksts **`"1"`** tiek ignorēts (rāda banneri atkal).
- Pēc veiksmīgas instalācijas vai atteikuma dialogā – tā pati noraidīšanas atzīme (kamēr nav standalone, banneris vairs nerāda).
- **Hidrācija:** host renderē banneri tikai pēc **`mounted`** (**`pwa-install-host.tsx`**), lai serveris un klients nesadalītos.
- **Chrome konsole:** „Banner not shown… `preventDefault()`… must call `prompt()`” – samazināts: **`shouldCaptureBeforeInstallPrompt`** (**`lib/pwa/install-prompt-capture.ts`**) neuztur deferred prompt uz citām lapām / desktop; **`prompt()`** tikai no pogas; viens provider, ne divi klausītāji.
- **UI:** logo no **`brandLogo`**, fons no **`pwa.background_color`** (admin; ja logo balts kvadrāts – iestati **`#ffffff`** **`/admin/pwa`**), bez atsevišķas logo ēnas; izteiktāka kartes **apmale un ēna**; stili **`styles/subtrack.css`** (`.pwa-install-*`).

### Faili (īsumā)

```
app/layout.tsx              # PwaDeferredInstallProvider, PwaInstallHost, PwaSwRegister, SubtrackIntlProvider
app/manifest.ts, app/sw.ts, app/offline/page.tsx
components/pwa/pwa-deferred-install-provider.tsx
components/pwa/pwa-sw-register.tsx
components/pwa/pwa-install-host.tsx
components/pwa/pwa-install-banner.tsx
components/pwa/pwa-settings-install.tsx
components/pwa/pwa-push-settings.tsx
components/pwa/offline-page-view.tsx, offline-wifi-icon.tsx
lib/pwa/install-prompt.ts, install-prompt-capture.ts, install-banner-dismiss.ts
lib/pwa/defaults.ts, public-pwa-settings.ts, brand-mark.tsx, app-badge.ts
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
4. **`/settings`** → ieslēgt paziņojumus; cron testam: **`/admin/cron-jobs`** vai **`GET /api/cron/payment-push-notifications`** ar **`Authorization: Bearer $CRON_SECRET`**.
5. Mobilā: banneris, instalācija, push uz lock screen (Android/instalēta PWA; iOS atbalsts atkarīgs no Safari/PWA).

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | Avots: **`styles/subtrack.css`**; runtime: **`/`** → **`landing.css`** (`core`, `landing-page`, `landing-mock-panel`, `landing-shell`, `shared-footer`); pārējās → **`subtrack-app.bundle.css`** (`core`, `shared-footer`, **`demo-app`**, `subtrack-app`). **`npm run css:split`** pēc **`subtrack.css`** (**`build`** palaiž automātiski). Ja **`/demo/*`** zaudē banneri/badge stilus – pārbaudi, vai **`demo-app.css`** (rindas ~2585–2739) ir app bundle. `app/globals.css` – login sociālais + admin slēdzis (ārpus `subtrack.css`) |
| Ikonas | Font Awesome 6 **Free** – CDN caur **`FontAwesomeDeferredHead`** (`preload`, nebloķējošs `stylesheet`; `fa-solid` visā UI, admin, landing); daļa pogām arī **inline SVG** (piem. **`nav-dash`**, admin todos dzēst). Paneļa abonementa **ikona** – kurēts **`fa-solid`** saraksts **`lib/fs-icons.ts`** (**~102** `FA_ICONS_ALL`), ne visa FA bibliotēka; [licence](https://fontawesome.com/license/free). Meklēšana: **`lib/fs-icon-picker-search.ts`**. **Neatlikt** FA ielādi bez testa – Next.js head to salauž. |
| Demo paneļi | `public/fs/js/*.js` (kalendārs, modāļi, paziņojumi; **`/dashboard`** CRUD pret `/api/subscriptions`; **`/demo/dashboard`** – tas pats UI, bez API; analītika – **`/fs/js/analytics.js`** kategoriju donut kā demo) |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `proxy.ts`, `database/supabase/*.sql` |
| PWA / logo | [Serwist](https://serwist.pages.dev) (`serwist.config.js`, `app/sw.ts` → `public/sw.js`); instalācijas UX – **`components/pwa/*`** (**`PwaDeferredInstallProvider`**); logo – **`sharp`** + Storage **`brand`**, URL **`/brand/*`**. Skatīt **[PWA (SubTrack)](#pwa-subtrack)** |

## Maršrutu aizsardzība (`proxy.ts` → `lib/supabase/middleware.ts`)

- **Sesijas nav**: **`/dashboard`**, **`/analytics`**, **`/settings`**, **`/subscribe`**, **`/change-password`**, **`/admin`** (kopā `/admin/*`) - novirze uz **`/`**. **`/demo/dashboard`** un **`/demo/analytics`** ir **publiski** (demonstrācija ar parauga datiem).
- **Sesija ir**: **`/login`**, **`/signup`**, **`/forgot-password`** - novirze uz **`/dashboard`** (proxy **`GUEST_ONLY_PATHS`** iekš `lib/supabase/middleware.ts`).
- **Sesija ir + saknes `/`**: papildus **`app/(marketing)/page.tsx`** izsauc **`redirect('/dashboard')`** (sākumlapas saturs tikai viesiem).

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
| **Sākumlapa `/` (0.4.24)** | **`LandingPageContent`** – servera komponents; **`getLandingUiPhrases()`** (`lib/landing/get-landing-ui-phrases.ts`, atslēgas **`landing-phrase-keys.ts`**) – viens bulk tulkošanu pieprasījums; mazāks klienta bundle nekā visa lapa kā **`use client`**. |

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
   #   – admin lietotāja dzēšana (/api/admin/users/delete)
   #   – lokalizēti Auth e-pasti (Resend): confirm_signup, reset_password (117–118)
   # Produkcijā (Vercel) arī:
   # RESEND_API_KEY=
   # EMAIL_FROM=SubTrack <noreply@repazy.com>
   # Logo (/admin/system, 071–072): admin sesija + SUPABASE_SERVICE_ROLE_KEY + 072_brand_storage.sql
   ```

4. **Authentication** – URL Configuration un **Google / Apple OAuth**: skatīt **[Google OAuth (Supabase)](#google-oauth-supabase)** (Supabase provideri, Google Cloud redirect, **`/auth/callback`**, admin **`login_google`** / **`login_apple`**; tabula **`024_integrations.sql`**).

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
   - **`database/supabase/070_system_settings_product_name_repazy.sql`** (vēsture) un **`099_product_name_subtrack.sql`** – **`system_name`** → **SubTrack**. Pēc **`012`**.
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
   - **`database/supabase/089_family_sharing_pending_partner_id.sql`** – pending uzaicinājumos **`partner_user_id`**, accept politika un backfill. Pēc **`084`**.
   - **`database/supabase/090_family_sharing_partner_decline.sql`** – partneris var noraidīt pending (**`revoked`**). Pēc **`089`**.
   - **`database/supabase/091_family_sharing_partner_tint_color.sql`** – **`partner_tint_color`**: partnera krāsa owner izdevumiem (atsevišķi no owner **`partner_display_color`**). Pēc **`088`**.
   - **`database/supabase/092_family_sharing_rls_hardening.sql`** – stingrāka owner RLS (pending/active/revoke), trigger pret `status`/`partner_user_id`/krāsu pārrakstīšanu; **`family_sharing.err_invite_failed`** (POST enumerācija). Pēc **`091`**.
   - **`database/supabase/093_family_sharing_select_active_invitee.sql`** – SELECT RLS: uzaicinātais redz arī **`active`** saites pēc `invite_email` (ne tikai `pending`). Pēc **`092`**.
   - **`database/supabase/094_family_sharing_guard_update_fix.sql`** – guard trigger labojums (status `lower`, partner active pēc e-pasta). Pēc **`092`**; krāsas **`PATCH`** izmanto **`service_role`** (kā accept/revoke).
   - **`database/supabase/095_family_sharing_combine_per_viewer.sql`** – **`owner_combine_in_totals`** un **`partner_combine_in_totals`** (neatkarīgi); noņem **`combine_in_totals`**; guard trigger atjaunināts. Pēc **`094`**.
   - **`database/supabase/096_admin_todos.sql`** – tabula **`admin_todos`** (statuss `todo` / `in_progress` / `done`, prioritāte, **`/admin/todos`**, RLS tikai admin). Pēc **`003`** / **`023`**.
   - **`database/supabase/097_site_translations_admin_todos.sql`** – tulkošanas **`admin.todos.*`**, **`admin.nav.todos`**. Pēc **`012`**.
   - **`database/supabase/098_remove_admin_todos_lead.sql`** – dzēš neizmantotās **`admin.todos.lead`** / **`admin.todos.done_ttl_hint`**. Pēc **`097`**.
   - **`database/supabase/099_site_translations_admin_todos_complete.sql`** – **`admin.todos.complete`**, **`complete_confirm`**, **`toast.completed`**. Pēc **`097`**.
   - **`database/supabase/100_admin_todos_sort_order_backfill.sql`** – pārrēķina **`sort_order`** pa statusu (ja visi bija **0**). Pēc **`096`**.
   - **`database/supabase/101_paid_plan_annual.sql`** – **`system_settings.paid_plan_annual_enabled`**. Pēc **`027`**.
   - **`database/supabase/102_site_translations_paid_plan_annual.sql`** – slēdzis, **`landing.pricing.annual_equiv`**, **`subscribe.price.annual_equiv`** (`INSERT` kolonna **`translation_key`**, ne `key`). Pēc **`101`**, **`028`**.
   - **`database/supabase/103_paid_plan_annual_price.sql`** – **`paid_plan_annual_price_eur`** (admin ievada; % atlaide aprēķina kods). Pēc **`101`**.
   - **`database/supabase/104_site_translations_paid_plan_annual_price.sql`** – gada cenas lauks, **`{discount}%`**, admin hinti (`translation_key`). Pēc **`103`**.
   - **`database/supabase/105_site_translations_admin_annual_equiv_monthly.sql`** – admin hint **`admin.forms.paid_plan_annual_hint_equiv_monthly`** (`{equiv}/mēn.`). Pēc **`104`**.
   - **`database/supabase/106_site_translations_landing_pricing_ui.sql`** – sākumlapas **`#pricing`**: **`landing.pricing.monthly_suffix`**, **`annual_label`**, **`annual_badge_off`**, atjaunināts **`annual_equiv`**. Pēc **`105`**.
   - **`database/supabase/107_pro_trial.sql`** – Pro izmēģinājums: **`system_settings.pro_trial_*`**, **`users.pro_trial_used`**, **`pro_trial_started_at`**, RLS, **`handle_new_user`**. Pēc **`027`**, **`043`**, **`106`**.
   - **`database/supabase/108_site_translations_pro_trial.sql`** – tulkošanas **`admin.forms.pro_trial_*`**, **`trial.*`**, **`nav.trial_demo_badge`**. Pēc **`107`**.
   - **`database/supabase/109_pro_trial_grant_rpc.sql`** – RPC **`grant_pro_trial_if_eligible`** (esošiem kontiem vienu reizi, ja vēl nav `pro_trial_used`). Pēc **`107`**.
   - **`database/supabase/110_pro_trial_started_at_registration.sql`** – izmēģinājuma sākums = **`users.created_at`** (reģistrācija), ne pirmā RPC brīža. Pēc **`109`**.
   - **`database/supabase/111_site_translations_pro_trial_end_date.sql`** – **`trial.end_date`** (`{date}`) progress joslas labajā malā. Pēc **`108`**.
   - **`database/supabase/112_pro_trial_started_at_backfill.sql`** – vienreizējs labojums kontiem, kam **`109`** iestatīja **`pro_trial_started_at`** pie pirmās pieslēgšanās. Pēc **`110`**.
   - **`database/supabase/113_pro_trial_repair_started_at_rpc.sql`** – RPC **`repair_pro_trial_started_at`** (sesijā automātiski). Pēc **`112`**.
   - **`database/supabase/114_site_translations_pro_trial_period_dates.sql`** – **`trial.period_dates`** (`{start}`, `{end}`). Pēc **`111`**.
   - **`database/supabase/115_site_translations_signup_email_check_unavailable.sql`** – **`auth.signup.email_check_unavailable`**. Pēc **`114`**.
   - **`database/supabase/116_security_advisor_pro_trial_rpc.sql`** – Pro trial RPC: **`EXECUTE` tikai `service_role`**, `p_user_id` (Security Advisor). Pēc **`113`**.
   - **`database/supabase/117_site_translations_signup_email_via_resend.sql`** – admin e-pasta dizaina hinti (reģistrācija caur Resend). Pēc **`116`**.
   - **`database/supabase/118_site_translations_reset_password_via_resend.sql`** – hinti (+ aizmirstā parole). Pēc **`117`**.
   - **`database/supabase/119_retired_signup_emails.sql`** – pēc `auth.users` dzēšanas e-pasts **`retired_signup_emails`** (atkārtota reģistrācija liegta); atjaunina **`signup_email_exists`**. Trigeris – kā **`016_*`**, postgres. Backfill: `select public.retire_signup_email('epasts@…');`. Pēc **`118`**.
   - **`database/supabase/120_retired_signup_emails_security_advisor.sql`** – RLS deny politikas + REVOKE uz trigger funkciju (Advisor). Pēc **`119`**.
   - **`database/supabase/121_site_translations_reset_password_recovery_ui.sql`** – **`/change-password?recovery=1`** (bez pašreizējās paroles). Pēc **`120`**.
   - **`database/supabase/121_site_translations_admin_users_delete.sql`** – admin lietotāju dzēšanas UI/API tulkojumi (tāds pats numurs – abus palaist). Pēc **`120`** vai recovery **`121`**.
   - **`database/supabase/122_site_translations_signup_confirm_email.sql`** – reģistrācijas ekrāns „Pārbaudiet e-pastu”. Pēc abiem **`121_*`**.
   - **`database/supabase/123_email_notification_preferences.sql`** – `users.email_notification_preferences`; paplašināts **`email_reminder_log`** (`due_today`, `weekly_summary`, `trial_end_*`). Pēc **`122_*`**.
   - **`database/supabase/124_site_translations_email_cron_notifications.sql`** – UI un nedēļas e-pasta teksti. Pēc **`123_*`**.
   - **`database/supabase/125_users_oauth_avatar_url.sql`** – **`users.avatar_url`** no OAuth (`avatar_url` / `picture` metadata); atjaunināts **`handle_new_user`**, Auth trigeris, backfill. Pēc **`107_*`**, **`124_*`** (ja OAuth jau lieto).
   - **`database/supabase/126_site_translations_auth_oauth_same_account.sql`** – OAuth viens konts: login norāde, **`/settings`** Google saistīšana. Pēc **`025_*`**.
   - **`database/supabase/127_site_translations_admin_cron_jobs.sql`** – admin **`/admin/cron-jobs`** (piespiedu cron palaišana). Pēc **`124_*`**.
   - **`database/supabase/128_security_advisor_oauth_avatar_trigger.sql`** – **`sync_public_user_avatar_from_auth`**: **revoke EXECUTE** no `anon`/`authenticated` (Advisor pēc **`125_*`**). Pēc **`125_*`**. **Leaked password** – tikai Dashboard (skat. **`080_*`**, **`022`**).
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
- **Serveris** - saknes **`app/layout.tsx`** paraleli ielādē **`getPublicSiteTranslationsMerged(locale, defaultLocale)`** (`lib/site-translations-public.ts`, anon Supabase klients + **`unstable_cache`**, tags **`site-translations-public`**) un **`getPublicSystemSettings()`** (`lib/system-settings-public.ts`: **`systemName`**, **`brandLogo`**, **`pwa`**, display prefs, **`paidPlan`** ar **`paid_plan_*`** / **`paid_plan_annual_*`**; keša tags **`system-settings`**), tad ietin saturu **`SubtrackIntlProvider`** (`locale`, **`systemSiteName`**, **`brandLogo`**, **`paidPlan`**, **`pwa`**, **`dbMap`**).
- **Lappušu `<title>` (App Router)** - daudzos maršrutos **`generateMetadata`** izsauc **`getUiPhraseForRequest('meta.title.*')`** (`lib/ui/server-ui-phrases.ts`; tās pašas lokāļa izvēles kā layout), piem.: **`/admin/*`**, **`/login`**, **`/signup`**, **`/dashboard`**, **`/analytics`**, **`/settings`**, **aizmirstā parole / mainīt paroli**. **Sākumlapa `/`:** angļu **`buildSiteSharePageTitle`** + **`title.absolute`** (**`lib/seo/landing-seo.ts`**).
- **Klients** - **`useSubtrackIntl().t('atslēga')`**: vispirms vērtība no DB mapes, citādi **fallback** no **`lib/i18n/fallback-phrases.ts`** (`pickFallbackPhrase`); rezultātā vietturu aizvietošana (**`{SYSTEM_NAME}`** / **`{SISTEM_NAME}`**) ar **`system_settings.system_name`** (`applySystemNamePlaceholders`). Datuma/mēneša formatēšanai atsevišķi izmanto **`Intl`** ar **`uiLocaleCodeToBcp47ForIntl`** (`lib/ui/ui-locale-from-request.ts`).
- **FS demo scripts** – **`app/dashboard/page.tsx`** / **`app/analytics/page.tsx`** (Server Component): **`getUiPhrasesForRequest(fs*PhraseKeys)`** (`lib/ui/server-ui-phrases.ts`, atslēgu saraksti **`lib/fs/fs-page-i18n-keys.ts`**) + **`FsI18nBootstrap`** (`components/fs/fs-i18n-bootstrap.tsx`) bez **`use client`**, lai inline **`<script>`** izpildītos dokumenta parsē laikā (`window.__SUBTRACK_FS_I18N`, **`window.__SUBTRACK_FS_META.intlLocale`**). Tikai tad **`DashboardFsView` / Analytics** **`loadScriptOnce('/fs/js/…')`**. Paneļa JS lasa frāzes (piem. globālais **`FsT`**) **`public/fs/js/subscriptions-helpers.js`**, **`dashboard.js`**, **`analytics.js`**).
- **Sēkla / SQL** - pēc izmaiņām **`FALLBACK_PHRASES`** palaid **`python scripts/export_site_translations_sql.py`** – tiek pārrakstīts **`database/supabase/013_site_translations_seed_subtrack_ui.sql`**. Importē Supabase SQL Editor (kā pārējās migrācijas). **Atsevišķas tulkošanu migrācijas** (piem. **`025_*`** **`auth.social.*`**, **`026_*`** kalendāra slēdzim, **`029_*`** **`/subscribe`**, **`030_*`**, **`031_*`**, **`032_*`**, **`033_*`**) arī pēc **`012`**; kodā turēt līdz **`fallback-phrases.ts`** līdzvērtības.
- **Admin** - saglabājot tulkojumus, **`lib/admin/translations-actions.ts`** izsauc **`revalidateTag('site-translations-public', 'default')`**, lai atsvaidzinātu publisko kešu.

## Struktūra (īsumā)

```
app/                      # App Router + `generateMetadata` ar tulkošanas atslēgām kur attiecas
app/layout.tsx            # viewport, FontAwesomeDeferredHead, SubtrackIntlProvider, PwaDeferredInstallProvider, PWA host
app/brand/[filename]/     # logo proxy (publisks URL uz domēnu)
app/(marketing)/          # `/` – landing.css (CSS apakškopa)
app/(app)/                # panelis, auth, admin, API lapas – subtrack-app.bundle.css
app/globals.css           # `@import` `subtrack.css`; papildu CSS (login sociālais tweak, admin integrāciju slēdzis – sk. Tehniskais steks)
app/api/subscriptions/    # autentificēts CRUD (cookie sesija, Supabase server klients)
app/api/family-sharing/   # ģimenes dalīšana: GET/POST; PATCH (accept, decline, revoke, leave, krāsa, combine)
app/family-sharing/       # lapa (integrācijas karodziņš `family_sharing`)
components/               # nav-landing, nav-dash, landing-page.tsx (SSR saturs), landing-nav-sync, mobile-bottom-nav(+item), …
components/family-sharing/  # family-sharing-view.tsx
components/legal/         # juridiskās lapas, SiteLandingFooter, cookie-consent-root, cookie-settings-modal
components/subtrack-tooltip.tsx  # admin (u.c.) hover tooltipi: portal + fine-pointer; hover uz burbuļa; stili `subtrack.css`
components/flash-param-toast.tsx  # auth flash + HoverPauseToast (hover aptur auto-aizvēršanu)
lib/push-dom-toast.ts         # admin / settings toast (#toast-container)
lib/dom-toast-hover-dismiss.ts  # kopīga hover → auto-aizvēršana (arī FS showToast)
components/auth/          # auth-login-flow.tsx, auth-signup-flow.tsx (kartīšu saturs lokālei)
components/admin/         # admin-shell, admin-users-view, admin-cron-jobs-panel, admin-intros, admin-todos-board, …
components/fs/            # Paneļa / analītikas skati; `fs-i18n-bootstrap.tsx` – servera inlīnas `window.__SUBTRACK_*` pirms /fs/js
components/email-notifications/  # `email-notifications-view.tsx` – e-pasta prefs UI
components/pro-trial/     # `pro-trial-chrome.tsx` – progress josla, Pro badge (izmēģinājums)
lib/admin/                # Server Actions + `run-cron-job.ts` (admin cron test)
lib/brand/                # Storage + publisks `/brand/*` URL (`logo-assets.ts`, `process-logo.ts`); noklusējuma zīmols – `lib/pwa/brand-mark.tsx`
lib/pwa/                  # `install-prompt-capture.ts`, `install-banner-dismiss.ts`, `install-prompt.ts`, `defaults.ts`, `public-pwa-settings.ts`
components/brand/         # `site-brand-logo.tsx`, `dash-brand-link.tsx`
components/pwa/           # `pwa-deferred-install-provider`, `pwa-install-host`, `pwa-install-banner`, `pwa-settings-install`, `offline-page-view`
lib/system-name-placeholder.ts # {SYSTEM_NAME} aizvietošana `t()` ceļā
lib/paid-plan-annual.ts        # gada cena, atlaide % pret 12× mēneša, publiskais pitch (`buildPaidPlanAnnualPitchCopy`)
lib/system-settings-public.ts  # anon kešots: nosaukums, `brandLogo`, `pwa`, `paidPlan`, display prefs (`system-settings`)
lib/i18n/pwa-fallback-phrases.ts  # PWA + admin PWA fallback (papildus `fallback-phrases.ts`)
lib/site-translations-public.ts  # anon kešots `site_translations` merge sabiedriskajam UI
lib/ui/server-ui-phrases.ts     # `getUiPhraseForRequest`, `getUiPhrasesForRequest` (bulk), `resolveRequestUiLocales`
lib/landing/                  # `landing-phrase-keys.ts`, `get-landing-ui-phrases.ts` – sākumlapas `t()` bulk SSR
lib/seo/                      # `landing-seo.ts`, `site-share-metadata.ts` (`buildSiteSharePageTitle`, OG/Twitter EN), `search-crawl.ts`
app/opengraph-image.tsx       # dinamisks OG attēls (lokāle no pieprasījuma)
lib/ui/ui-locale-from-request.ts  # `resolveUiLocaleCodeForRequest` (profils vs sīkdatne)
lib/auth/display-preferences-server.ts  # `getSessionDisplayPreferencesRow`, `getSessionInterfaceLanguageCode`
lib/auth/display-preferences-client.ts  # `updateSessionDisplayPreferences` (settings + nav valodas slēdzis)
lib/use-supports-hover-tooltip.ts  # `(hover: hover) and (pointer: fine)` – SubtrackTooltip ieslēgšana
lib/fs/fs-page-i18n-keys.ts      # tulkošanas atslēgu saraksti FS demo (`/dashboard`, `/analytics`)
lib/fs-icons.ts            # paneļa atļautās FA Solid klases (`FA_ICONS_ALL`)
lib/fs-icon-picker-search.ts  # ikonu meklēšanas baiti / bootstrap (`haystack`, sinonīmi) pirms `dashboard.js`
lib/i18n/                 # FALLBACK_PHRASES (`fallback-phrases.ts`) un apkārtējā palīgfunkcionalitāte
lib/auth/                 # actions, sesija, `auth-localized-email`, `auth-callback-link`, `signup-email-blocked`, pro-trial, is-admin
lib/subscriptions/        # `analytics-access.ts`, `dashboard-free-tier-gate.ts`, `subscription-payment.ts`, `fetch-paid-calendar-server.ts`, `fetch-subscriptions-server.ts`, `subscription-map.ts`
lib/security/             # `auth-rate-limit.ts`, `rate-limit-allow.ts` (opc. Upstash), `cron-auth.ts`, `server-action-rate-limit.ts`
lib/supabase/middleware.ts  # sesija, lapu aizsardzība, `/api/*` → 401 bez sesijas
security_check.md         # drošības audits, vērtējums ~9/10, Advisor checklist
lib/emails/               # admin šabloni, Resend (signup/reset/overdue/cron/weekly/trial)
lib/cron/                 # `email-cron-common.ts`, `user-local-schedule.ts`, `cron-job-registry.ts`, `cron-force-query.ts`
lib/emails/email-notification-preferences.ts
app/email-notifications/  # aizsargāta lapa (proxy)
app/api/user/email-notification-preferences/  # PATCH prefs
app/admin/cron-jobs/      # admin: piespiedu cron testi
app/api/admin/cron/run/   # POST – tikai admin (`current_user_is_admin`)
app/api/cron/             # overdue, due-today, weekly-summary, trial-ending, payment-push (CRON_SECRET)
lib/integrations/       # `integration-enabled.ts`, OAuth: `login-social-flags.ts`
lib/family-sharing/     # `family-sharing-server.ts`, tipi, dashboard bootstrap ar kopīgotajiem ierakstiem
lib/user-display-preferences.ts  # display_preferences forma + **`mergeDisplayPreferencesFromSources`** (DB + LS; opcija **`prioritizeDbInterfaceLanguage`**)
lib/languages-catalog.ts  # kešots valodu katalogs + noklusējuma `code` (anon lasījums)
lib/supabase/             # anon/server klienti, `service-role-client.ts` (service_role tikai serverim), sesijas loģika (+ **rate limit** – skatīt `proxy.ts`)
proxy.ts                  # **rate limit** auth ceļiem, tad `updateSession` + redirecti; sk. **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**
database/supabase/        # Postgres + RLS (`001` … **`127`**); OAuth avatārs **`125`**, OAuth viens konts **`126`**, admin cron UI **`127`**, e-pasta prefs/cron **`123`–`124`**, Auth e-pasti **`117`–`122`**, retired signup **`119`–`120`**, PWA **`067`–`070`**, logo **`071`–`075`**, drošība **`078`–`080`**, push **`081`–`082`**, family **`084`–`095`**, todos **`096`–`100`**, Pro trial **`107`–`116`**
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

**PWA:** izstrādē **`npm run dev`** ģenerē/uzrauga **`public/sw.js`**; pilnai instalācijas plūsmai pirms deploy – **`npm run build`**. Detalizēti – **[PWA (SubTrack)](#pwa-subtrack)**.

**Ja izstrādē konsolē vai pārlūkā parādās:** `Router action dispatched before initialization` (**`use-action-queue`**, **`hmrRefresh`**) vai **`ChunkLoadError` / `Failed to load chunk`** (`/_next/static/chunks/...`) – tipiska **Next.js 16 Turbopack** HMR / fragmentu sacīkste (parasti tikai **`next dev`** bez **`--webpack`**). **Risinājums:** apturēt serveri, izdzēst mapi **`.next`**, palaist **`npm run dev`** no jauna un **cietā pārlādēšana**; ja atkārtojas – **`npm run dev:webpack`** (stabilāks izstrādes serveris).

**Uzmanību:** nekādā **`next.config`** nelietojiet `deploymentId: process.env.X ?? ""`, ja rezultāts var būt **`""`** – tukša virkne Turbopack režīmā var salauzt hidratāciju un līdzīgas kļūdas (skat. [next.js #92858](https://github.com/vercel/next.js/issues/92858)).

**Drošība:** **`security_check.md`** (vērtējums **~9,0** repozitorijā, **~9,1** ar pilnu DB + smoke). **`npm run security:check`** = regresija + audit + smoke. API: middleware **401** + handler `getUser()`; cron **Bearer**; rate limit auth + `/api/*` (opc. Upstash).

```bash
npm run build
npm run start
npm run lint
npm run security:check    # pēc DB / drošības izmaiņām
```

## Vercel un produkcijas domēns

| Kas | Vērtība |
|-----|---------|
| Vercel projekts | `subtrack-web-beige` |
| Noklusējuma URL | [https://subtrack-web-beige.vercel.app/](https://subtrack-web-beige.vercel.app/) |
| Custom domēns | [https://repazy.com](https://repazy.com) (reģistrators **Porkbun**) |

### Vercel (projekta iestatījumi)

1. **Settings → Domains** – pievienots `repazy.com` (statuss **Valid Configuration**, **Production**). Ieteicams arī `www.repazy.com` un redirect uz galveno hostu.
2. **Settings → Environment Variables** (Production):
   - `NEXT_PUBLIC_SITE_URL` = `https://repazy.com` (bez slīpsvītras beigās) – **robots.txt**, **sitemap**, e-pasta/OAuth saites.
   - Pārējās atslēgas kā lokāli: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, cron, VAPID u.c. (skatīt **`supabase.env.template`**).
3. Pēc ENV maiņas – **Redeploy** production.

### Supabase (obligāti ar custom domēnu)

**Nav saistīts ar Google Search Console** – GSC neprasa Supabase izmaiņu. Šeit tikai **Auth / OAuth / e-pasta saites**, kad lietotāji iet caur `repazy.com`.

**Authentication → URL Configuration:**

- **Site URL:** `https://repazy.com`
- **Redirect URLs:** `https://repazy.com/auth/callback` (un `http://localhost:3000/auth/callback` izstrādei)
- Ja lieto arī **`www`**: pievieno `https://www.repazy.com/auth/callback` vai Vercel redirect no `www` uz apex (skatīt Vercel Domains)

### Google OAuth (Supabase)

**Kods jau ir** – jaunus auth failus parasti nav jāraksta. Plūsma: **`/login`** vai **`/signup`** → **`LoginSocialButtons`** → `signInWithOAuth` → Google → Supabase → **`/auth/callback`** (`app/(app)/auth/callback/route.ts`, `exchangeCodeForSession`) → **`/dashboard`** (vai `next` parametrs). Jaunajam OAuth lietotājam **`public.users`** rinda rodas caur **`handle_new_user`** (kā e-pasta reģistrācijai).

#### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID** (tips **Web application**).
2. **Authorized redirect URIs** – **tikai** Supabase callback no Dashboard (**Authentication → Providers → Google**), formāts:
   - `https://<projekta-ref>.supabase.co/auth/v1/callback`
   - **Ne** `https://repazy.com/auth/callback` (tas ir app atgriešanās, ne Google → Supabase solis).
3. **Authorized JavaScript origins** (ieteicams):
   - `http://localhost:3000`
   - `https://repazy.com` (un `https://www.repazy.com`, ja lieto)
4. **Client ID** un **Client Secret** ieliec Supabase → **Authentication → Providers → Google** (ieslēdz provideri).

#### 2. Supabase Dashboard

| Vieta | Ko iestatīt |
|-------|-------------|
| **Providers → Google** | Ieslēgts; Client ID / Secret no Google Cloud |
| **URL Configuration → Site URL** | Lokāli `http://localhost:3000`; produkcijā `https://repazy.com` |
| **URL Configuration → Redirect URLs** | `http://localhost:3000/auth/callback`, `https://repazy.com/auth/callback` (+ `www`, ja vajag) |

#### 3. Datubāze un admin slēdzis (obligāti pogai)

1. Palaid **`database/supabase/024_integrations.sql`**, ja tabula **`public.integrations`** vēl nav.
2. Ielogojies kā admin → **`/admin/integrations`**:
   - izveido vai ieslēdz ierakstu ar atslēgu **`login_google`** (tieši šādi: mazie burti, ar `_`);
   - **`enabled`** = ieslēgts.
3. Bez **`login_google`** + **`enabled`** poga **`/login`** un **`/signup`** **nerādās**, pat ja Supabase Google ir ieslēgts.

Pēc izmaiņas integrācijā panelis dara **`revalidatePath`** arī uz **`/login`** un **`/signup`**.

#### 4. Lokāla pārbaude

```bash
npm run dev
```

Atver `http://localhost:3000/login` → **Turpināt ar Google** → pēc Google konta izvēles → `/dashboard` (vai `next` no URL).

**.env.local`:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (skatīt **`supabase.env.template`**). Pēc ENV maiņas – pārstartē dev serveri.

#### 5. Produkcija

- Vercel: `NEXT_PUBLIC_SITE_URL=https://repazy.com` + Supabase atslēgas; **Redeploy** pēc ENV.
- Supabase Redirect URLs ar `https://repazy.com/auth/callback`.
- Google Cloud **JavaScript origins** + Supabase **callback** kā augšā.

#### 6. Viens konts: e-pasts + parole un Google

Mērķis: lietotājs reģistrējās ar **`user@gmail.com`** un paroli, vēlāk ieslēdz **`login_google`** - viņš var ieiet **vai nu ar e-pastu/paroli, vai ar Google pogu**, un abi ved uz **vienu** kontu (tie paši abonementi, iestatījumi).

**Supabase (automātiska saistīšana):** ja Google kontā ir **tas pats e-pasts** (parasti apstiprināts Google pusē), `signInWithOAuth('google')` piesaista Google identitāti esošajam `auth.users` ierakstam. Nav jāraksta atsevišķa „reģistrācija ar Google”. Skat. [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking).

| Nosacījums | Kāpēc |
|------------|--------|
| **Tas pats e-pasts** reģistrācijā un Google kontā | Citādi rodas divi konti |
| **E-pasta apstiprināšana** (ja ieslēgta confirm signup) | Drošība; līdz tam drošāk lietot paroli vai vispirms apstiprināt e-pastu |
| Google kontā izvēlēties **to pašu Gmail** | Google account picker nedrīkst būt cits e-pasts |

**Aplikācijā:**

- **`/login`** / **`/signup`** - Google poga + īss teksts (`auth.social.same_account_hint`, SQL **`126_*`**).
- **`/settings`** - **Savienot ar Google** (`linkIdentity`), ja lietotājs jau ielogots ar paroli un vēlas piesaistīt Google bez gaidīšanas uz nākamo login. Nepieciešams Supabase **Authentication → Settings (vai Providers)** → ieslēgt **Manual linking** (beta).

**Ja jau ir divi konti** (viens ar paroli, otrs tikai ar Google) - Supabase Dashboard tos neapvieno automātiski; jāizvēlas viens un otru jānoņem / jāsaskaņo manuāli (admin).

#### Biežākās kļūdas

| Simptoms | Ko pārbaudīt |
|----------|----------------|
| Nav Google pogas | **`/admin/integrations`** → **`login_google`**, **`enabled`** |
| `redirect_uri_mismatch` | Google **Authorized redirect URIs** = `https://<ref>.supabase.co/auth/v1/callback` |
| Atgriež uz `/login` ar kļūdu | Supabase **Redirect URLs** ietver `…/auth/callback` šai videi |
| „Supabase nav konfigurēts” | `.env.local` + **`npm run dev`** pārstart |

**Apple Sign In:** tas pats modelis ar atslēgu **`login_apple`** un Supabase **Apple** provideri (papildu Apple Developer iestatījumi).

### DNS Porkbun (DNS paliek pie Porkbun)

Ja Vercel Domains rāda cilni **DNS Records** (ne **Vercel DNS**), ieraksti liek **Porkbun → DNS**, ne tikai NS:

| Tips | Host | Answer |
|------|------|--------|
| **A** | *(tukšs = `@`)* | `216.198.79.1` (Vercel Domains ekrānā norādītais IP; ja Vercel rāda citu – izmanto to) |
| **CNAME** | `www` | `cname.vercel-dns.com` |

**Pirms pievienošanas** izdzēs visus ierakstus uz **`pixie.porkbun.com`** (Porkbun parking). Citādi pārlūkā: **`404 (002) pixie proxy`** – tas nav Next.js kļūda, bet trāpījums uz parking, ne uz Vercel.

Propagācija: parasti **15–60 min**, retāk līdz **48 h**. Kamēr `*.vercel.app` strādā, bet `repazy.com` vēl rāda pixie – gaidi DNS vai pārbaudi `nslookup repazy.com`.

**Google Search Console (domēna verifikācija):** TXT ierakstu liek **Porkbun → DNS** (Host `@` vai tukšs; Value `google-site-verification=…`), **ne** Vercel, kamēr DNS paliek pie Porkbun (skatīt tabulu augšā). Pēc verifikācijas TXT var atstāt. **Nav** jāmaina kods `app/` vai Supabase GSC dēļ.

### Google Search Console (pēc verifikācijas)

1. **Indexing → Sitemaps** – pievienot `sitemap.xml` (pilns URL: `https://repazy.com/sitemap.xml`). Ģenerē **`app/sitemap.ts`**; indeksējamas publiskās lapas – **`lib/seo/search-crawl.ts`** (`/`, `/demo/dashboard`, `/demo/analytics`, `/privacy`, `/terms`, `/cookies`); panelis, auth, admin u.c. – **`app/robots.ts`** `Disallow` ( **`/dashboard`** un **`/analytics`** nebloķē **`/demo/*`** ).
2. **Pārbaude pārlūkā:** `https://repazy.com/robots.txt` rāda `Sitemap: https://repazy.com/sitemap.xml`; `NEXT_PUBLIC_SITE_URL` produkcijā = `https://repazy.com` (bez `/` beigās).
3. **URL Inspection (ne obligāti):** augšējā GSC meklētājā ievadi **pilnu URL** (piem. `https://repazy.com/`) → Enter → pagaidi pārskatu → tad var parādīties **Request indexing**. Ja pogas nav – pietiek ar sitemap; **Performance** dati parādās tikai pēc rādījumiem meklēšanā (bieži **nedēļas** jaunam domēnam).
4. **Gaidāšana:** sitemap statuss – stundas līdz 1–2 dienām; indeksēšana – dienas līdz nedēļām; tukšs Performance pēc verifikācijas ir normāli.

### Pārbaude pēc deploy

- `https://repazy.com` un `https://subtrack-web-beige.vercel.app/` – vienāds saturs.
- Vercel → Domains → **Valid Configuration**.
- Login uz `https://repazy.com/login` – apstiprina Supabase **Site URL** / redirect (skatīt **[Supabase](#supabase-obligāti-ar-custom-domēnu)**).
- Google OAuth: **`login_google`** ieslēgts **`/admin/integrations`**; poga **Turpināt ar Google** ved uz paneli (skatīt **[Google OAuth](#google-oauth-supabase)**).
- Lighthouse / SEO – testēt uz **īstā** production URL ([Pieejamība un Lighthouse](#pieejamība-un-lighthouse)).

## Pēc Git atjauninājuma (`git pull`)

Šī sadaļa ir domāta izstrādātājiem un tiek izmantota arī kā **kopīga zināšanu bāze asistentiem** (Cursor u.tml.), lai pēc jaunākā commit ievilkšanas būtu skaidrs, ko darīt un kā īsi komunicēt.

### Obligātie / ieteicamie soļi

1. **`npm install`** – vienmēr pēc pull, ja mainījies `package.json` vai `package-lock.json`; ja šaubies, atkārto arī tad, kad lock fails nav mainījies (ātri un novērš „missing dependency’’ lokāli).
2. **Žurnāls** – salīdzināt ar **[Izmaiņu žurnālu](#izmaiņu-žurnāls)** un rindiņu **`Versija:`** README augšā: tur tiek apkopotas būtiskākās izmaiņas (Auth, proxy/sesija, SQL, ENV, paneļa FS slānis).
3. **Supabase un ENV** – salīdzināt **`database/supabase/`** (līdz **`128_*`**: Advisor OAuth trigeris **`128`**, admin cron **`127`**, OAuth **`125`–`126`**, e-pasta cron/prefs **`123`–`124`**, Auth e-pasti **`117`–`122`**, retired signup **`119`–`120`**, ģimenes **`084`–`095`** + **`093`**, Pro trial **`107`–`116`**, drošība **`078`–`080`**, **`022`**, **`023`**, u.c.) un **`supabase.env.template`** ar **`.env.local`**. **Pro trial:** **`107`–`116`** ( **`116`** – RPC tikai `service_role`). **Drošība:** **`078`**, **`079`**, **`080`**, **`022`**, **`023`**, **`128`** (pēc **`125`**), **`015`**, **`016`**. **`SUPABASE_SERVICE_ROLE_KEY`** obligāts: signup/confirm e-pasti, Pro trial RPC, VIP, cron, admin user delete, daļa family **`PATCH`**. **Resend (produkcijā):** `RESEND_API_KEY`, `EMAIL_FROM` uz Vercel. **Cron:** `CRON_SECRET` – Vercel plānotājs **`Authorization: Bearer …`** uz **`/api/cron/*`**; testam arī **`/admin/cron-jobs`** (skatīt **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**). **Opcija:** `UPSTASH_REDIS_REST_*`. **Auth:** Leaked password protection (skat. **Supabase iestatīšana**). Pēc SQL: **`npm run security:check`**. Ja mainīts **`styles/subtrack.css`**: **`npm run css:split`**. Migrācijas: **Supabase iestatīšana**, **`npm run security:migration-checklist`**, **`security_check.md`**.
4. **Pārbaude** – **`npm run lint`** un **`npm run build`** pēc lielākām izmaiņām; ikdienas **`npm run dev`**. Ja mainīta drošība/DB: **`npm run security:check`**. Mobilā: PWA banneris + **`/offline`** (**[PWA](#pwa-subtrack)**). **≥0.4.22:** pēc pull pārbaudīt **Font Awesome** ikonas (admin todos ✓/rediģēt, panelis, landing); ja tukšas – **`app/layout.tsx`** nedrīkst lietot atlikto FA ielādi (`media="print"`). Turbopack **`CssSyntaxError`** uz **`landing.css`** (piem. `Unexpected }`) – vispirms **`npm run css:split`**, tad dzēst **`.next`** un restartēt dev (**0.4.38**).
5. **Produkcija (Vercel)** – ja mainīts domēns vai ENV: Vercel **Redeploy**; pārbaudīt **`NEXT_PUBLIC_SITE_URL`**, Supabase **Redirect URLs** un Porkbun DNS (skatīt **[Vercel un produkcijas domēns](#vercel-un-produkcijas-domēns)**). Ja pieslēdz **Google Search Console** – TXT **Porkbun**, pēc tam **sitemap.xml** GSC (skatīt **[Google Search Console](#google-search-console-pēc-verifikācijas)**).

### Ko „pateikt’’ / kā īsi atbildēt pēc jauna Git atjauninājuma

- **Lietotājam vai komandai:** īsi uzskaitīt: vai būtu jāpalaiž `npm install`; vai README žurnālā ir kas jauns (ENV, SQL, PWA); vai šķietami mainījušies paneļa faili (`public/fs/js/`, `components/fs/`, `components/pwa/`); tad **`npm run dev`** un manuāli pārbaudīt galvenās lapas (sākumlapa, panelis, auth, admin, **PWA banneris** mobilā – **[PWA](#pwa-subtrack)**).
- **AI palīgam:** neatkārtot visu README; izmantot šo sadaļu kā čeklisti. Ja žurnālā ir konkrētas jaunās funkcijas – nosaukt tās īsi; ja nav pieraksta žurnālā bet pull saturēja tikai mazus labojumus – to arī norādīt un ieteikt tikai `npm install` / `npm run dev`, ja nav redzamu `package-lock` vai DB izmaiņu.

### Uzturētājiem

Pie būtiskām izmaiņām **papildināt [Izmaiņu žurnāls](#izmaiņu-žurnāls)** (datums; jauna apakšversija): jauni SQL faili, ENV atslēgas, jauni maršruti, lauztās izmaiņas. **Pēc 0.3.54** žurnāla ierakstiem lieto **0.4.x** (skatīt žurnāla augšējo piezīmi); **`package.json`** `version` = jaunākā **0.4.***.

## Vide un drošība

- Nekommitē `.env.local` un sensitīvus atslēgu ierakstus; klientā tikai **`NEXT_PUBLIC_*`** (URL, anon key, `SITE_URL`).
- Pilns audits, atzīme un checklist: **`security_check.md`**.

### Servera atslēga (`SUPABASE_SERVICE_ROLE_KEY`)

| Funkcija | Kur |
|----------|-----|
| Signup e-pasta aizņemtība | **`signupEmailExistsAction`** (`023`, `080`); bez atslēgas – **`auth.signup.email_check_unavailable`** (`115`) |
| Pro trial RPC | **`grant_pro_trial_if_eligible`**, **`repair_pro_trial_started_at`** (`116`, `grant-pro-trial-session.ts`) |
| Admin VIP slēdzis | **`POST /api/admin/users/pro-vip`** (`080`) |
| Admin lietotāja dzēšana | **`POST /api/admin/users/delete`** – `auth.admin.deleteUser` + noņem e-pastu no **`retired_signup_emails`** (atkārtota reģistrācija) |
| Cron (e-pasti, push) | **`GET /api/cron/*`** – **`Authorization: Bearer $CRON_SECRET`** (`cron-auth.ts`); testam admin **`/admin/cron-jobs`** → **`POST /api/admin/cron/run`** – **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)** |
| Logo augšupielāde | Admin sesija + service_role + **`072_brand_storage.sql`** |
| Ģimenes dalīšana | E-pasta lookup; **`PATCH`** stāvokļi – sesija, tad service_role fallback (`family-sharing-server.ts`) |

### Drošības migrācijas (kopsavilkums)

Jaunai videi pēc **`001`** – obligāti vismaz: **`015`**, **`016`**, **`022`**, **`023`**, **`078`**, **`079`**, **`080`**. Pro trial (ja ieslēgts): **`107`–`116`**. Saraksts: **`npm run security:migration-checklist`**.

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
- **API rate limit (opc. Upstash):** `lib/security/rate-limit-allow.ts` – `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
- **Signup e-pasta pārbaude:** `signupEmailExistsAction` – `lib/security/server-action-rate-limit.ts` (sliding window).
- **Middleware API:** `lib/supabase/middleware.ts` – `/api/*` bez sesijas → **401** JSON (izņ. cron, dev-env-check).
- **CSP enforce:** `next.config.ts` (`Content-Security-Policy`).

### Supabase Dashboard (manuāli)

- **Leaked password protection:** Authentication → Providers → Email (Pro plānā; Free var rādīt Advisor brīdinājumu pat pēc ieslēgšanas).
- Pēc SQL pull: **Security Advisor → Refresh**.

- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **abonementu CRUD** izmanto **Supabase Postgres** (`001` → **`subscriptions`**, RLS) un **Next Route Handlers** (`app/api/subscriptions`). Citas funkcijas un paplašinājumi dokumentē atsevišķi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām. **PWA** – **[PWA (SubTrack)](#pwa-subtrack)**. **0.4.x** no **0.4.0** (= agrāk **0.3.54**).

### 0.5.10 (2026-05-23)

- **Admin – cron testi** – **`/admin/cron-jobs`**: piespiedu palaišana visiem **`/api/cron/*`** darbiem; **`POST /api/admin/cron/run`**; nedēļas/trial ar **`?force=1`** (laika logs). **`lib/admin/run-cron-job.ts`**, **`lib/cron/cron-job-registry.ts`**, **`cron-force-query.ts`**. SQL **`127_*`**, stili **`.admin-cron-*`**.

### 0.5.9 (2026-05-23)

- **OAuth viens konts (e-pasts + Google)** – Supabase automātiska saistīšana dokumentēta; login norāde (`auth.social.same_account_hint`); **`/settings`** **`SettingsConnectGoogle`** (`linkIdentity`). SQL **`126_*`**, **`lib/auth/oauth-redirect.ts`**, README **[Google OAuth → Viens konts](#6-viens-konts-e-pasts--parole-un-google)**.

### 0.5.8 (2026-05-23)

- **OAuth profila bilde** – Google (un citi provideri ar `avatar_url` / `picture` metadata) rāda profila foto topbar lietotāja izvēlnē un **`/admin/users`**; rezerve – inicialēs. SQL **`125_users_oauth_avatar_url.sql`** (`avatar_url`, `handle_new_user`, Auth trigeris, backfill). Kods: **`UserAvatar`**, **`sync-oauth-avatar.ts`**, **`auth/callback`** sinhronizācija, **`user-display.ts`**.
- **E-pasta paziņojumi – UI un dokumentācija** – **`/email-notifications`**: `auth-card`, `admin-switch`, `.email-notif-*` (**`styles/subtrack.css`**; pēc izmaiņām **`npm run css:split`**). Profila izvēlne **E-pasta paziņojumi**. README: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)** (Vercel cron tabula), struktūra, **Pēc Git** līdz **`124_*`**, **`supabase.env.template`** cron ceļi.

### 0.5.7 (2026-05-23)

- **README – Google OAuth (Supabase)** – jauna sadaļa **[Google OAuth (Supabase)](#google-oauth-supabase)**: Google Cloud redirect uz `*.supabase.co/auth/v1/callback`, Supabase Redirect URLs uz `/auth/callback`, admin **`login_google`**, lokāla/produkcijas pārbaude, kļūdu tabula. Saites no **Autentifikācija**, **Supabase iestatīšana** (4. solis) un **Pārbaude pēc deploy**.

### 0.5.6 (2026-05-23)

- **E-pasta cron paziņojumi** – jauni maršruti ( **`CRON_SECRET`**, Resend ): **`GET /api/cron/due-today-payment-emails`**, **`GET /api/cron/weekly-summary-emails`**, **`GET /api/cron/trial-ending-emails`**. **`/admin/email-design`**: **`payment_due_today`**, **`weekly_summary`**, **`trial_ending`**. **`/email-notifications`** + **`users.email_notification_preferences`**. SQL **`123_*`**, **`124_*`**, **`lib/emails/*`**, **`lib/cron/*`**.

### 0.5.5 (2026-05-22)

- **Auth e-pasti un plūsmas** – e-pasta saites uz **`repazy.com/auth/callback`** (`token_hash`, **`app/(app)/auth/callback/route.ts`**); **`/change-password?recovery=1`** bez pašreizējās paroles. Reģistrācija: success ekrāns **„Pārbaudiet e-pastu”** (**`AuthSignupCard`**, **`useActionState`**, SQL **`122_*`**). Signup forma – **`emailCheck`** notīrašana pēc lauka maiņas. SQL **`121_site_translations_reset_password_recovery_ui.sql`**, **`122_*`**.

### 0.5.4 (2026-05-22)

- **Admin – lietotāja dzēšana** – **`/admin/users`**: saite **Dzēst** (ne sevi, ne administratorus); **`POST /api/admin/users/delete`** (`service_role`: `auth.admin.deleteUser`, pēc tam dzēš e-pastu no **`retired_signup_emails`**). SQL **`121_site_translations_admin_users_delete.sql`**, tulkošanas **`2026-05-22.sql`**.

### 0.5.3 (2026-05-22)

- **Reģistrācija – dzēsti e-pasti** – **`119_*`**: `retired_signup_emails` + trigeris uz `auth.users` DELETE; **`signup_email_exists`** + servera signup pārbaude. **`lib/auth/signup-email-blocked.ts`**.

### 0.5.2 (2026-05-22)

- **Aizmirstā parole (lokalizēts)** – **`requestPasswordResetAction`**: **`reset_password`** no **`/admin/email-design`**, UI valoda; **`generateLink` recovery** + Resend; nezināms e-pasts → tāpat **`ok: true`** (bez enumerācijas). **`lib/auth/auth-localized-email.ts`**. SQL **`118_*`**.

### 0.5.1 (2026-05-22)

- **Reģistrācijas apstiprinājums (lokalizēts)** – **`signUpAction`** + **`confirm_signup`** (Resend, UI valoda). **`lib/auth/auth-localized-email.ts`**, **`lib/emails/send-transactional.ts`**. SQL **`117_*`**.

### 0.4.42 (2026-05-22)

- **Security Advisor – Pro trial RPC** – **`116_*`**: `grant_pro_trial_if_eligible(p_user_id)`, `repair_pro_trial_started_at(p_user_id)` – **EXECUTE tikai `service_role`**; serveris (`grant-pro-trial-session.ts`).
- **Drošība (MEDIUM/LOW)** – family sharing **RLS** lasīšana; middleware **`/api/*` → 401**; cron **Bearer**; signup **`email_check_unavailable`** (**`115_*`**); rate limit + opc. **Upstash** (`@upstash/ratelimit`). **`security_check.md`** ar vērtējumu pa kategorijām.
- **Atkarības** – `@upstash/ratelimit`, `@upstash/redis` (opcionāli ENV).

### 0.4.41 (2026-05-22)

- **Pro izmēģinājums** – progress, **`trial.period_dates`**, mobilā datumi paslēpti; SQL **`107`–`115`**; **`110`–`113`** sākuma datums / repair.
- **Drošība** – pirmā MEDIUM/LOW kārta (skat. **0.4.42** papildinājumi).
- **Demo CSS** – **`styles/modules/demo-app.css`** app bundle.

### 0.4.40 (2026-05-22)

- **Pro izmēģinājums – sākuma datums un progress** – **`110_*`**: RPC **`grant_pro_trial_if_eligible`** → **`users.created_at`**; **`112_*`** backfill; **`113_*`** **`repair_pro_trial_started_at`** sesijā; progress **`percentElapsed`** (pagājušais %, ne atlikušais); desktop **`trial.period_dates`** (**`114_*`**). **`components/pro-trial/`**, **`lib/auth/pro-trial-access.ts`**, **`grant-pro-trial-session.ts`**.
- **`/demo/*` UI – CSS** – `.subtrack-demo-banner`, `.subtrack-demo-topbar-badge`, analytics donut u.c. bija tikai `landing.css`; pievienots **`styles/modules/demo-app.css`** → **`subtrack-app.bundle.css`** (**`scripts/split-landing-css.mjs`**, rindas **2585–2739**).
- **`/demo/analytics` – Pro badge** – ar **`paid_plan.enabled`**: virsrakstā **`nav.pro_badge`** (`dash-nav-pro-pill`), nevis teksts „Demo” (**`demo-analytics-page.tsx`**).
- **`css:split` – landing shell** – mobilā navigācija un cookie bloks: **`[7531, 7634]`**, **`[7821, 7831]`**, **`[7833, 8337]`** (novērsts `landing.css` `Unclosed block`).

### 0.4.39 (2026-05-22)

- **React konsole** – Font Awesome: `<script>` noņemts no komponenta, ielāde caur **`next/script`** (`afterInteractive`) root layout; **`FontAwesomeDeferredHead`** tikai `preconnect` / `preload` / `noscript`.
- **Hydrācija (zīmols)** – **`NavBrandBridge`** (`label`, `logoTopbar`) atsevišķi no lielā Intl `dbMap`; **`DashBrandLink`** lasa to pirms konteksta.
- **FS bootstrap** – `<template>` JSON pārvietots uz servera komponentiem (**`FsDashboardBootstrapTemplates`**, **`FsAnalyticsBootstrapTemplates`**) ārpus klienta koka (dashboard / demo / analytics).

### 0.4.38 (2026-05-22)

- **Build – `landing.css` PostCSS** – laboti **`scripts/split-landing-css.mjs`** griezumi pēc **`subtrack.css`** nobīdēm: shell **`[2889, 4065]`**, **`[7496, 7599]`**, **`[7833, 8301]`**; mock **`[4181, 4517]`**, **`[4564, 4734]`**, **`[4859, 5026]`**. Novērsts **`CssSyntaxError: Unexpected }`** (~4867). Pēc pull: **`npm run css:split`**.
- **Valodu izvēlne** – dropdown arī **`EN`** / **`LV`** (**`languageCodeToUiAbbrev`**), ne tikai trigger.
- **README** – atjaunināti **`landing.css`** / **`subtrack.css`** apjomi (~108 / ~191 KB); Supabase čeklists līdz **`110_*`** (vēlāk **`114_*`** – **0.4.41**).

### 0.4.37 (2026-05-22)

- **Cookie consent – overlay un mobilais** – pilnekrāna scrim (`inset: 0`, blur); slide-up tikai uz kartes; mobilā kompakts pogas grid, bez liekas tukšas vietas. **`cookie-consent-root.tsx`**, **`styles/subtrack.css`**.
- **Sākumlapa `#pricing` – mobilais** – bez `flex-grow` izstiepuma; gada rinda grid; kafijas vizuāls paslēpts ≤640px. **`styles/subtrack.css`**.
- **Landing topbar ≤960px** – **Ieiet** / **Reģistrēties** tikai ikonas (**`landing.css`**). Valodu trigger: **`EN`** nevis GB (**`languageCodeToUiAbbrev`**, **`nav-ui-language-switcher.tsx`**).
- **`css:split`** – pirmā griezumu korekcija pēc cookie/pricing/topbar (**`scripts/split-landing-css.mjs`**; pilnīga saskaņošana – **0.4.38**).

### 0.4.36 (2026-05-22)

- **Pro izmēģinājums (sākotnēji)** – admin **`/admin/system`**, DB **`107`**, tulkošanas **`108`**, esošie konti **`109`**, piekļuve **`navUserHasProEntitlement`**; UI progress + **Pro** badge (ne Demo). Paplašinājumi **0.4.40**–**0.4.41** un SQL **`110`–`114`** – skatīt žurnālu un **[Galvenās iespējas → Pro izmēģinājums](#galvenās-iespējas-ui)**.

### 0.4.35 (2026-05-22)

- **Iziet** – **`signOutAction`** novirza uz **`/`**, ne **`/login`** (**`lib/auth/actions.ts`**).
- **Mobilā navigācija** – panelī/admin **`dash-nav-links`** topbarā slēpti **≤960px** (tikai apakšējā josla); noteikumi **`subtrack.css`** beigās → **`subtrack-app.bundle.css`**.
- **`css:split`** – laboti griezumi (`landing-shell` cookie bloks, pricing bloka nobīde); **`scripts/split-landing-css.mjs`**.

### 0.4.34 (2026-05-22)

- **Cookie consent – UI** – banneris ar ikonu, stikla karti (blur, accent līnija), slide-up animācija; sekundārās pogas **`btn-outline`**; customize modālis – kategoriju ikonas, izcelts obligātais bloks, labāki slēdži. **`cookie-consent-root.tsx`**, **`cookie-settings-modal.tsx`**, **`styles/subtrack.css`** (+ **`npm run css:split`**).

### 0.4.33 (2026-05-22)

- **Sākumlapa `#pricing` – UI** – kārtojums ar paneli, mēneša „pill”, gada kartīti ar atlaides badge (vesels **%**), atsevišķa ekvivalenta rinda; jauns **`landing-coffee.svg`** (gradienti, ēna). **`landing-page.tsx`**, **`styles/modules/landing-page.css`**, SQL **`106_site_translations_landing_pricing_ui.sql`**.

### 0.4.44 (2026-05-22)

- **PWA `beforeinstallprompt`** – viens klausītājs **`PwaDeferredInstallProvider`**; **`preventDefault()`** tikai, kad rādās instalācijas UI (mob. banneris vai **`/settings`**); **`prompt()`** no pogas. Novērš Chrome brīdinājumu par neizsauktu **`prompt()`** citās lapās. **`lib/pwa/install-prompt-capture.ts`**, **`install-banner-dismiss.ts`**, **`components/pwa/pwa-deferred-install-provider.tsx`**, **`app/layout.tsx`**.

### 0.4.43 (2026-05-22)

- **SEO / OG** – **`og:title`**, **`twitter:title`**, **`og:image:alt`**, sākumlapas **`<title>`**: angļu **`{system_name} – subscription and recurring payment tracker`**; **`og:locale`** **`en_US`**; bez **`%s | repazy`** dublikāta (`title.absolute`). **`lib/seo/site-share-metadata.ts`**, **`lib/seo/landing-seo.ts`**, **`app/layout.tsx`**.
- **Logo URL** – publiski **`/brand/{filename}?v=`** (Route Handler → Storage), ne **`*.supabase.co`**. **`lib/brand/logo-assets.ts`**, **`app/brand/[filename]/route.ts`**.

### 0.4.32 (2026-05-22)

- **Gada plāns – admin izkārtojums** – **`/admin/system`**: gada slēdzis un **Gada cena (EUR)** vienā **`form-row`** (2. kolonna); hinti un aprēķinātais **%** zem rindas. **`admin-system-panel.tsx`**, **`styles/modules/subtrack-app.css`**.
- **Gada plāns – SQL tulkojumi** – **`102_*`** / **`104_*`**: kolonna **`translation_key`** (ne `key`), lai atbilstu **`011_site_translations.sql`**.

### 0.4.31 (2026-05-22)

- **Gada maksas plāns** – admin **`/admin/system`**: slēdzis + **gada cena EUR** (tikai ar maksas plānu); atlaide **%** aprēķināta no ievadītās gada un mēneša cenas (nav fiksēta 15%). Publiski rāda gada rindu tikai ar derīgu cenu; **`{discount}%`** tikai, ja gada summa < 12× mēneša. SQL **`101`–`104`**; **`lib/paid-plan-annual.ts`**, **`paid_plan_annual_price_eur`**, **`saveSystemSettingsAction`**, **`landing-page.tsx`**, **`subscribe-pro-view.tsx`**.

### 0.4.30 (2026-05-22)

- **SEO – OG virsraksts/lokale** – sākumlapas **`og:title`** un **`og:image:alt`** no **`landing.footer.byline`** aktīvajā valodā (ne vairs cieti latviski); **`opengraph-image`** teksts no tulkojumiem. **`lib/seo/site-share-metadata.ts`**, **`lib/seo/landing-seo.ts`**, **`app/opengraph-image.tsx`**.
- **SEO – publiskās demo lapas indeksējamas** – noņemts **`Disallow: /demo`**; sitemap papildināts ar **`/demo/dashboard`**, **`/demo/analytics`**. **`lib/seo/search-crawl.ts`**.

### 0.4.29 (2026-05-22)

- **Sākumlapa – salauzts UI** – `css:split` griezumi laboti (`landing-mock-panel.css`, shell/footer); hero mock atkal ar kalendāra režģi.
- **Hydration** – `body.landing-page` no SSR (`x-pathname` proxy), ne inline skripta; `{SYSTEM_NAME}` hero tekstos.

### 0.4.28 (2026-05-22)

- **CSS split – Turbopack** – `landing.css` / `subtrack-app.bundle.css` kā **vieni** faili (bez `@import`), lai novērstu `CssSyntaxError` dev/build; `scripts/split-landing-css.mjs` atjaunināts.

### 0.4.27 (2026-05-22)

- **Landing CSS apakškopa (LCP)** – route grupas: **`app/(marketing)/`** (`landing.css` ~68 KB), **`app/(app)/`** (`subtrack-app.bundle.css`); **`scripts/split-landing-css.mjs`**, **`npm run css:split`**. `app/globals.css` vairs neimportē visu `subtrack.css`.

### 0.4.26 (2026-05-22)

- **Mobilā veiktspēja (LCP)** – Font Awesome **nebloķē** pirmo paint: **`components/font-awesome-deferred-head.tsx`**, **`lib/icons/font-awesome-cdn.ts`**. Mobilajā (≤960px) hero mock – tikai **kalendārs** (paslēpts stats/saraksts); **`content-visibility`** uz **`.landing-hero-preview`**. Faili: **`app/layout.tsx`**, **`styles/subtrack.css`**.

### 0.4.25 (2026-05-22)

- **README – Google Search Console** – sadaļa **[Google Search Console](#google-search-console-pēc-verifikācijas)**: domēna TXT **Porkbun** (ne Vercel); pēc verifikācijas **sitemap.xml**, URL Inspection / gaidīšanas laiki; skaidrojums, ka **Supabase nav** jāmaina GSC dēļ. **[Vercel un produkcijas domēns](#vercel-un-produkcijas-domēns)** un **[Pieejamība un Lighthouse](#pieejamība-un-lighthouse)** papildināti.

### 0.4.24 (2026-05-22)

- **Sākumlapa – Lighthouse / LCP** – **`components/landing-page.tsx`** vairs nav **`use client`**: **`LandingPageContent`** servera komponents; tulkošanas **`lib/landing/get-landing-ui-phrases.ts`** + **`landing-phrase-keys.ts`** (bulk **`getUiPhrasesForRequest`**). **`app/page.tsx`**: noņemts **`BodyLandingPageClass`**; **`body.landing-page`** tikai ar inline skriptu. **`app/layout.tsx`**: **`preconnect`** uz Font Awesome CDN. README: **[Pieejamība un Lighthouse](#pieejamība-un-lighthouse)**, **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**.

### 0.4.23 (2026-05-22)

- **Vercel + custom domēns** – dokumentācija: produkcija **`subtrack-web-beige.vercel.app`**, custom **`repazy.com`** (Porkbun DNS: **A** `@` → Vercel IP **`216.198.79.1`**, izdzēst **`pixie.porkbun.com`**; ENV **`NEXT_PUBLIC_SITE_URL`**, Supabase redirect URIs). Jauna sadaļa **[Vercel un produkcijas domēns](#vercel-un-produkcijas-domēns)**; **`supabase.env.template`** – produkcijas URL piemērs.

### 0.4.22 (2026-05-22)

- **Lighthouse / pieejamība** – viewport bez zoom bloķējuma (`app/layout.tsx`); **`<main id="main">`**: `app/page.tsx`, `login`/`signup`, `legal-document-page.tsx`, `forgot-password-fs-view.tsx` (panelis jau `main.main-content`). Topbar saites **`aria-label`** ≤520px (`nav-landing.tsx`, `nav-dash.tsx`). Kontrasts: `--text-muted` → `#475569`, landing akcenti `--primary-dark`, CTA teksts (`styles/subtrack.css`). README: sadaļa **[Pieejamība un Lighthouse](#pieejamība-un-lighthouse)**.
- **Font Awesome** – atliktā CDN ielāde (`media="print"` + inline skripts) **noņemta** tajā pašā relīzē: ikonas pazuda visā UI; atgriezta parasta `<link rel="stylesheet">` (`app/layout.tsx`).

### 0.4.21 (2026-05-22)

- **SEO – robots.txt un sitemap.xml** – Next.js **`app/robots.ts`**, **`app/sitemap.ts`**, politika **`lib/seo/search-crawl.ts`**: **Allow** `/`; **Disallow** panelis, analītika, iestatījumi, auth, admin, API, demo u.c.; sitemap – **`/`** + juridiskās **`/privacy`**, **`/terms`**, **`/cookies`**. Produkcijā **`NEXT_PUBLIC_SITE_URL`** jānorāda īstais domēns.

### 0.4.20 (2026-05-22)

- **Admin uzdevumi – manuāla kārtība** – drag **augšup/leju** un starp kolonnām; kārtība pēc **`sort_order`** (ne prioritātes); noņemta prioritātes birka un forma. **`reorderAdminTodosColumnAction`**, labojums dubultošanai blakus kolonnā (`applyTodoDrop`). SQL **`100_admin_todos_sort_order_backfill.sql`**. Faili: **`admin-todos-board.tsx`**, **`admin-todos-actions.ts`**, **`admin-todos-types.ts`**, **`subtrack.css`**.

### 0.4.19 (2026-05-22)

- **Admin uzdevumi (`/admin/todos`)** – Kanban: kolonnas **Uzdevums** un **Procesā** (bez atsevišķas **Pabeigts** kolonnas); drag-and-drop; poga **✓** pabeigt (modālis), tad ieraksts pazūd no dēļa; DB **`done`** dzēsts pēc **8 h**. Labot/dzēst – ikonpogas ar **`SubtrackTooltip`**; modāļi (ne `window.confirm`). SQL **`096`–`099`**. Faili: **`app/admin/todos/`**, **`admin-todos-board.tsx`**, **`admin-todos-actions.ts`**, **`admin-shell.tsx`**, **`.admin-todos-*`**. *(Kārtošana pēc prioritātes aizstāta ar **`sort_order`** – skatīt **0.4.20**.)*

### 0.4.18 (2026-05-22)

- **Produkta nosaukums (meta / PWA)** – noņemts pagaidu **repazy**; noklusējums un SW push atkal **SubTrack**; OG ikona **S**; SQL **`099_product_name_subtrack.sql`**. Faili: **`lib/pwa/defaults.ts`**, **`app/sw.ts`**, **`app/opengraph-image.tsx`**, **`lib/i18n/pwa-fallback-phrases.ts`**.

### 0.4.17 (2026-05-22)

- **Admin Kanban (sākotnējā ieviešana)** – **`096`**, **`097`**, pamata **`/admin/todos`** (vēlāk precizēts **0.4.19**).

### 0.4.16 (2026-05-21)

- **Ģimenes dalīšana – kopsumma katram atsevišķi** – SQL **`095`**: **`owner_combine_in_totals`** / **`partner_combine_in_totals`** (aizstāj vienu **`combine_in_totals`**); owner un partner slēdzis neatkarīgi; **`PATCH`** un bootstrap **`combineInTotals`** pēc skatītāja. Guard trigger **`095`**. Hint **`family_sharing.hint_combine`**. Faili: **`095_*`**, **`family-sharing-server.ts`**, **`[id]/route.ts`**, **`route.ts`**, **`2026-05-21.sql`**.

### 0.4.15 (2026-05-21)

- **Ģimenes dalīšana – drošība (HIGH/MEDIUM)** – SQL **`092`**: owner RLS sadalīts; **`family_sharing_links_guard_update`** trigger; POST uzaicinājums ar **`err_invite_failed`** (400), ne e-pasta enumerācija. Faili: **`092_*`**, **`route.ts`**, **`security_check.md`**.
- **Vercel / produkcija** – lasīšana ar **`service_role`** (`family-sharing-server.ts`): saites, dashboard kopīgie abonementi; noņemts lieks **`console.*`** publiskajā ceļā.

### 0.4.14 (2026-05-21)

- **Ģimenes dalīšana – paziņojumi un API** – **`/family-sharing`**: augšējā joslā zvans rāda kavētos / šodien / gaidāmos (**`#subtrack-subs-bootstrap-json`**, **`FsNotifyI18nBootstrap`**, **`nav-dash.tsx`** `reloadSubscriptionsFromBootstrap`). **`GET /api/family-sharing`**: `viewerUserId` labojums; **`PATCH`**: `decline`, stāvokļa maiņas ar **`service_role`** pēc tiesību pārbaudes. Uzaicinājumu pogās ielādes riņķis (**`family-sharing-view.tsx`**, **`dash-alerts.js`**). SQL **`089`** (pending **`partner_user_id`**), **`090`** (noraidīt). Bootstrap ģimenes kešam lapā (**`#subtrack-family-sharing-bootstrap-json`**).
- **Ģimenes dalīšana – krāsas un kopsumma** – SQL **`091`**: owner **`partner_display_color`**, partner **`partner_tint_color`** (katrs savā panelī). Partneris var mainīt krāsu (**`Dalība ar mani`**). Kopsummas karte: sarkana **\*** + zila info ikona, ja saite aktīva bet nav „saskaitīt kopā” (**`dashboard.js`**).

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
- **README** – sadaļa **[PWA (SubTrack)](#pwa-subtrack)**; **0.4.x** numerācija (0.4.0 = agrāk 0.3.54); struktūra līdz SQL **080**; pēc **`git pull`** PWA čekliste.

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

- **PWA (SubTrack)** – Serwist SW (`serwist.config.js`, `app/sw.ts`), `app/manifest.ts`, ikonas (`app/icon.tsx`, `app/apple-icon.tsx` vai Storage **`brand`** pēc logo); **`/offline`** fallback + jauns offline UI (skat. **0.3.53**); instalācijas UX (`components/pwa/*`), admin **`/admin/pwa`**, publiskā konfigurācija `getPublicSystemSettings().pwa`. SQL **`067`–`070`**. Produkta nosaukums **SubTrack** (`070_*`, OG/manifest bez logo). Dev: **`npm run dev`** (concurrently + serwist watch); **`npm run dev:next-only`** bez SW.

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

- **Mobilais UI** – viewport bez lietotāja tālummaiņas (`app/layout.tsx`); **`touch-action`** un **`overscroll-behavior`** ≤960px. **Modālis** – par 10px šaurāks (5px katrā pusē); **`input[type="date"]`** ietilpst rāmī (`styles/subtrack.css`). *(Tālummaiņa atkal atļauta – skatīt **0.4.22**.)*

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

- **Admin – e-pasta dizains** – **`/admin/email-design`**: priekšskatījums un rediģēšana **7 valodās**; saglabāšana **`system_settings_email_templates`**. Ar Resend + service role: **`confirm_signup`**, **`reset_password`** (UI valoda); cron šabloni **`overdue_payment`**, **`payment_due_today`**, **`weekly_summary`**, **`trial_ending`**. Saite **`repazy.com/auth/callback`**. Skatīt **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**. SQL **`051`–`055`**, **`117`–`124`**.

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

- **`subscribe.hero.lead`** – pielabo kopsavilkumu (kafija mēnesī + „neaizmirst maksājumus”) **`fallback-phrases.ts`**, **`029`**, **`013`** (eksports), **`033_*`** esošām DB; **sākumlapa `#pricing`** – **`landing-page.tsx`**, **`subtrack.css`** (rinda ar **`subscribe.hero.lead`** pirms **`landing.pricing.blurb`**; opcija **gada cena** + **`{discount}%`** – **`101`–`106`**, **`lib/paid-plan-annual.ts`**; pēc **`subtrack.css`** – **`npm run css:split`**).

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

- **Paziņojumu FS lokāle** – **`FsNotifyI18nBootstrap`** (`components/fs/fs-notify-i18n-bootstrap.tsx`): uz **`/`** (ielogots), **`/settings`**, **`/change-password`**, **`/family-sharing`**, **`/admin/*`** iestāda **`window.__SUBTRACK_FS_META.intlLocale`** un **`FsT(fs.dashboard.overdue_*)`**, lai **`dash-alerts.js`** (`formatOverdueLabel`, datumu **`Intl`**) sakristu ar UI lokāli; **`lib/fs/fs-page-i18n-keys.ts`** – **`fsNotifyBarPhraseKeys`**.

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

- **Sistēmas iestatījumi** – `database/supabase/012_system_settings.sql`: `public.system_settings` (nosaukums, `default_display_preferences`, **`logo_revision`**, maksas plāns **`027`**, gada **`101`–`103`**), `handle_new_user` kopē preferences; `/admin/system` – **`AdminSystemPanel`** (maksas + gada plāns, autosave), logo (**`logo-actions.ts`**), **`lib/paid-plan-annual.ts`**; publiski **`getPublicSystemSettings`** / **`SubtrackIntlProvider.paidPlan`**. SQL **`071`–`074`**, **`101`–`106`**.

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
