# SubTrack (subtrack-web)

**Versija:** `0.6.31` (skatīt **[Izmaiņu žurnāls](#izmaiņu-žurnāls)**; **0.4.x** sākas ar **0.4.0** = agrāk žurnāla **0.3.54**; PWA – **[PWA (SubTrack)](#pwa-subtrack)**; native Android – **[Capacitor (Android)](#capacitor-android)**). Produkcija: **[Vercel un domēns](#vercel-un-produkcijas-domēns)** (`repazy.com`). Lietotājam redzamais nosaukums – **`system_settings.system_name`** (admin **`/admin/system`**).

**SubTrack** (repozitorijs `subtrack-web`; zīmols **repazy**) ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. **Paneļa dati** (`/dashboard`, `/analytics`) lasās no **Supabase** (`public.subscriptions`, **`public.subscription_payments`** maksājumu žurnālam, RLS); CRUD notiek caur **Route Handlers** (`app/(app)/api/subscriptions/*`) ar kopīgu **`lib/api/`** (sesija, JSON, atbildes) un sesijas sīkdatēm; prototipa **FS** JavaScript (`public/fs/js/`, datumi – **`display-preferences-format.js`**) renderē UI un izsauc API (kopā ar **Supabase Auth** un **`database/supabase/`** migrācijām).

## Galvenās iespējas (UI)

- **Sākumlapa** (`/`) - prezentācija, FAQ (navigācijā LV **`BUJ`**, ne angl. „FAQ”), saites uz **publiskajām demonstrācijām** **`/demo/dashboard`** un **`/demo/analytics`**, reģistrāciju un ieeju; **ar aktīvu sesiju** serveris novirza uz **`/dashboard`** (**`app/(marketing)/page.tsx`**, `redirect`). Galvenais saturs **`#main`** (`<main id="main">`); augšējā josla ārpus **`main`** (**`NavLanding`** – klienta komponents; **`LandingNavSync`** – scroll sync **`#features`** / **`#demo`** / **`#faq`**; **`LandingPageContent`** – **servera** komponents **`components/landing-page.tsx`**, tulkošanas **`getLandingUiPhrases()`** / **`lib/landing/*`**). **`body.landing-page`** – SSR **`app/layout.tsx`** (`x-pathname` no proxy). Ja **`/admin/integrations`** ieslēgts **`family_sharing`**, trust blokā un iespēju režģī septītā kartīte (**`landing.features.cards.family_sharing.*`**, **`landing.trust.family_sharing_hint`**, SQL **`141_*`**). Ja **`/admin/system`** ir ieslēgts **maksas plāns**, viesiem rādās **cenu / brīvā līmeņa** bloks ar kafijas ilustrāciju (`#pricing`), **ievads** no kopīgā **`subscribe.hero.lead`** un **`landing.pricing.blurb`** ar **`{count}`** / **`{price}`**; ja ieslēgts **`paid_plan_annual_enabled`** un DB ir **`paid_plan_annual_price_eur`**, arī gada cena un aprēķinātais **`{discount}%`** (**`lib/paid-plan-annual.ts`**, **`landing.pricing.annual_*`**); ja ieslēgts **`paid_plan_lifetime_enabled`** ar derīgu cenu un **nav** beidzies laika vai iegādes limits (**`lib/paid-plan-lifetime.ts`**, **`paidPlan.lifetime.active`**), trešā **lifetime** karte ar **countdown** (centrēts, max platums) un/vai atlikušo vietu skaitu (**`components/landing-pricing-lifetime-urgency.tsx`**, **`landing.pricing.lifetime_*`**; **„One-time”** badge aiz cenas, tagline **vienā rindā**; **spots** desktop – kartes augšējā labajā, mobile – centrēts). Dati no **`getPublicSystemSettings().paidPlan`** (SSR). Paneļa augšējās joslas **logo** (tikai ja augšupielādēts no **`/admin/system`**) vai teksta nosaukums (**`DashBrandLink`**, **`components/nav-dash.tsx`**) ved uz **`/dashboard`**, nevis **`/`**. **SEO / dalīšana:** **`<title>`**, **`og:title`**, **`og:image:alt`**, **`twitter:title`** – angļu **`{system_name} – subscription and recurring payment tracker`** (**`buildSiteSharePageTitle`**, **`title.absolute`** uz `/`); **`og:locale`** **`en_US`**; logo URL **`/brand/*`** (ne Supabase hostu). **`/opengraph-image`** (1200×630). **`lib/seo/*`**, **`app/brand/[filename]/route.ts`**, **`app/opengraph-image.tsx`**.
- **Autentifikācija** – **Supabase Auth** (Server Actions), OAuth (Google / Apple) tikai ar **`/admin/integrations`** **`login_google`** / **`login_apple`** (**`lib/integrations/login-social-flags.ts`**, **`components/login-social-buttons.tsx`**, SQL **`024_*`**, **`025_*`**); pilns iestatīšanas ceļvedis – **[Google OAuth (Supabase)](#google-oauth-supabase)**. **Google profila bilde** – augšējā joslā un admin lietotāju sarakstā (inicialēs, ja nav OAuth bildes); **`public.users.avatar_url`**, SQL **`125_*`**, **`components/user-avatar.tsx`**, **`lib/auth/oauth-avatar-url.ts`**. **Iziet** → pārlūkā **`/`**; native app → **`/login`**. **E-pasti no `/admin/email-design`** (Resend API, ne Supabase Auth HTML): ja serverī ir **`RESEND_API_KEY`**, **`EMAIL_FROM`**, **`SUPABASE_SERVICE_ROLE_KEY`** – **`confirm_signup`**, **`reset_password`**, **`invite_user`** (ģimenes uzaicinājums ārpus `public.users`, **`lib/family-sharing/send-family-invite-email.ts`**) un cron (**`payment_due_today`**, **`weekly_summary`**, **`trial_ending`**, **`win_back_7d`**, **`win_back_30d`**, **`account_deletion_notice`** (konta dzēšana uz atbalstu, ja lietotājs norādījis iemeslu, **`lib/auth/send-account-deletion-notice-email.ts`**) – **`lib/auth/auth-localized-email.ts`**, **`lib/emails/*`**, **`lib/cron/*`**, SQL **`117`–`124`**, **`169_*`**, **`171_*`**, **`155_*`**); citādi fallback uz Supabase **`resetPasswordForEmail`** (plakans šablons). Cron un prefs: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**. Saite e-pastā: **`https://repazy.com/auth/callback?...`** (**`lib/auth/auth-callback-link.ts`**, `token_hash` + `verifyOtp`), ne tikai `*.supabase.co/auth/v1/verify`. **Redirect URLs** Supabase: `https://repazy.com/auth/callback` (skat. **[Supabase](#supabase-obligāti-ar-custom-domēnu)**). **Reģistrācija** (`/signup`, **`useActionState`**): admin **`/admin/system`** slēdzis **`signup_enabled`** (noklus. ieslēgts) – izslēdzot: **`/signup`** novirza uz **`/login`**, pazūd reģistrācijas poga **`NavLanding`**, landing CTA un saite no **`auth-login-flow`**; **`signUpAction`** bloķēts; publiski **`getPublicSystemSettings().signupEnabled`** (**`SubtrackIntlProvider`**). SQL **`166_system_settings_signup_enabled.sql`**, **`167_*`**. Opc. **`?email=`** no ģimenes uzaicinājuma (aizpilda formu); pēc veiksmīgas reģistrācijas – ekrāns **„Pārbaudiet e-pastu”** (kā aizmirstajai parolei; SQL **`122_*`**); e-pasta aizņemtība **`signup_email_exists`** + **`retired_signup_emails`** (dzēstiem kontiem atkārtota reģistrācija liegta, SQL **`119_*`**, **`120_*`**). **Aizmirstā parole** (`/forgot-password`) – success ekrāns „Pārbaudiet e-pastu”. **Parole:** ielogots – **`/settings`** (labā kolonna); no e-pasta saites – **`/change-password?recovery=1`** (tikai jaunā parole, SQL **`121_*`**). **`changePasswordAction`** (ne recovery) novirza uz **`/settings?message=`** / **`?error=`**. **`/signup`** forma (**`components/signup-form.tsx`**) – e-pasts **`autocomplete="username"`**, paroles **`new-password`**; **`onInput`** + DOM sync, lai pārlūks/aizpildītājs piedāvātu drošu paroli un React redzētu aizpildīto (spēka josla, apstiprinājums, submit). **Neveiksmīga ieeja** – e-pasts paliek URL **`?email=`** (nav jāievada no jauna; **`signInWithPasswordAction`**, **`auth-login-flow.tsx`** `defaultValue`). **`components/auth/auth-signup-flow.tsx`**, **`auth-login-flow.tsx`**, flash toast auth lapās. Lokāle: **`getUiPhraseForRequest`** / **`resolveRequestUiLocales`**.
- **Pro abonements (ielogotiem)** – profila izvēlnē **Pro abonements** (zeltaina kronīša ikona) → modālis: plāns, statuss, perioda beigas, auto-atjaunošana; **`POST /api/billing/portal`** → Stripe Customer Portal (atgriešanās **`/dashboard?billing=1`**). Nav **`/settings`**. **`components/billing/*`**, **`lib/billing/session-billing-summary.ts`**, **`loadNavBrandSnapshot()`** (SSR). SQL/tulkojumi **`database/translations_daily/2026-05-30-billing-portal.sql`** (7 valodas). Auto-atjaunošanas atslēgšana – portālā (info bloks modālī).
- **Panelis** (`/dashboard`) - maksājumu kalendārs (mēneša navigācija **`cal-prev`/`cal-next`** rāda **visus** periodiskos termiņus skatītajā mēnesī, ne tikai `next_payment_date` – **`subscriptionDueDatesInMonth`**, **`getPaymentsByDateInMonth`**; **mēneša beigu diena** piem. **31.** īsākos mēnešos kļūst **30.** / **28.** vai **29. feb.** – **`calendarDateOnBillingDay`**, **`subscriptionPreferredBillingDay`**; ja vienā datumā vairāki maksājumi, šūnā **`+N`** apakšējā labajā stūrī; **šodienas** šūnai indikatora krāsa kā **ring** apmalei; **„atzīmēts samaksāts”** dienas no **`public.subscription_payments`** (**`paidCalendarDays`**, **`061_*`**); slēdzis **`subtrack_cal_include_paid_marks`** – ja atslēgas vēl nav, **noklusējums ieslēgts**; marķējums un skaidrojums **`SubtrackTooltip`** (hover / fokuss; burbulis portalā paliek, kamēr kursors virs pogas vai burbuļa; **bez** pārlūka **`title`**), **`aria-label`** pieejamībai; kājenes **leģenda vienā rindā**); **peldošie toast** (`showToast` **`subscriptions-helpers.js`**) – auto-aizvēršanās aptur, kamēr kursors virs ziņojuma), **kopsavilkums** (kopējā / aktīvie maksājumi; ja **`/settings`** ir **`monthly_budget`**, trešā stat kartīte – **budžeta atlikums**, kopējais budžets mazākā fontā, **5px** progress josla (% izlietots), zaļa/sarkana **2px** apmale; **`#subtrack-display-prefs-bootstrap-json`**, **`renderBudgetStat`** **`dashboard.js`**, SQL **`133_*`**; **kategoriju josla** virs saraksta (**Pro**, ja ieslēgts maksas plāns – **`subtrackCanShowDashboardCategoryBar`** **`dashboard.js`**; citādi visiem) – segmentu tooltip uz desktop, leģenda mobilajā; **Nākamais maksājums** sadalīts kolonnās: **kavētie** / **šodien jāmaksā** / nākamais – krāsainas kartes ar kopējo € un rēķinu skaitu zem summas; trīs kolonnās nākamais kompakts: € + nosaukums, bez datuma labajā; saraksta darbību pogas – diskrētas krāsas: rediģēt, dzēst, samaksāts), abonementu CRUD pret **`public.subscriptions`** (**`GET`/`POST` `/api/subscriptions`**, **`PATCH`/`DELETE` `/api/subscriptions/[id]`** ); ja admin ieslēdz **maksas plāna** ierobežojumu, **`POST`** atgriež **403** brīvā līmeņa **ierakstu skaita** sasniegšanā (**`paid_plan_active`** `public.users` – pašpārvaldei nē, skat. **`027`**); lietotāja izvēlnē **`fa-crown`**, tikai ja **`navUserHasPaidProMembership`** (apmaksāts vai VIP, **ne** izmēģinājums). Sākuma dati SSR bootstraps (**`#subtrack-subs-bootstrap-json`**, **`#subtrack-category-options-bootstrap-json`**, **`#subtrack-family-sharing-bootstrap-json`**); **`GET /api/subscriptions`** ietver arī **ģimenes dalīšanas** kopīgos ierakstus, ja integrācija ieslēgta; **FS JS** (`public/fs/js/dashboard.js` …) dabū frāzes un **`Intl`** lokāli pirms **`loadScriptOnce`**, jo **`app/dashboard/page.tsx`** renderē **`FsI18nBootstrap`** (skatīt **UI tulkošana**); kalendārā **lv** nedēļas dienu galvenes **Pr … Sv**; **pievienošanas / labošanas modālis** (`#modal-main`) – **nosaukuma ieteikumi** (`#sub-name-suggestions`: populārākie no lietotāja ierakstiem, citādi noklusējumi pēc UI valodas, līdz **3** rindām, paslēpjas rakstot); **kategorijas** (`#sub-category`) no **`public.subscription_categories`** (tikai ieslēgtās) – nosaukumi no **`site_translations`** (`subscription.category.{key}`); SSR **`#subtrack-category-options-bootstrap-json`**, kārtība **lietotāja lietojums → globālā `usage_count` → admin `sort_order`** (**`fetchEnabledSubscriptionCategoryOptions`**, **`lib/subscriptions/subscription-categories-server.ts`**); modāļa atvēršanā **`reorderSubCategorySelect`** atjauno secību pēc pašreizējā saraksta (**`subscriptions-helpers.js`**, **`dashboard.js`**); **dinamiskais maksājums** + otrais slēdzis **„Nākamajam: iepriekšējā summa”** (**`is_dynamic_carry_previous`**, SQL **`130_*`**, noklusējums izslēgts); **privātais aizdevums** (`private_loan`, SQL **`161_*`**, **`162_*`**): modālī aizņemtā summa, kopā atmaksājam, **nākamais maksājums** (datums + summa); sarakstā **Mainīt summu** pirms apmaksas (faktiskā summa iet progressā); progress **`€… / €…`**; pilna atmaksa → **100%**; pēc maksājuma automātiski nākamais termiņš, kamēr nav atmaksāts; kalendārā neapmaksātie grafika datumi; elpīgākas vertikālās atstarpes galvenajai formai un **Papildu opcijām** (**`styles/subtrack.css`**); virsraksts **„Maksājumi”** bez Pro birkas; augšējā joslā **paziņojumi** (**`dash-alerts.js`**) – tikai **paši** abonementi (**bez** partnera kopīgotajiem: kavētie / šodien / gaidāmie un zvana skaitītājs); **šodienas** un **kavētie** ar **atzīmēšanu kā samaksātu** – API laikā **ielādes riņķis** un **neaktīva** poga; kopīga **`subtrackSetMarkPaidPending`** **`subscriptions-helpers.js`**); **gaidāmie** sākas no **nākamās dienas**; mobilajā skatā – pilnekrāna fons ar **backdrop blur**; abas izvēlnes nevar būt atvērtas vienlaikus). **Modālis – IKONA:** izvēlei **`fa-solid`** klases no **`FA_ICONS_ALL`** (`lib/fs-icons.ts`; ~**102** **`fa-solid`** klases – **nav** pilnās Font Awesome Free kopas, Free satur **daudz vairāk** ikonu nekā šīs ~102). Hintu josla un režģis „Parādīt visas“ **tā pati secība**; augšējā rinda – tikai tik pogas, cik **`dashboard.js`** aprēķina pēc **`#icon-picker-hints-shell`** (bez apgriešanas). Meklēšana ar sinonīmiem – **`lib/fs-icon-picker-search.ts`**, JSON **`#subtrack-icon-search-bootstrap`** (**`components/fs/dashboard-fs-view.tsx`**). Ja **maksas plāns** ieslēgts un lietotājam nav Pro, zem **„Pievienot”** ir saite **„Iegūt Pro”** uz **`/subscribe`**; **kategoriju josla** paslēpta brīvajā līmenī (**`renderDashboardCategoryBar`**, **`subtrackCanShowDashboardCategoryBar`**); **kalendārs** – mēneša navigācija, nedēļas galvenes, **1. nedēļa** un kājene redzama, **no 2. nedēļas** šūnas ar **blur** + CTA (**`pay-calendar-card--preview-locked`**, **`ProFeaturePreviewCtaCard`**, **`dashboard.js`**); **analītika** – **pirmā rinda** (2 stat kartītes), pārējās ar blur + CTA (**`analytics-preview-wrap--locked`**, **`analytics.js`**). **`isProFeaturePreviewLocked`** / **`dashboard-free-tier-gate-payload.ts`** (klientam drošs); nav pilna kartes blur, nav **Pro** pill uz šiem laukiem. **Pievienošanas modālis – ikona:** nejaušā izvēle no **pirmās redzamās** hint rindas; **`Parādīt vairāk`** (LV; SQL **`062_*`**) atver pilnu katalogu. **Tukšs panelis:** kalendārs un statistika ar nullēm; lielā **`#empty-state`** karte paslēpta; zem **„Jūsu maksājumi”** pelēks hints (**`fs.dashboard.empty_list_hint`**, **`dashboard-pay-calendar-initial.tsx`**, SQL **`170_*`**).
- **Pro izmēģinājums** – admin **`/admin/system`**: **`pro_trial_enabled`**, **`pro_trial_days`**; jaunajiem **`107_*`** (`handle_new_user`); esošajiem sesijā **`maybeGrantProTrialForSession`** / **`maybeRepairProTrialStartedAt`** (**`lib/auth/grant-pro-trial-session.ts`**, RPC ar **`service_role`** pēc **`116_*`**). Sākums = **`users.created_at`** (**`110_*`**, **`112_*`** backfill, **`113_*`** repair). Piekļuve kā Pro: **`navUserHasProEntitlement`**; kronītis tikai **`navUserHasPaidProMembership`**. **`/dashboard`** / **`/analytics`**: progress josla (**`percentElapsed`**); desktop **`trial.period_dates`**; **≤960px** datumi paslēpti. SQL **`107`–`116`**.
- **Pro iepazīšanās** (`/subscribe`) – **`SubscribeProView`** (`app/(app)/subscribe/page.tsx`): **`subscribe.hero.*`**, **`subscribe.free_tier.note`** ar **`{price}`** / **`{n}`**. Ja **`paid_plan_annual_enabled`** – **mēneša pill** + **gada karte** (kā landing **`#pricing`**, teksti **`landing.pricing.*`**); citādi vienkāršs mēneša bloks. Ja aktīvs **lifetime** – trešā karte ar countdown / atlikušajām vietām (**`LandingPricingLifetimeUrgency`**, scope **`subscribe`**); visi plānu bloki **`subscribe-pro-plans-stack`** (vienādas atstarpes mobilajā). Ar ieslēgtu maksas plānu un bez Pro – **`SubscribeProPurchaseButton`** (**„Iegādāties”**) → **`POST /api/billing/checkout`** → Stripe Checkout; pēc apmaksas **`/subscribe/success?session_id=…&plan=…`** – webhook + **`POST /api/billing/sync-checkout`** (fallback) atjauno **`users.paid_plan_*`**; mēneša/gada plānam modālis kalendāra ierakstam (**`SubscribeProTrackPrompt`**, **`POST /api/billing/pro-track-subscription`**). Skatīt **[Stripe (norēķini)](#stripe-norēķini)**. Stili **`styles/subtrack.css`** → **`subtrack-app.bundle.css`**. Tulkošanas **`029`**, **`028`** / **`031`**, **`030`**, **`032`**, **`033`**, **`101`–`106`**, **`156`–`157`**, **`160_*`**, **`database/translations_daily/2026-05-29.sql`** (`subscribe.price.lifetime_interval`).
- **Demonstrācijas** (`/demo/dashboard`, `/demo/analytics`) – **publiski** (nav **`proxy`** aizsargātas kā `/dashboard`); **SEO** – sitemap + **`canonical`** / OG (**`buildPublicPageMetadata`**, **`search-crawl.ts`**); **`/demo/dashboard`** – **`DashboardFsView`** + **`public/fs/js/dashboard.js`** (kalendārs, modāļi; **API netiek izsaukti**, `window.__SUBTRACK_DEMO_DASHBOARD__`); parauga abonementi **`lib/demo/demo-dashboard-subscriptions.ts`** – maksājumu datumi **pret SSR „šodienu”** (1× nokavēts, 1× šodien, 1× vēlāk šonedēļ, 1× nākamnedēļ, pārējie tālāk kalendārā); **`/demo/analytics`** lieto to pašu masīvu. Virs satura **info josla** (`.subtrack-demo-banner`) un topbar **`Demo`** birka (`.subtrack-demo-topbar-badge`; **≤960 px** – mazāka birka blakus logotipam, **`flex-wrap: nowrap`**). **`/demo/analytics`** – **`DemoAnalyticsPage`** (kopsavilkumi, donut; **nav** tendences/prognozes); tā pati info josla; virsrakstā ar ieslēgtu maksas plānu – **`Pro`** pill (`dash-nav-pro-pill`), citādi **Demo** birka. **Paziņojumu zvans** rāda paraugus arī viesiem. Stili **`/demo/*`** – modulis **`styles/modules/demo-app.css`** app bundle (**`css:split`**, ne tikai `landing.css`). Tulkošanas **`034`**, **`036`**, **`037`**, **`041`**, **`demo.*`**.
- **Analītika** (`/analytics`) - kopsavilkumi, kategoriju joslas un **CSS donut** sadalījums (`demo-analytics-*`, kā demo; bez Chart.js CDN); **`FsI18nBootstrap`** + **`FsAnalyticsBootstrapTemplates`** (**`#subtrack-free-tier-gate-json`**) + **`public/fs/js/analytics.js`** (**`app/analytics/page.tsx`**). Ja **`paid_plan_enabled`** un nav Pro, **pirmās divas** stat kartītes redzamas, pārējais režģis **blur** + CTA (**`analytics-fs-view.tsx`**, **`ProFeaturePreviewCtaCard`** bez apakšteksta); pilna funkcionalitāte – **`canAccessAnalytics`** / **`navUserHasProEntitlement`**. Analītikas saite **vienmēr** navigācijā ielogotajiem (**`nav-dash.tsx`**, **`nav-landing.tsx`**). Publiskā **`/demo/analytics`** paliek viesiem; sākumlapas **„Explore”** analītikas kartē – **`landing.explore.pro_in_app_badge`** (**Pro**), **`landing.explore.analytics.pro_hint`** un **`/demo/analytics`**. **Tukšs stāvoklis** (0 abonementu): paslēpts stat režģis, pelēks hints **`fs.analytics.empty_no_data`** (**`analytics-fs-view.tsx`**, **`analytics.js`**, SQL **`172_*`**). Pirms FS boot – **`AppPageContentGate`** (spinner + **`app.page_loading`**).
- **Lapas ielādes indikators** – **`AppPageContentGate`** (`components/app/app-page-content-gate.tsx`): spinneris + **`app.page_loading`**. **`/dashboard`**, **`/analytics`** – saturs pēc **`continueDashboardBoot` / `renderAnalytics`** ar SSR bootstrap (**0.6.5**; API sync fonā); **`subtrack-page-content-ready`**. **`/settings`** – pēc preferences hydrācijas; pārējās formas – pēc klienta mount. **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**. SQL **`139_*`**, **`2026-05-29.sql`**.
- **PWA (Progressive Web App)** – instalējama **SubTrack** lietotne: Serwist SW, manifest, **`/offline`**, mobilais instalācijas banneris, admin **`/admin/pwa`**. Pilns apraksts: **[PWA (SubTrack)](#pwa-subtrack)**.
- **Native Android (Capacitor)** – Play Store gatavs **WebView** čaulis: **`https://repazy.com/login?native_shell=1`** (**`capacitor.config.ts`**). Viesiem logo / „mājas” → **`/login`**; **iziet** → **`/login?native_shell=1`** (ne `/`); **PWA instalācijas banneris** un **service worker** appā **izslēgti** (lai Capacitor plugini, piem. **launcher badge**, strādātu); **ikonas skaitlis** = tas pats kā zvans (**`@capawesome/capacitor-badge`**, **`lib/pwa/app-badge.ts`**). **Atvēršanā** – tumšs splash **`#050510`** + **`CapacitorNativeAppLoading`** (logo bez apmales, progress, **`app.page_loading`**); **Android 13+** lūdz **paziņojumu** atļauju (**`request-native-permissions.ts`**). **Logo:** panelis/PWA/favicon un atsevišķs **topbar** – **`/admin/system`**; **launcher ikona** (mipmap) – **`npm run cap:assets`** vai manuāli **`android/.../mipmap-*`**. **Mobilais panelis** – galvenokārt **`styles/`** + deploy (APK nav obligāts). Skat. **[Capacitor (Android)](#capacitor-android)**.
- **Iestatījumi** (`/settings`) – **vienota centra lapa** (**`settings-hub`**, **`settings-fs-view-client.tsx`**, platums **`--app-shell-max`**): **desktop** – divas kolonnas (preferences kreisajā; **parole** + **e-pasta paziņojumi** + **konta dzēšana** labajā); **mobilais** – preferences → parole → e-pasta prefs → konta dzēšana. Profila izvēlnē (**`nav-user-menu.tsx`**) tikai **Iestatījumi** (nav atsevišķu „Mainīt paroli” / „E-pasta paziņojumi”; demo panelis – tā pati izvēlne). **`/change-password`** (bez **`recovery=1`**) un **`/email-notifications`** → **`redirect`** uz **`/settings`**. **Preferences:** **`public.users.display_preferences`** (JSON), DB + `localStorage` (**`006_*`**); autosave (**`pushDomToast`**); valodu **`Intl.Collator`** (**`app/settings/page.tsx`**). **Saskarnes valoda** – **`applyUiLocaleInBrowser`** + **`updateSessionDisplayPreferences`** + **`router.refresh()`**. **Parole:** **`components/settings/settings-change-password-panel.tsx`**, **`ChangePasswordForm`**. **E-pasta prefs:** **`users.email_notification_preferences`**, slēdži `due_today` / `weekly` / `trial_end` (trial) / **`win_back`**; **`PATCH /api/user/email-notification-preferences`**; **`components/settings/settings-email-notifications-panel.tsx`**, footnote **`email.notifications.footnote`** (tikai automātiskā saglabāšana, bez Resend tehniskās piezīmes, SQL **`173_*`**), stili **`.email-notif-*`**, **`.settings-hub-*`**. Nedēļas e-pastā atslēgt: **`/settings?disable=weekly`**. **Konta dzēšana** (ne admin): atsevišķs bloks **`components/settings/settings-delete-account-panel.tsx`** (labā kolonna zem e-pasta prefs); apstiprinājums → iemesls → **`POST /api/user/delete-account`** (**`lib/auth/delete-user-account.ts`**, **`account_deletion_notice`**). SQL **`169_*`**, **`171_*`**. **Nav** Google piesaistes, PWA instalācijas un push slēdžu (**`SettingsConnectGoogle`**, **`PwaSettingsInstall`**, **`PwaPushSettings`** repo). E-pasta cron: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**.
- **Ģimenes dalīšana** (`/family-sharing`) – tikai ja admin **`/admin/integrations`** ieslēdz **`family_sharing`** (**`093_*`** SELECT obligāts). **`POST /api/family-sharing`**: ja adresāts **ir** `public.users` – `family_sharing_links` ar `partner_user_id`, pending tikai aplikācijā; ja **nav** – tā pati tabula ar `partner_user_id` null, ieraksts **Tavi uzaicinājumi** (statuss Gaida) + Resend **`invite_user`** no **`/admin/email-design`** (saite **`/signup?email=…`**). Ja e-pasta sūtīšana neizdodas, pending ieraksts tiek atcelts. Bez **`RESEND_API_KEY`** / **`EMAIL_FROM`** ārējam uzaicinājumam – **`family_sharing.err_email_not_configured`**. Accept/decline/revoke/leave, krāsa, **„saskaitīt kopā”** (**`095`**). Lasīšana: **RLS** (`family-sharing-server.ts`); **`PATCH`** stāvokļiem – sesija, tad **`service_role`** fallback. **`components/family-sharing/family-sharing-view.tsx`**, **`lib/family-sharing/send-family-invite-email.ts`**. **`/dashboard`**: kopīgotie ieraksti lasāmi. DB shēma **`084`–`095`** (bez jaunas migrācijas ārējam uzaicinājumam). Tulkošanas **`085_*`**, **`140_*`**.
- **Blogs** (`/blog`, `/blog/[slug]`) – **publiski** (nav `proxy` aizsargāts); admin **`/admin/blog`**: BBCode (**`lib/blog/bbcode.ts`**), rīkjosla, priekšskatījums, attēlu augšupielāde (Storage **`blog`**, **`154_*`**), YouTube. **URL** automātiski no **virsraksta** (atstarpes → `-`, unikāls ar `-2`, `-3`…). **Īss ievads (SEO)** – neobligāts; tukšs → īss fragments no satura. Publicēšanas slēdzis; melnraksts nav redzams viesiem. **Footer** saite **Blogs** (`legal.footer.blog`) tikai ja DB ir ≥1 **publicēts** ieraksts (**`hasPublishedBlogPosts`** layoutā). **SEO:** **`app/robots.ts`** – `/blog` **nav** `Disallow` (bloķēts tikai `/admin`, panelis, auth u.c. – **`lib/seo/search-crawl.ts`**); **`app/sitemap.ts`** – statisks `/blog` + dinamiski `/blog/{slug}` publicētajiem. Canonical + OG katram rakstam. SQL **`153_blog_posts.sql`**, **`154_blog_storage.sql`**; **`lib/admin/blog-actions.ts`**, **`components/admin/admin-blog-panel.tsx`**, **`components/blog/*`**. Tulkošanas **`2026-05-29.sql`**, **`fallback-phrases.ts`**.
- **Atbalsts, ieteikumi, atsauksmes** (ielogotiem) – **saturs augšā** (zem **`NavDash`**, ne footer, ne fixed): centrētas saites **`Ieteikumi · Atsauksmes · Palīdzība`**; **`AuthedContentActionLinksBar`** (**`components/authed/authed-content-action-links-bar.tsx`**, **`nav-dash.tsx`**), pogas **`authed-footer-action-links.tsx`**, modāļi caur **`AuthedNavOverlaysProvider`**. Footer vairs nerāda šos linkus. **Palīdzība** – Resend e-pasts uz **`support_contact_email`** **un** DB **`user_support_requests`** (**`174_*`**, **`lib/support/*`**). **Ieteikumi** – modālis + balsošana (**`150_*`**, **`lib/suggestions/*`**); **`is_admin > 0`** modālī var dzēst (**`deleteSuggestionAction`**). **Atsauksmes** – zvaigznes **1–5**, viens ieraksts / konts (**`151_*`**, **`152_*`**, **`lib/feedback/*`**). **Admin** – **`/admin/user-messages`**: cilnes ieteikumi / atsauksmes / atbalsts; dzēšana; atsauksmēm **Sākumlapā** toggle (**`lib/admin/admin-user-messages-*`**, **`admin-user-messages-view-dynamic.tsx`**, SQL **`174_*`**, **`175_*`**). Tulkošanas **`2026-05-29.sql`**, **`fallback-phrases.ts`**. Drošība: **`security_check.md`** (**`/admin/user-messages`**). **Resend:** **`RESEND_API_KEY`**, **`EMAIL_FROM`** (atbalsts).
- **Administrācija** (`/admin`, `/admin/users`, `/admin/languages`, `/admin/translations`, `/admin/integrations`, **`/admin/categories`**, **`/admin/blog`**, **`/admin/user-messages`**, `/admin/system`, **`/admin/email-design`**, **`/admin/cron-jobs`**, **`/admin/pwa`**, **`/admin/todos`**) - tikai ar `public.users.is_admin > 0`: paneļa josla + sānizvēlne ( **`admin.nav.user_messages`**, **`admin.nav.todos`**). **Ikonu tooltipi** admin tabulās – **`SubtrackTooltip`** (`components/subtrack-tooltip.tsx`): melns burbulis, teksts portalā uz **`document.body`** (`position: fixed`), lai **`admin-table-wrap`** `overflow` to neapgriež; burbulis paliek atvērts, kamēr kursors virs pogas vai burbuļa; uz **touch / coarse pointer** nerāda (**`useSupportsHoverTooltip`**). **Peldošie toast** – **`lib/push-dom-toast.ts`** + **`lib/dom-toast-hover-dismiss.ts`** (tā pati hover loģika kā auth **`HoverPauseToast`**). **Admin SSR dati** – plānas **`app/(app)/admin/*/page.tsx`** + **`lib/admin/admin-*-data.ts`** (`loadAdminUsersPageData`, `loadAdminSystemPageData`, integrations, languages, pwa, email-design; agrāk categories, translations, blog); mutācijas – Server Actions (`*-actions.ts`), kopīga forma – **`lib/admin/form-helpers.ts`**. **Lietotāji** – **`lib/admin/admin-users-data.ts`** + **`components/admin/admin-users-view.tsx`** (klienta): **`IERAKSTI`** kolonna rāda **kopējo abonementu skaitu** uz lietotāju (bez sadalījuma pa kategorijām); ja **`paid_plan_enabled`**, virs tabulas **kopsavilkuma bloki** (`stat-card`, **`admin-users-summary`**) – Bezmaksas / Izmēģinājums / Pro mēnesī·gads·lifetime / VIP ar skaitu; bloks redzams tikai, ja kategorijā ir ≥1 lietotājs; klikšķis filtrē tabulu (atkārtots klikšķis – visi). Kolonnas **Pro** (plāna birka: mēnesis, gads, lifetime, izmēģinājums) un **VIP** slēdzis (`users.pro_vip`, **`POST /api/admin/users/pro-vip`** – **`requireApiAdmin`**, tiešs `users.update`, **`159_*`** lauki lasāmi no DB); ja ir **`stripe_customer_id`** un nav VIP – poga **Sinhronizēt Pro no Stripe** (**`POST /api/admin/users/sync-stripe-billing`**, **`lib/billing/sync-user-billing-from-stripe.ts`** – pašreizējais Stripe stāvoklis, **ne** vecā Checkout `session_id`); saite **Dzēst** (**`POST /api/admin/users/delete`**, ne sevi / ne administratorus; **`lib/auth/delete-user-account.ts`** – Stripe, storage, ģimenes saites, `auth.admin.deleteUser`, **`retired_signup_emails`**, **`121_*`**); **Pro** vizuāli – **kronītis** pie avatāra; **Administrators** birka zem e-pasta; **`Intl`** reģistrācijas datums; **pēdējā aktivitāte** zem e-pasta (mazāks fonts, bez atsevišķas „Pēdējoreiz” kolonnas galvenē). Relatīvo **`last_seen`** tekstu **`AdminUserRegisteredDates`** rāda pēc klienta mount (**`useEffect`**). **`lib/admin/admin-users-filter.ts`**, **`lib/admin/admin-user-plan-label.ts`**, **`lib/admin/format-user-last-seen-display.ts`**. Kolonna **`public.users.last_seen`** + RPC **`touch_user_last_seen`** – SQL **`145`–`147`**, **`159_*`**. Admin kopsavilkumi (RLS + **`008`**). **Vadteksti** (īsi intro, bez tabulu `<code>` un liekiem hintiem) – **`components/admin/admin-intros.tsx`**, **`045_*`**. **Sistēma** – panelis **`AdminSystemPanel`** (tulkošanu atslēgas formas virsrakstiem un kļūdām; dažu **`<select>` opciju** iekšējā teksta vēl var atšķirties). **Sistēma** (`/admin/system`) dati: **`012_system_settings.sql`**, maksas plāns (**`027`**, gada **`101`–`103`**, lifetime **`156_*`**), **atbalsta e-pasts** (**`support_contact_email`**, **`149_*`**), **jaunu reģistrāciju** (**`signup_enabled`**, **`166_*`**, **`167_*`**), Server Actions **`lib/admin/system-actions.ts`**, **`lib/paid-plan-annual.ts`**, **`lib/paid-plan-lifetime.ts`**; **`AdminSystemPanel`** (maksas + gada + **lifetime** – cena, beigu laiks, iegādes limits – autosave). Logo: **`lib/admin/logo-actions.ts`**, **`lib/system-settings-public.ts`**. Drag-and-drop logo (**`admin-system-logo-upload.tsx`**) → Storage **`brand`**; publiski **`/brand/*`**; topbar, favicon, manifest un **`/offline`** rāda ikonu tikai ja **`logo_revision > 0`** (**`SiteBrandLogo`**, **`DashBrandLink`**). **Valodas** – CRUD pret **`public.languages`**, noklusējuma valoda jaunajiem apmeklētājiem (**`010`**; Server Actions **`lib/admin/languages-actions.ts`**, **`components/admin/admin-languages-panel.tsx`**; pamatā **`007`**); saraksta **`Intl.Collator`** – pēc pašreizējās UI lokāļa. **Integrācijas** – **`public.integrations`** (tehniska atslēga, nosaukums, `enabled`), Server Actions **`lib/admin/integrations-actions.ts`**, **`app/admin/integrations/page.tsx`**, **`components/admin/admin-integrations-panel.tsx`**; migrācija **`024_integrations.sql`**; **SELECT** visa pasaule (lasāms arī no API/feature flagām), rakstīt tikai admins; pēc mutācijas – **`revalidatePath`** arī **`/login`**, **`/signup`**, **`/dashboard`**, **`/family-sharing`**. Karodziņi: **`login_google`**, **`login_apple`** (skatīt **Autentifikācija**); **`family_sharing`** (skatīt **Ģimenes dalīšana**). **Kategorijas** (`/admin/categories`) – tabula **`public.subscription_categories`** (`category_key`, `label`, `sort_order`, `enabled`, **`usage_count`**); nosaukumi visās valodās **`site_translations`** (`subscription.category.{key}`); admin **CRUD**, **drag-and-drop** secībai (fallback, ja skaiti vienādi), jaunas kategorijas ar tulkošanas režģi (kā **`/admin/translations`**, **`admin-i18n-*`**); panelī modāļa `<select>` – popularitāte (skat. **Panelis**). SQL **`131`–`138`**. **`app/admin/categories/page.tsx`**, **`components/admin/admin-categories-panel.tsx`**, **`lib/admin/categories-actions.ts`**, **`lib/admin/category-translations-actions.ts`**, **`lib/subscriptions/subscription-categories-server.ts`**. **Tulkojumi** - **`public.site_translations`**: **`components/admin/admin-translations-panel.tsx`** + **`AdminTranslationsIntro`** (`titleActions`: poga vienā rindā ar virsrakstu); **modāļi** jaunai atslēgai un labošanai; tabulā **atslēga + teksts tikai aktīvajai UI lokālei**; **meklētājs** pilnā platuma rindā; **bez meklēšanas** papildu rindas ar **IntersectionObserver** (lazy DOM), **ar meklēšanu** filtrs pār **visu** servera ielasīto katalogu (`loadAdminTranslationsData`). Migrācija **`011`**; publiskā **SELECT** – **`012_site_translations_select_public.sql`**; sēkla – **`013_site_translations_seed_subtrack_ui.sql`**, skatīt **[UI tulkošana](#ui-tulkošana)** (**`python scripts/export_site_translations_sql.py`** pēc **`fallback-phrases.ts`** izmaiņām). **Uzdevumi** (`/admin/todos`) – **`public.admin_todos`** (`sort_order` kolonnā), SSR **`lib/admin/admin-todos-data.ts`**, Server Actions **`lib/admin/admin-todos-actions.ts`**, **`lib/admin/admin-todos-types.ts`**, Kanban **`components/admin/admin-todos-board.tsx`** (ielāde caur **`admin-todos-board-dynamic.tsx`**, `ssr: false`): divas kolonnas (**Uzdevums**, **Procesā**); **pilna platuma vilkšanas zona** ar **`fa-trash`** **virs un apakš** kolonām – ievilkta karte tiek **pabeigta** (statuss **`done`**, bez apstiprinājuma modāļa, optimistisks UI + toast); **manuāla kārtība** – velc karti **augšup/leju** (zaļa strīpa rāda ievietošanas vietu), starp kolonnām arī drag; saglabā **`sort_order`** (`reorderAdminTodosColumnAction`, `moveAdminTodoAction`). **Nav** prioritātes kārtošanas vai UI (bez birkas un formas lauka). Virsraksts + **Pievienot** vienā rindā (**`AdminTodosIntro`**). Kartītē ikonpogas (**✓** pabeigt, labot, dzēst) ar **`SubtrackTooltip`**; pabeigšana/dzēšana – apstiprinājuma **modāļi** (ne `window.confirm`); optimistisks UI. Pabeigts pazūd no dēļa; DB **`done`** dzēsts pēc **8 h**. SQL **`096`–`100`** (backfill **`100_admin_todos_sort_order_backfill.sql`**, ja vecie ieraksti ar `sort_order = 0`), tulkošanas **`admin.todos.*`**. Atšķiras **prototipa paneļu** vai citu **`components/fs/*`** vietu līmenis par fiksētām virknēm – papildināšana vienmēr ar **`t('…')`**. Admin pazīme: RLS un RPC **`current_user_is_admin`** (pēc **`023`** – **`SECURITY INVOKER`**). Piešķirt tiesības, piem.: `update public.users set is_admin = 1 where email = '...';`

### Mobilā vide (līdz ~960 px platums)

Šaurām ekrānplatēm (**≤960 px**, ieskaitot **iPhone landscape**, kur platums bieži **>768 px**) horizontālā atstarpe ir vienota caur **`--app-shell-pad-x`** (**20px**, **24px** desktop) – topbar, panelis, landing, admin, auth. Horizontālā augšējā navigācija (**`dash-nav-links`**) **nav redzama** (tikai logo + valoda / paziņojumi / profils / iziet); primārā navigācija ir **`components/mobile-bottom-nav.tsx`** + **`mobile-bottom-nav-item.tsx`** – peldoša **apakšējā navigācija** („glass” pill) ar **tikai ikonām** (bez redzama teksta zem ikonām); saites nosaukums ekrāna lasītājam – **`aria-label`** no tulkošanas (**`nav.dashboard`**, **`nav.analytics`**, u.c.). Slēpšana: **`@media (max-width: 960px)`** **`styles/subtrack.css`** beigās (iekļauts **`subtrack-app.bundle.css`** pēc **`npm run css:split`**); sākumlapai papildus **`landing.css`**. **Saskarnes valoda** – **`NavUiLanguageSwitcher`** tikai **augšējā joslā** (blakus paziņojumiem), ne apakšējā pill. **`position: fixed`** portāls uz **`document.body`** (`useLayoutEffect`, lai nav hydration kļūdu). **Panelis** mobilajā – **`dashboard-overview-main`** kolonna: virsraksts un statistika augšā, kalendārs zemāk. **≤960 px** stat kartes: **kopējā mēneša summa** | **aktīvie maksājumi** blakus (`dashboard-overview-stats-row`, `1fr 1fr`); ja ir **`monthly_budget`** un kavētie (`stat-next-pay-col--overdue`), **budžeta atlikums** | **kavētie** blakus (`dashboard-overview-right-col--has-budget`, CSS grid + `display: contents` uz stats/next-pay wrapperiem; **šodien** / **nākamais** – pilnā platumā zemāk). **Kategoriju josla** virs saraksta paslēpta (`.dashboard-category-bar`). **`dashboard-fs-view.tsx`**, **`styles/subtrack.css`** (media beigās, **`npm run css:split`**). **`.app-layout`** bez landing kājenes; **`main-content`** / **`admin-main`** – apakšējā atstarpe apakšējai joslai. **Capacitor app:** jaunā mobilā izkārtojuma CSS pietiek ar **Vercel deploy** + app restart (**[Capacitor (Android)](#capacitor-android)** → tabula **Kas mainās kur**); **APK pārbūve** nav vajadzīga, ja nemainās **`android/`** vai native plugini.

**ADMIN sadaļā** (`@media (max-width: 768px)`, `styles/subtrack.css`): izkārtojums kolonnā (`admin-body`); **`align-items: stretch`**, lai **submenu josla un galvenais saturs** aizpildītu to pašu platumu kā augšējā josla (`dash-topbar-shell`), nevis sarautos pa kreisi. Apakšizvēlne `components/admin/admin-shell.tsx` ir **horizontāli ritināma** saišu josla ar īsiem nosaukumiem, apaļām tabletēm un aktīvās sadaļas `scrollIntoView`; virsrakstā diskrēts „Ritini”, ja nepieciešams.

**`/admin/users` tabula**: ļoti šaurā skatā (**≤640 px**) kolonnas „VIP“ un „Reģistrēts“ tiek rādītas zem e‑pasta, iniciāļu aplis paslēpts (**Pro** kronītis tad zem e‑pasta); **virs 640 px** redzamas **pilnas kolonnas** un **iniciāļu aplis** ar kronīti, ja kontam ir **Pro** (apmaksāts vai VIP).

**Paziņojumi (`@media (max-width: 768px)`)** – **`public/fs/js/dash-alerts.js`** paneli pozicionē ar `position: fixed` pret viewport un platuma **clamp**, lai karte neaizslīd malā. **`components/nav-session-actions.tsx`** satur pogu **`#dash-notify-backdrop`**; kad panelis ir vaļā, tiek lietots tas pats slāņošanas modelis kā lietotāja izvēlnei (`z-index` fons **188**, karte **200**, `styles/subtrack.css`). Fona slānim ir **`backdrop-filter: blur(12px)`** (un **`prefers-reduced-motion`** – bez blur). **`components/nav-user-menu.tsx`** un **`dash-alerts.js`** savstarpēji aizver otras izvēlnes, izmantojot `CustomEvent` (`subtrack:notify-opened` / `subtrack:user-menu-opened`), lai nepārlietotu divus pilnekrāna overlay. **Visās platēm:** zvana poga strādā arī pēc React klienta navigācijas un ātrās skriptu ielādes – klikšķa delegēšana uz **`document` (capture)** un pēc ielādes **`components/authed-notify-bootstrap.tsx`** izsauc globālo **`window.fsBootDashAlerts()`**, lai sakristu ar DOM.

**PWA instalācijas banneris** – virs apakšējās navigācijas (`z-index` **185**); tikai **≤960 px** un ceļos **`/dashboard`**, **`/analytics`**, **`/settings`** (skatīt **[PWA](#pwa-subtrack)**). **Atbalsts / ieteikumi / atsauksmes** – teksta saites **saturs augšā** (centrētas zem topbar; skat. **Galvenās iespējas**), ne footer, ne apakšējā pill.

**Augšējā josla – viesa sākumlapa (≤960 px)** – **`landing.css`**: **`dash-nav-link-text`** paslēpts (**Ieiet** / **Reģistrēties** tikai ikonas); valodu pogā un **izvēlnē** kods **`EN`**, **`LV`** u.c. (**`languageCodeToUiAbbrev`**, **`nav-ui-language-switcher.tsx`**; ne 🇬🇧→„GB” Windows). **Panelis (≤520 px)** – tā pati ikonu loģika **`subtrack-app.bundle.css`**. **`aria-label`** no tulkošanas (**`nav-landing.tsx`**, **`nav-dash.tsx`**, **`mobile-bottom-nav-item.tsx`**).

**Cookie banner** – pilnekrāna scrim (blur + tumšums), karte apakšā; mobilā pogas grid (**`cookie-consent-root.tsx`**, **`styles/subtrack.css`**).

## Pieejamība un Lighthouse

| Tēma | Implementācija |
|------|----------------|
| **Viewport / tālummaiņa** | **`generateViewport()`** (`app/layout.tsx`) – **`width: device-width`**, **`initialScale: 1`**; **nav** `userScalable: false` / `maximumScale: 1` (Lighthouse pieejamība). |
| **Galvenais saturs** | **`<main id="main">`** – sākumlapa (`app/(marketing)/page.tsx`), auth (`login`/`signup`), juridiskās (`legal-document-page.tsx`), forgot-password; panelis jau **`main.main-content`** (`dashboard-fs-view.tsx`). |
| **Kontrasts** | Tumšāks **`--text-muted`** (`#475569`); akcentiem landing **`--primary-dark`**; CTA apakšvirksts bez `opacity` (`styles/subtrack.css`). |
| **Ikonas** | Font Awesome 6 no CDN – **nebloķējoša** ielāde: **`FontAwesomeDeferredHead`** (hinti) + **`next/script`** `afterInteractive` (`lib/icons/font-awesome-deferred-inject.ts`, **`app/layout.tsx`**); `noscript` fallback; ikonas īsi pēc pirmā paint (**0.4.26**). **0.4.39** – bez `<script>` React komponentā (konsoles brīdinājums). |
| **Veiktspēja** | **`/`** → **`landing.css`** (~155 KB). **`app/(app)/`** → **`subtrack-app-critical.bundle.css`** (~**102 KB**, bloķē renderi) + **`subtrack-app-deferred.bundle.css`** (~**111 KB**, **`AppDeferredStyles`**, `public/styles/`, nebloķējoši). Pilns app: **`subtrack-app.bundle.css`** (~213 KB, ģenerēts, salīdzināšanai). Avots **`styles/subtrack.css`**; **`npm run css:split`** pēc izmaiņām. **Panelis** – **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**. PSI uz **`/dashboard`**. |
| **Meklētāji (GSC)** | **`app/robots.ts`**, **`app/sitemap.ts`**, **`lib/seo/search-crawl.ts`**. Sitemap: **`/`**, demo, juridiskās, **`/blog`** + katrs publicēts **`/blog/{slug}`** (no DB). **`robots.txt`**: `Allow: /`, `Disallow` panelis/auth/admin/API – **`/blog` nav** aizliegts. Publiskajām lapām **`canonical`** + **`og:url`** pa ceļam: **`lib/seo/public-page-metadata.ts`** (`/privacy`, `/terms`, `/cookies`, `/demo/*`; blogs – **`app/(app)/blog/*`**; `/` – **`landing-seo.ts`**). Domēna verifikācija – **[Google Search Console](#google-search-console-pēc-verifikācijas)** (TXT **Porkbun**). |
| **OG / dalīšana** | Sākumlapa un share kartes: angļu **`{system_name} – subscription and recurring payment tracker`**, **`og:locale`** **`en_US`**; logo **`/brand/*`**. Apakšlapas – **`og:url`** sakrīt ar **`rel="canonical"`** (ne vairs saknes layout **`https://repazy.com`** visur). Pārbaude: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) pēc deploy („Scrape Again”). |

### Panelis un Lighthouse (mobilais)

Pēc **0.5.18** (`AppPageContentGate`) mobilajā Lighthouse (**Slow 4G**) **`/dashboard`** Performance bija **~80–85**; **0.6.5** (gate + FS) un **0.6.17** (CSS critical/deferred) mērķis **~90+** (zaļš). **Accessibility / Best Practices / SEO** parasti paliek augsti; kritiskākās metrikas ir **Speed Index** un **LCP**, ne **TBT** vai **CLS**.

| Metrika | Tipisks stāvoklis | Galvenais iemesls |
|---------|-------------------|-------------------|
| **FCP** | labs (~1.5–2 s) | topbar + spinner parādās ātri |
| **Speed Index** | vājš (bieži **>6 s**) | galvenais saturs paslēpts, kamēr ielādējas FS JS |
| **LCP** | vidējs (~2.5–3.5 s) | LCP elements kļūst redzams tikai pēc gate |
| **TBT / CLS** | parasti labi | React shell nav galvenais blokeris |

**Kāpēc gate ietekmē skaitli:** **`AppPageContentGate`** paslēpj saturu, kamēr nav **`subtrack-page-content-ready`**. **0.6.5** – gate atveras pēc **`continueDashboardBoot()`** / **`renderAnalytics()`** ar SSR bootstrap (**ne** gaida API sync); sync fonā atjauno UI.

**FS skriptu ielāde (0.6.5):** **`loadScriptsInTiers`** – prefs + **`subscriptions-data`** paralēli, tad helpers, **`dash-alerts`**; **`dashboard.js`** + **`modal-overlay-guard.js`** paralēli. **`loadScriptOnce`** – **`async`**. Palīgi: **`loadDashboardPageScripts`**, **`loadAnalyticsPageScripts`**.

**0.6.5:** gate pēc SSR bootstrap; paralēla FS ielāde; Sentry Replay lazy; **`content-visibility`** sarakstam; FA **`prefetch`**.

**0.6.17 – render-blocking CSS:** **`subtrack-app-critical`** = `core` + `shared-footer` + panelis (layout, kalendārs, stats, analītika) + apakšējā nav; **`subtrack-app-deferred`** = modāļi, admin, subscribe, legal, **`demo-app`**. **`components/app/app-deferred-styles.tsx`** (`media=print` → `all`). Samazina Lighthouse „Render-blocking requests”.

**Ko nemērīt nepareizi:** testēt **`https://repazy.com/dashboard`** (ar sesiju / inkognito ar login), ne sakni **`/`** ( **`landing.css`**, cits profils). Custom domēns vs **`*.vercel.app`** parasti **nemaina** rezultātu būtiski.

## PWA (SubTrack)

Produkta **Progressive Web App** slānis (pamats **0.3.51**–**0.3.53**; **0.4.x** līnija no **0.4.0**, agrāk žurnāls **0.3.54**).

### Tehniskā bāze

| Elements | Kur |
|----------|-----|
| Manifest | **`app/manifest.ts`** → **`/manifest.webmanifest`** |
| Service worker | **`app/sw.ts`**, build **`serwist.config.js`** → **`public/sw.js`** |
| SW reģistrācija | **`components/pwa/pwa-sw-register.tsx`** (saknes layout); **ne** Capacitor native (**`isNativeCapacitorApp`**) |
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
| Mobilais banneris | **`PwaInstallHost`** → **`PwaInstallBanner`** | **`pwa_install_banner_enabled`**, platums zem **961px**, ceļi **`/dashboard`**, **`/analytics`**, **`/settings`**, nav **standalone**, nav **Capacitor native** (`isNativeCapacitorApp`) |
| Chrome / Edge | Poga **Instalēt** | **`PwaDeferredInstallProvider`** – viens **`beforeinstallprompt`** klausītājs; **`preventDefault()`** tikai, ja rādās mobilais banneris (ceļi, nav dismiss); pēc pogas **`prompt()`** |
| iOS Safari | Teksta norāde | **`pwa.banner.ios_hint`** (bez native prompt) |

### Push paziņojumi tālrunī (0.4.8)

- **Kad sūta:** cron **`GET /api/cron/payment-push-notifications`** (tāds pats **`CRON_SECRET`** kā e-pastiem) – **viens kopsavilkums dienā** uz lietotāju, ja ir **kavētie** vai **šodien jāmaksā** (bez gaidāmo 7 dienu – kā zvana panelī bez upcoming).
- **Loģika:** **`lib/push/payment-due-alerts.ts`** + **`lib/subscriptions/due-active.ts`** (termiņš, `term_end`); „šodiena” pēc lietotāja **`display_preferences.timezone`**.
- **Ieslēgšana:** komponents **`PwaPushSettings`** (repo; **nav** `/settings` UI kopš **0.5.17**); jaunus abonementus vairs nevar ieslēgt no iestatījumiem. Esošie **`push_subscriptions`** joprojām saņem cron.
- **ENV:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (**`supabase.env.template`**; `npx web-push generate-vapid-keys`).
- **SQL:** **`081_push_subscriptions.sql`**, **`082_site_translations_push.sql`**.

### E-pasta paziņojumi (cron)

**Priekšnosacījums:** **`RESEND_API_KEY`**, **`EMAIL_FROM`**, **`SUPABASE_SERVICE_ROLE_KEY`**, **`CRON_SECRET`**. Šabloni un teksti: **`/admin/email-design`** (7 valodas), **`system_settings_email_templates`**. Deduplikācija: **`email_reminder_log`** (paplašināts ar **`123_*`**, **`155_*`**: `due_today`, `weekly_summary`, `trial_end_*`, `win_back_7d`, `win_back_30d`).

| Maršruts | Kad sūta | Lietotāja prefs | Laika josla |
|----------|----------|-----------------|-------------|
| **`GET /api/cron/due-today-payment-emails`** | Ieteicams **ik stundu** | `due_today` | **08:00** lietotāja TZ; **viens digest e-pasts dienā** ar visiem šodienas maksājumiem un kopsummu |
| **`GET /api/cron/weekly-summary-emails`** | Ieteicams **ik stundu** | `weekly` | **Pirmdiena 09:00** lietotāja TZ |
| **`GET /api/cron/trial-ending-emails`** | Ieteicams **ik stundu** | `trial_end` (tikai aktīvs trial) | **09:00** TZ; atlikušās dienas **3 / 1 / 0** |
| **`GET /api/cron/win-back-7d-emails`** | Ieteicams **ik stundu** | `win_back` | **09:00** TZ; tieši **7** kalendāra dienas bez aktivitātes (`users.last_seen`) |
| **`GET /api/cron/win-back-30d-emails`** | Ieteicams **ik stundu** | `win_back` | **09:00** TZ; tieši **30** kalendāra dienas bez aktivitātes |
| **`GET /api/cron/payment-push-notifications`** | Ieteicams **ik stundu** (dedup 1×/dienā) | Push abonements | Lietotāja TZ (skat. [PWA](#pwa-subtrack)) |

**Plānotājs (produkcija): [cron-job.org](https://cron-job.org)** – ne Vercel Hobby cron (tikai reizi dienā). **6 atsevišķi jobi**, katrs **`0 * * * *`** (UTC), metode **GET**, URL `https://<NEXT_PUBLIC_SITE_URL>/api/cron/<job-id>` (skat. tabulu augšā un **`lib/cron/cron-job-registry.ts`**). **Custom header:** `Authorization` = `Bearer <CRON_SECRET>` (**ne** token URL query). **`CRON_SECRET`:** ģenerēt `openssl rand -hex 32`, iestatīt Vercel ENV un visos 6 cron-job.org jobos. Izslēgt Vercel Dashboard cron, ja bija. Alternatīva: Vercel Pro cron ar to pašu Bearer header.

**Kalendāra datumi e-pastos** (`{DUE_DATE}`, `{TRIAL_END_DATE}`, `{LAST_SEEN_DATE}`): prioritāte **1)** `users.display_preferences` (`date_order`, `date_sep`, `timezone` no **`/settings`**), **2)** `system_settings.default_display_preferences` (**`/admin/system`**), **3)** koda noklusējums. **`formatCronEmailDate`**, **`mergeDisplayPreferencesForUser`** (`lib/user-display-preferences.ts`, `lib/cron/email-cron-common.ts`). **`/admin/email-design`** priekšskatījums bez konkrēta lietotāja rāda **sistēmas** noklusējumu (kā lietotājam bez pielāgotiem datuma laukiem). Nedēļas `{WEEK_RANGE}` – `formatWeekRangeLabel` (locale teksts). **Nedēļas kopsavilkums** (`weekly_summary`, **`lib/emails/weekly-summary-email.ts`**): **„Jāmaksā šonedēļ”** – katrs maksājums atsevišķā rindā; ja nedēļā **> 1** maksājums, virs rindām **`Kopā šonedēļ: {total} ({count} maksājumi)`** (**`email.weekly.due_week_total`**, SQL **`168_*`**). **„Gaidāmie 30 dienās”** – tikai viens kopsavilkums (kā iepriekš).

**Aizsardzība:** **`lib/security/cron-auth.ts`** – tikai `Authorization: Bearer $CRON_SECRET`; bez `?secret=` URL. Bez headera → **401**.

**Testa sūtījums (admin):** **`/admin/cron-jobs`** – **`components/admin/admin-cron-jobs-panel.tsx`**, poga **Testa sūtījums** katram darbam; serveris izsauc **`POST /api/admin/cron/run`** → iekšējs **`GET /api/cron/*?testUserId=<admin>`** ar **`Bearer CRON_SECRET`**. **Tikai pogas nospiedēja** e-pasts / push (ne visi lietotāji); testa režīmā **neieraksta** `email_reminder_log` / `push_notification_log`. Nedēļas, trial un **win-back** pievieno arī **`?force=1`**. Ja nav reālu datu, dažos darbos tiek izmantots **parauga saturs**. Plānotais cron-job.org **`testUserId` nelieto** – turp joprojām visi atbilstošie lietotāji.

**Lietotājs:** **`/settings`** (e-pasta prefs panelis) – **`components/settings/settings-email-notifications-panel.tsx`**, **`lib/emails/email-notification-preferences.ts`**. Slēdži: `due_today`, `weekly`, `trial_end` (tikai aktīvam trial), **`win_back`** (`155_*`). Noklusējums visi **ieslēgti** (`123_*`, backfill `win_back` **`155_*`**). Vecie maršruti **`/email-notifications`** → redirect.

**SQL:** **`123_email_notification_preferences.sql`**, **`124_site_translations_email_cron_notifications.sql`**, **`127_*`** (admin cron UI), **`129_*`** (teksti bez kavēto cron), **`155_win_back_emails.sql`**, **`168_site_translations_weekly_due_week_total.sql`**, **`169_site_translations_settings_delete_account.sql`**, **`170_site_translations_dashboard_empty_list_hint.sql`**, **`171_site_translations_account_deletion_reason.sql`**, **`172_site_translations_analytics_empty.sql`**, **`173_site_translations_email_notif_footnote.sql`**, tulkošanas **`database/translations_daily/2026-05-30.sql`** (`admin.cron_jobs.external_scheduler_hint`).

#### CRON_SECRET un cron-job.org (solī pa solim)

**`CRON_SECRET`** nav no Supabase vai cron-job.org – to **pats ģenerē** un glabā tikai ENV (ne Git, ne URL).

1. **Ģenerēt** (PowerShell): `openssl rand -hex 32` (vai līdzīgs nejaušs garums).
2. **Lokāli** – `.env.local`: `CRON_SECRET=<virkne>`; pārstartēt `npm run dev`.
3. **Produkcija (Vercel)** – Project → **Settings → Environment Variables** → `CRON_SECRET` = **tā pati** vērtība (Production) → **Redeploy**. Lokālais `.env.local` uz Vercel **neaug**.
4. **Pārbaude lokāli** (ne pārlūkā – tur nav `Authorization` headera):
   - Bez tokena → **401**: `curl.exe -s -w "\nHTTP: %{http_code}\n" http://localhost:3000/api/cron/due-today-payment-emails`
   - Ar tokena → **200** (vai JSON kļūda par Resend, bet **ne** 401): `curl.exe -s -w "\nHTTP: %{http_code}\n" -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/due-today-payment-emails`
5. **Admin tests** – **`/admin/cron-jobs`** → **Testa sūtījums** (serveris pats sūta Bearer).
6. **Produkcija** – tāds pats `curl.exe` ar `https://repazy.com/api/cron/...` pirms cron-job.org.
7. **[cron-job.org](https://cron-job.org)** – **6 jobi** (cron-job.org **nevar** trāpīt `localhost`; tikai publisks `NEXT_PUBLIC_SITE_URL`):

| Title (piem.) | URL (produkcija) | Schedule | Method | Custom header |
|---------------|------------------|----------|--------|---------------|
| due-today | `https://repazy.com/api/cron/due-today-payment-emails` | `0 * * * *` | GET | `Authorization`: `Bearer <CRON_SECRET>` |
| weekly | `.../api/cron/weekly-summary-emails` | `0 * * * *` | GET | (tas pats) |
| trial | `.../api/cron/trial-ending-emails` | `0 * * * *` | GET | (tas pats) |
| win-back 7d | `.../api/cron/win-back-7d-emails` | `0 * * * *` | GET | (tas pats) |
| win-back 30d | `.../api/cron/win-back-30d-emails` | `0 * * * *` | GET | (tas pats) |
| push | `.../api/cron/payment-push-notifications` | `0 * * * *` | GET | (tas pats) |

Pēc **Execute now** cron-job.org **History** jāredz **200** (ne 401/404). **Nelietot** `?secret=` vai `&CRON_SECRET=` URL – tikai header (**`lib/security/cron-auth.ts`**).

**JSON atbilde (piem. due-today):** `"sent": N` – jauni e-pasti; `"skipped": N` – jau nosūtīti šodien (`email_reminder_log` dedup) – **normāli**, ne kļūda. `"success": true` + **401 nav** = auth un maršruts OK.

**Vercel Hobby** iebūvētais cron – max reizi dienā; stundas grafikam izmanto **cron-job.org** (vai Vercel Pro ar to pašu Bearer).

### Sākuma ekrāna ikonas badge (0.4.10)

- **Zvana skaitītājs lietotnē** (`#dash-notify-badge`) un **ikonas skaitlis uz sākuma ekrāna** ir saistīti: **`dash-alerts.js`** → **`subtrackSyncLauncherBadge`** → **`window.subtrackSyncAppBadge`** → **`syncAppBadgeCount`** (**`lib/pwa/app-badge.ts`**, agrīna reģistrācija – **`lib/pwa/register-app-badge-bridge.ts`**) – kavētie + šodien + gaidāmie 7 d. + ģimenes uzaicinājumi (**bez** partnera kopīgotajiem abonementiem – **`subtrackSubscriptionsForNotifyList`**). **Pārlūks / PWA:** Badging API (`navigator.setAppBadge`). **Capacitor native:** **`@capawesome/capacitor-badge`** (**`Badge.set` / `clear`**); launcher atbalsts atkarīgs no ražotāja (emulators bieži nerāda skaitli). Iziet native app → **`/login?native_shell=1`** (ne `/`).
- **Kad atjauninās:** panelī ielādējot abonementus, pārslēdzoties atpakaļ uz lietotni (`visibilitychange`), **`subtrack:native-shell-ready`** (pēc SW notīrīšanas native čaulā), un **Web Push** cron (`badgeCount` → **`app/sw.ts`** – tikai PWA, ne native app).
- **iOS:** strādā tikai **instalētai** PWA (atvērt no sākuma ekrāna ikonas, ne Safari cilne); **iOS 16.4+**. Bez push un bez atvēršanas lietotnes ikona var palikt bez skaitļa.

**Bannera uzvedība (0.4.7; instalācijas prompt 0.4.44):**

- **X** („Ne tagad”, `pwa.banner.dismiss`) – **`localStorage`** atslēga **`subtrack_pwa_install_dismissed_v1`** ar **timestamp**; banneris atkal pēc **3 dienām** (**`PWA_INSTALL_DISMISS_COOLDOWN_MS`** – **`lib/pwa/defaults.ts`**; lasīšana **`lib/pwa/install-banner-dismiss.ts`**). Vecais ieraksts **`"1"`** tiek ignorēts (rāda banneri atkal).
- Pēc veiksmīgas instalācijas vai atteikuma dialogā – tā pati noraidīšanas atzīme (kamēr nav standalone, banneris vairs nerāda).
- **Hidrācija:** host renderē banneri tikai pēc **`mounted`** (**`pwa-install-host.tsx`**), lai serveris un klients nesadalītos.
- **Chrome konsole:** „Banner not shown… `preventDefault()`… must call `prompt()`” – samazināts: **`shouldCaptureBeforeInstallPrompt`** (**`lib/pwa/install-prompt-capture.ts`**) neuztur deferred prompt uz citām lapām / desktop; **`prompt()`** tikai no pogas; viens provider, ne divi klausītāji.
- **Capacitor native app (0.6.7+):** **`isNativeCapacitorApp()`** – banneris un **`beforeinstallprompt`** izslēgti (**`pwa-install-host.tsx`**, **`pwa-deferred-install-provider.tsx`**). **0.6.10:** **`PwaSwRegister`** nereģistrē SW; **`CapacitorNativeShellBootstrap`** atslēdz esošo SW un kešu (**`prepare-native-web-shell.ts`**) – PWA SW ar **`server.url`** bloķēja Capacitor tiltu un **launcher badge**. Pārlūkā / instalētā PWA nemainās.
- **UI:** logo no **`brandLogo`**, fons no **`pwa.background_color`** (admin; ja logo balts kvadrāts – iestati **`#ffffff`** **`/admin/pwa`**), bez atsevišķas logo ēnas; izteiktāka kartes **apmale un ēna**; stili **`styles/subtrack.css`** (`.pwa-install-*`).

### Faili (īsumā)

```
app/layout.tsx              # CapacitorNativeShellBootstrap, PwaDeferredInstallProvider, PwaInstallHost, PwaSwRegister, SubtrackIntlProvider
app/manifest.ts, app/sw.ts, app/offline/page.tsx
components/pwa/pwa-deferred-install-provider.tsx
components/pwa/pwa-sw-register.tsx
components/pwa/pwa-install-host.tsx
components/pwa/pwa-install-banner.tsx
components/pwa/pwa-settings-install.tsx
components/pwa/pwa-push-settings.tsx
components/pwa/offline-page-view.tsx, offline-wifi-icon.tsx
lib/pwa/install-prompt.ts, install-prompt-capture.ts, install-banner-dismiss.ts
lib/pwa/defaults.ts, public-pwa-settings.ts, brand-mark.tsx, app-badge.ts, register-app-badge-bridge.ts
components/capacitor/capacitor-native-shell-bootstrap.tsx
lib/capacitor/prepare-native-web-shell.ts, native-shell-storage.ts
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
4. **`/settings`** → e-pasta prefs slēdži un konta dzēšana (labā kolonna); cron testam: **`/admin/cron-jobs`** vai **`GET /api/cron/payment-push-notifications`** ar **`Authorization: Bearer $CRON_SECRET`**.
5. Mobilā: banneris, instalācija, push uz lock screen (Android/instalēta PWA; iOS atbalsts atkarīgs no Safari/PWA).
6. **Native Android app:** Android Studio + **`npx cap sync`**; UI/logika no **deploy** uz **repazy.com** (skatīt **[Capacitor (Android)](#capacitor-android)**).

## Capacitor (Android)

**Mērķis:** oficiāla **repazy** lietotne veikalā bez atsevišķa mobilā koda – **Capacitor 8** ietver **WebView**, kas rāda to pašu Next.js produkciju kā pārlūkā.

| Kas | Kur / vērtība |
|-----|----------------|
| Konfigurācija | **`capacitor.config.ts`** – `appId` **`com.repazy.app`**, `appName` **repazy**, `webDir` **`public`**, **`server.url`** **`https://repazy.com/login?native_shell=1`**, `android.backgroundColor` **`#050510`**, `plugins.Badge` (`persist: true`, `autoClear: false`), SplashScreen (**`launchAutoHide: false`**, **`#050510`**, **`splashImmersive: false`**, **`android/drawable/splash.xml`**) |
| Native projekts | **`android/`** (ģenerēts ar **`npx cap add android`**; **`MainActivity`** – `BridgeActivity`) |
| Native čaula (web) | **`?native_shell=1`** + **`sessionStorage`** **`subtrack_native_shell`**; **`CapacitorNativeShellBootstrap`** → **`prepare-native-web-shell.ts`** (SW unregister, kešu tīrīšana, iespējama **viena** pārlāde) → **`requestNativeAppPermissions()`** (paziņojumi + badge, vienu reizi sesijā) |
| Ielādes ekrāns | **`@capacitor/splash-screen`** + SSR boot overlay (**`native-shell-boot-layer.tsx`**, **`x-native-shell`**) + **`CapacitorNativeAppLoading`** – logo **`/native-shell-logo.png`**, bez pelēkā rāmja (**`.cap-native-loading-logo`**), tumšs **`#050510`**; **`hideBootOverlay()`** noņem **`native-shell-pending`** (dashboard nav melns pēc ielādes) |
| Logo (kur likt) | **Web/PWA/topbar:** **`/admin/system`** (pirmais lauks + **Topbar logo**). **Launcher ikona:** **`android/app/src/main/res/mipmap-*`** vai **`npx @capacitor/assets generate`** |
| Atpazīšana webā | **`lib/capacitor/native-app.ts`** (tilts **`Capacitor.isNativePlatform()`** + native shell session), **`use-native-capacitor-app.ts`**, **`brand-home-href.ts`** – viesiem logo / back → **`/login`**, ne **`/`**; guest landing navigācija appā paslēpta (**`nav-landing.tsx`**); **PWA instalācijas banneris** un **SW reģistrācija** izslēgti native |
| Atkarības | **`@capacitor/core`**, **`@capacitor/cli`**, **`@capacitor/android`**, **`@capacitor/splash-screen`**, **`@capawesome/capacitor-badge`**, **`@capacitor/local-notifications`** (`package.json`; `npx cap sync` pēc instalācijas) |
| Ikonas badge | **`dash-alerts.js`** → **`syncAppBadgeCount`** (**`lib/pwa/app-badge.ts`**): **`Badge.set`** (ShortcutBadger) + Android **fona** paziņojums (**`native-launcher-badge-notification.ts`**, kanāls **`repazy_launcher_badge`**, **`ic_stat_repazy`**, **`ongoing`**). **`native-launcher-badge-resync.ts`** – pēc **Home** atkārtota sinhronizācija. App **atvērts** – tikai zvans; **Home** – ikonas skaitlis, ja **paziņojumi** atļauti. **Emulators** bieži nerāda skaitli. |
| Iziet | Native: **`signOutAction`** + `native_app=1` → **`/login?native_shell=1`**; pārlūkā → **`/`**; iziet notīra badge |
| Launcher ikona (attēls) | Avots **`assets/icon.png`** (repazy „R”); **`npm run cap:assets`** → **`android/.../mipmap-*`** |

### Prasības (vienreiz)

1. **[Android Studio](https://developer.android.com/studio)** – pirmajā palaišanā **Setup Wizard** vai **SDK Manager** (SDK Platform, Build-Tools, Platform-Tools; emulatoram – **Android Emulator**).
2. SDK ceļš parasti: **`%LOCALAPPDATA%\Android\Sdk`** (Studio: **Settings → Android SDK → Android SDK Location**).
3. **Node.js** jau ir ( **`npm install`** projektā).

### Komandas (izstrāde)

**Visas komandas – tikai repozitorija saknē** (`subtrack-web`), ne no `C:\Users\Dators` vai citas mapes (citādi `npx cap sync` → `could not determine executable to run`).

```bash
cd C:\Users\Dators\subtrack-web
npm install
npx cap sync android   # pēc capacitor.config.ts, package.json vai plugin izmaiņām
npx cap open android   # atver android/ Android Studio
```

Studio: **Sync Project with Gradle Files**, tad **Run** ▶ uz emulatora vai USB telefona. Pirmais Gradle sync var ilgt **5–30 min**.

**Pēc pull ar native plugin:** `npm install` → `npx cap sync android` (jāredz `@capawesome/capacitor-badge` un `@capacitor/local-notifications` sync izvadē).

**Gradle:** ja sync kļūst ar **`proguard-android.txt`**, **`android/app/build.gradle`** release tipam jālieto **`getDefaultProguardFile('proguard-android-optimize.txt')`** (jau labots repo).

### Launcher badge – pārbaude un ierobežojumi

1. **Deploy** uz **repazy.com** (Vercel) – app ielādē JS no servera, ne no APK.
2. **`npx cap sync android`** + Studio **Run**, ja mainīts **`capacitor.config.ts`**, **`android/`** (piem. **`res/drawable/ic_stat_repazy.xml`**) vai jauns native plugin.
3. **Ielogojies** un atver **`/dashboard`** – jābūt skaitlim pie **zvana**; **pirmā atvēršana** lūdz **paziņojumu** atļauju (Android 13+). Ja noraidīts – **iestatījumi → Lietotnes → repazy → Paziņojumi** ieslēgt.
4. Nospied **Home** (app fonā) – ikonā jāparādās skaitlis vai punkts (fona paziņojums + ShortcutBadger; **≥ 0.6.15** – atkārtota sinhronizācija pēc Home).
5. **Pirmajā atvēršanā** pēc update app var **vienreiz automātiski pārlādēties** (SW notīrīšana) – normāli.

**Ja zvans rāda skaitli, bet ikonā nav:** deploy **≥ 0.6.15**, **`npx cap sync android`** + **Run** (jaunā stat ikona); pārbaudi **paziņojumu atļauju**; pēc **Home** (ne tikai app atvērts). **`await subtrackDebugLauncherBadge()`** WebView konsolē. **Emulators** – bieži **nav** skaitļa pat ar testu; pārbaudi **īstu telefonu**.

### Launcher badge – testa komandas (Chrome DevTools)

Android app ar USB / emulatoru: **Chrome** → `chrome://inspect` → WebView **inspect** → **Console** (ielogots, **`/dashboard`**):

```js
await subtrackDebugLauncherBadge()
subtrackRefreshLauncherBadge()
await subtrackTestLauncherBadge({ count: 2, overdue: 1, dueToday: 1, showNotificationWhileOpen: true })
```

Pēc testa ar `showNotificationWhileOpen` pārbaudi arī **Home** (ikonas skaitlis). Normālā plūsmā paziņojums joslā parādās tikai app **fonā**.

### Kas mainās kur

| Izmaiņu veids | Ko darīt |
|---------------|----------|
| **React/Next, badge, native shell, logo, auth UX, mobilais CSS** (`components/`, `lib/capacitor/`, `lib/pwa/`, `styles/`, `public/fs/js/dash-alerts.js`) | **Deploy** uz **repazy.com** (Vercel); pēc **`npm run css:split`** ja mainīts **`styles/subtrack.css`**. APK **nav** obligāti – app ielādē attālo URL |
| **`capacitor.config.ts`** (`server.url`, `native_shell`), native plugin, **`android/res/**` (piem. **`ic_stat_repazy.xml`**) | **`npx cap sync`** → Studio **Sync** → **Run** |
| Jaunā mašīna / SDK | Studio SDK instalācija, **`Select SDKs`** → **`…\Android\Sdk`** |

**Lokālais web test appā (reti):** īslaicīgi `server.url` uz **`http://<LAN-IP>:3000/login?native_shell=1`**, **`npx cap sync`**, `npm run dev` tīklā; produkcijā atgriezt **`https://repazy.com/login?native_shell=1`**.

**Repo:** **`android/`** commitots; **`android/.gitignore`** izslēdz kešu / ģenerētos assets. **iOS** šajā izlaidumā nav.

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | Avots: **`styles/subtrack.css`**; runtime: **`/`** → **`landing.css`** (`core`, `landing-page`, `landing-mock-panel`, `landing-shell`, `shared-footer`); pārējās → **`subtrack-app.bundle.css`** (`core`, `shared-footer`, **`demo-app`**, `subtrack-app`). **`npm run css:split`** pēc **`subtrack.css`** (**`build`** palaiž automātiski). Ja **`/demo/*`** zaudē banneri/badge stilus – pārbaudi, vai **`demo-app.css`** ( **`subtrack.css`** ~**2614–2783**) ir app bundle. `app/globals.css` – login sociālais + admin slēdzis (ārpus `subtrack.css`) |
| Ikonas | Font Awesome 6 **Free** – CDN caur **`FontAwesomeDeferredHead`** (`preload`, nebloķējošs `stylesheet`; `fa-solid` visā UI, admin, landing); daļa pogām arī **inline SVG** (piem. **`nav-dash`**, admin todos dzēst uz kartītes); **`/admin/todos`** pabeigšanai ar vilkšanu – **`fa-trash`** drop zonā. Paneļa abonementa **ikona** – kurēts **`fa-solid`** saraksts **`lib/fs-icons.ts`** (**~102** `FA_ICONS_ALL`), ne visa FA bibliotēka; [licence](https://fontawesome.com/license/free). Meklēšana: **`lib/fs-icon-picker-search.ts`**. **Neatlikt** FA ielādi bez testa – Next.js head to salauž. |
| Demo paneļi | **`lib/demo/demo-dashboard-subscriptions.ts`** (SSR parauga dati), **`lib/demo/build-demo-analytics-snapshot.ts`**; **`public/fs/js/`** – **`dashboard.js`**, **`analytics.js`**, **`dash-alerts.js`**, **`subscriptions-*`**, **`display-preferences-format.js`**, **`modal-overlay-guard.js`** (ielāde – **`load-fs-scripts.tsx`**); **`/login`** / **`/signup`** – tikai **`signup.js`**. **`/dashboard`** CRUD pret `/api/subscriptions`; **`/demo/dashboard`** – tas pats UI, bez API |

| Backend (pamats) | [Supabase](https://supabase.com) - `lib/supabase/*`, `proxy.ts`, `database/supabase/*.sql` |
| Kļūdu uzskaite | [Sentry](https://sentry.io) – org **`repazy`**, projekts **`javascript-nextjs`** (EU **`ingest.de.sentry.io`**). Pilns ceļvedis: **[Sentry (kļūdu uzskaite)](#sentry-kļūdu-uzskaite)** |
| PWA / logo | [Serwist](https://serwist.pages.dev) (`serwist.config.js`, `app/sw.ts` → `public/sw.js`); instalācijas UX – **`components/pwa/*`** (**`PwaDeferredInstallProvider`**); logo – **`sharp`** + Storage **`brand`**, URL **`/brand/*`**. Skatīt **[PWA (SubTrack)](#pwa-subtrack)** |
| Native Android | [Capacitor](https://capacitorjs.com) 8 + [**Badge**](https://capawesome.io/plugins/badge/) – **`capacitor.config.ts`**, **`android/`**, WebView → **`https://repazy.com/login?native_shell=1`**, bez PWA SW native čaulā. Skatīt **[Capacitor (Android)](#capacitor-android)** |

## Sentry (kļūdu uzskaite)

**Mērķis:** automātiski noķert klienta, servera un edge kļūdas; produkcijā – lasāmi stack traces (source maps) un e-pasta brīdinājumi (Sentry **Alerts**).

| Kas | Kur |
|-----|-----|
| SDK | `@sentry/nextjs` |
| Klienta init | `instrumentation-client.ts` (Session Replay, tracing) |
| Server / edge | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` |
| App Router globālās kļūdas | `app/global-error.tsx` |
| Build / maps | `next.config.ts` → `withSentryConfig` (`org`, `project`, `authToken`) |
| Cron check-in | `lib/cron/sentry-cron-monitor.ts` + visi `app/(app)/api/cron/*` |
| Tunelis (ad-blocker) | **`/monitoring`** tikai **produkcijā**; lokāli Sentry **izslēgts** |
| Proxy | `proxy.ts` matcher **izslēdz** `monitoring` (neiet cauri sesijas slānim) |
| Ieslēgšana | `lib/sentry/is-sentry-enabled.ts` – **`npm run dev` lokāli izslēgts** (kvota); **Vercel production** ieslēgts. Piespiedu lokāls tests: `.env.local` **`SENTRY_ENABLED=1`** |

### DSN (obligāti)

1. Sentry → **Projects** → **`javascript-nextjs`** → **Settings → Client Keys (DSN)** → **Copy** (URL ar `ingest.de.sentry.io`).
2. `.env.local` (abām rindām **tā pati** vērtība):

   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.de.sentry.io/....
   SENTRY_DSN=https://...@....ingest.de.sentry.io/....
   ```

3. **Pārstartē** `npm run dev` pēc DSN pievienošanas (`NEXT_PUBLIC_*` tiek ielasīts servera startā).

**Lokāli (`npm run dev`):** ar noklusējumu **nekas netiek sūtīts** uz Sentry (pat ar DSN `.env.local`). Kļūdas vāc tikai **produkcija** (`NODE_ENV=production` uz Vercel). Ja vajag vienreiz pārbaudīt lokāli: `SENTRY_ENABLED=1` + restart.

**Nav DSN:** `SENTRY_AUTH_TOKEN` (`sntrys_...`) – tas ir tikai source map upload, ne kļūdu sūtīšanai.

### Source maps (produkcija / Vercel)

1. [Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/) → **Create** → scope **`project:releases`** (+ **`org:read`**).
2. Vercel **Production** ENV: `SENTRY_AUTH_TOKEN` (bez `NEXT_PUBLIC_`). Lokāli (opc.): fails **`.env.sentry-build-plugin`** repo saknē (gitignore).
3. Vercel arī: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` → **Redeploy**.

### Pārbaude

| Vide | Kā |
|------|-----|
| **Lokāli** | Noklusējums: Sentry **izslēgts**. Tests: `.env.local` → `SENTRY_ENABLED=1`, restart, tad [http://localhost:3000/api/sentry-test](http://localhost:3000/api/sentry-test) → `ok: true` |
| **Produkcija** | `https://repazy.com` → DevTools Console: `allow pasting`, tad `setTimeout(() => { throw new Error("test"); }, 0);` → Issues (**production**) |
| **Cron** | Pēc cron-job.org izsaukuma – Sentry **Crons** → monitori `subtrack-cron-*` |

Ja Issues tukšs: pārbaudi DSN, dev **restart**, Network (`ingest.de` lokāli), Sentry filtrs **All environments**, inkognito (ad-blocker).

**Lighthouse:** Session Replay ielādējas **lazy** pēc idle (**`instrumentation-client.ts`**); **`replaysSessionSampleRate: 0.01`**. Skat. **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**.

Wizard (interaktīvi, opc.): `npx @sentry/wizard@latest -i nextjs --saas --org repazy --project javascript-nextjs`

## Maršrutu aizsardzība (`proxy.ts` → `lib/supabase/middleware.ts`)

- **Sesijas nav**: **`/dashboard`**, **`/analytics`**, **`/settings`**, **`/subscribe`**, **`/change-password?recovery=1`**, **`/admin`** (kopā `/admin/*`) - novirze uz **`/`**. **`/change-password`** (ielogots) un **`/email-notifications`** → **`/settings`**. **`/demo/dashboard`** un **`/demo/analytics`** ir **publiski** (demonstrācija ar parauga datiem).
- **Sesija ir**: **`/login`**, **`/signup`**, **`/forgot-password`** - novirze uz **`/dashboard`** (proxy **`GUEST_ONLY_PATHS`** iekš `lib/supabase/middleware.ts`).
- **Sesija ir + saknes `/`**: papildus **`app/(marketing)/page.tsx`** izsauc **`redirect('/dashboard')`** (sākumlapas saturs tikai viesiem).

Sesijas cookie atjaunošana arī šeit; saknes **`proxy.ts`** izsauc `updateSession`. **Bez sesijas (apzināti):** **`POST /api/stripe/webhook`** (Stripe paraksts + **`STRIPE_WEBHOOK_SECRET`**). **Sentry tunelis** `monitoring` ir **ārpus** matcher (skat. **[Sentry](#sentry-kļūdu-uzskaite)**).

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
| **`AppPageContentGate` (0.5.18+)** | **`/dashboard`**, **`/analytics`** – saturs paslēpts līdz FS boot + API sync (**`subtrackNotifyPageContentReady`**); ietekmē mobilā **Speed Index** / **LCP** (skat. **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**). |
| **FS skripti (`public/fs/js/`)** | **`loadScriptsInTiers`** + **`loadDashboardPageScripts`** / **`loadAnalyticsPageScripts`**; gate pēc bootstrap render (**0.6.5**). Skat. **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**. |

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
   # Stripe (159–160, ja paid_plan_enabled): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET – skat. Stripe (norēķini)
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
   - **`database/supabase/072_brand_storage.sql`** – Storage **`brand`** (publiska lasīšana tikai zināmiem logo failiem; **`080`** / **`164`** precizē politiku). Pēc **`071`**.
   - **`database/supabase/163_system_settings_topbar_logo.sql`** – **`topbar_logo_revision`** (atsevišķs augšējās joslas logo). Pēc **`071`**.
   - **`database/supabase/164_brand_storage_topbar_logo.sql`** – Storage **`topbar-logo.png`**. Pēc **`072`** (vai **`080`**).
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
   - **`database/supabase/127_site_translations_admin_cron_jobs.sql`** – admin **`/admin/cron-jobs`**. Pēc **`124_*`**.
   - **`database/supabase/128_security_advisor_oauth_avatar_trigger.sql`** – **`sync_public_user_avatar_from_auth`**: **revoke EXECUTE** no `anon`/`authenticated` (Advisor pēc **`125_*`**). Pēc **`125_*`**. **Leaked password** – tikai Dashboard (skat. **`080_*`**, **`022`**).
   - **`database/supabase/129_site_translations_remove_overdue_cron.sql`** – teksti pēc kavēto cron noņemšanas. Pēc **`128_*`**.
   - **`database/supabase/130_subscriptions_dynamic_carry_previous.sql`** – **`is_dynamic_carry_previous`**: ar ieslēgtu dinamisko summu pēc **„Samaksāts”** nākamajam termiņam **`due_amount_override`** no iepriekšējā perioda bāzes summas; tulkošanas modāļa slēdzim. Pēc **`066_*`**.
   - **`database/supabase/131_subscription_categories.sql`** – tabula **`subscription_categories`**, noņem fiksēto CHECK uz **`subscriptions.category`**, validācijas triggers. Pēc **`001`**.
   - **`database/supabase/132_display_preferences_monthly_budget_note.sql`** – **`monthly_budget`** JSONB atbalsts (bez jaunas kolonnas). Pēc **`006_*`**.
   - **`database/supabase/132_site_translations_admin_categories.sql`** – admin **`/admin/categories`** UI teksti. Pēc **`012`**.
   - **`database/supabase/133_site_translations_monthly_budget.sql`** – budžeta stat kartes teksti. Pēc **`012`**.
   - **`database/supabase/134_subscription_categories_usage_count.sql`** – kolonna **`usage_count`**, admin RPC **`refresh_subscription_category_usage_counts`**. Pēc **`131_*`**.
   - **`database/supabase/135_site_translations_categories_drag.sql`** – drag-and-drop hinti admin tabulā. Pēc **`012`**.
   - **`database/supabase/136_site_translations_categories_i18n_form.sql`** – daudzvalodu forma jaunai/labotai kategorijai. Pēc **`012`**.
   - **`database/supabase/137_subscription_categories_seed_extended.sql`** – papildu kategorijas (sportss, izglītība, u.c.) + tulkojumi. Pēc **`131_*`**, **`012`**.
   - **`database/supabase/138_subscription_categories_usage_sync_trigger.sql`** – automātiska **`usage_count`** sinhronizācija no **`subscriptions`**. Pēc **`134_*`**.
   - **`database/supabase/139_site_translations_app_page_loading.sql`** – **`app.page_loading`** (spinnera teksts panelī un saistītajās lapās). Pēc **`012`**.
   - **`database/supabase/140_site_translations_family_sharing_external_invite.sql`** – **`family_sharing.err_email_not_configured`** (ārējais uzaicinājums bez Resend). Pēc **`085_*`**.
   - **`database/supabase/141_site_translations_landing_family_sharing_feature.sql`** – sākumlapa: **`landing.features.cards.family_sharing.*`**, **`landing.trust.family_sharing_hint`**. Pēc **`012`**.
   - **`database/supabase/142_site_translations_landing_family_combine_hint.sql`** – **`landing.trust.family_sharing_hint`** un ģimenes kartītes teksts (kopsummās vs. tikai sarakstā). Pēc **`141_*`**.
   - **`database/supabase/143_site_translations_landing_trust_highlights.sql`** – trust bloks: **`landing.trust.label`**, **`landing.trust.payment_categories`**, **`landing.trust.categories_hint`**, **`landing.trust.email_reminders_hint`**. Pēc **`142_*`**.
   - **`database/supabase/144_site_translations_landing_pro_badge_short.sql`** – Explore analītikas kartīte: **`landing.explore.pro_in_app_badge`** → **Pro** (visās lokāļu). Pēc **`143_*`**.
   - **`database/supabase/145_users_last_seen.sql`** – kolonna **`public.users.last_seen`**, RPC **`touch_user_last_seen`** (2 min droseļu). Pēc **`015_*`**.
   - **`database/supabase/146_site_translations_users_last_seen.sql`** – **`admin.users.last_seen`**. Pēc **`145_*`**.
   - **`database/supabase/147_site_translations_users_last_seen_relative.sql`** – relatīvais **`last_seen`** admin teksts (šodien / dienas). Pēc **`146_*`**.
   - **`database/supabase/148_users_registration_country.sql`** – **`users.registration_country`**; reģistrācijas valūta pēc valsts. Pēc **`006_*`**.
   - **`database/supabase/149_system_settings_support_contact_email.sql`** – **`system_settings.support_contact_email`** (atbalsta modālis). Pēc **`012_*`**.
   - **`database/supabase/150_user_suggestions.sql`** – **`user_suggestions`**, **`user_suggestion_votes`**, RPC **`list_user_suggestions`**. Pēc **`001_*`**.
   - **`database/supabase/151_user_feedback.sql`** – **`user_feedback`**, **`approved_for_landing`**, RPC **`list_user_feedback`**, **`list_landing_feedback`**. Pēc **`150_*`** (ja sākotnēji ar thumbs-up – **`152_*`** migrē uz zvaigznēm).
   - **`database/supabase/152_user_feedback_star_rating.sql`** – **`star_rating`**, viens ieraksts / lietotājs, noņem **`user_feedback_votes`**. Pēc **`151_*`**.
   - **`database/supabase/153_blog_posts.sql`** – **`public.blog_posts`** (slug, title, excerpt, body_bbcode, publicēšana, RLS: publicētie lasāmi **anon**/**authenticated**, CRUD tikai admin). Pēc **`152_*`**.
   - **`database/supabase/154_blog_storage.sql`** – Storage **`blog`** (publiska lasīšana, augšupielāde admin; **`SUPABASE_SERVICE_ROLE_KEY`** ieteicams kā logo). Pēc **`153_*`**.
   - **`database/supabase/155_win_back_emails.sql`** – **`email_reminder_log`**: `win_back_7d`, `win_back_30d` (cron win-back). Pēc **`123_*`**.
   - **`database/supabase/156_paid_plan_lifetime.sql`** – **`system_settings`**: `paid_plan_lifetime_enabled`, `paid_plan_lifetime_price_eur`, `paid_plan_lifetime_ends_at`, `paid_plan_lifetime_purchase_limit`, `paid_plan_lifetime_purchase_count`. Pēc **`155_*`**.
   - **`database/supabase/157_site_translations_paid_plan_lifetime.sql`** – admin **`admin.forms.paid_plan_lifetime_*`**, landing **`landing.pricing.lifetime_*`**. Pēc **`156_*`** (vai **`database/translations_daily/2026-05-29.sql`** lifetime bloks).
   - **`database/supabase/158_security_advisor_categories_last_seen_feedback.sql`** – Advisor: **`validate_subscription_category_ref`** `search_path`; kategoriju usage RPC/triggeri un **`user_feedback_guard_landing_flag`** – **revoke EXECUTE** no `anon`/`authenticated`; **`refresh_*`** tikai **`service_role`**; **`touch_user_last_seen`** → **INVOKER**. Pēc **`157_*`**. **Leaked password** – Dashboard (skat. **`022`**, **`128`**).
   - **`database/supabase/159_stripe_billing_users.sql`** – **`users`**: `paid_plan_type`, `paid_plan_period_end_at`, `paid_plan_auto_renew`, `stripe_customer_id`, `stripe_subscription_id`; RLS **`users_update_own`** paplašināts (klients nevar pats mainīt maksas laukus). Pēc **`158_*`**.
   - **`database/supabase/160_site_translations_stripe_billing.sql`** – Stripe/checkout, admin lietotāju filtri, **`/subscribe/success`** (7 valodas). Pēc **`159_*`**.
   - **`database/supabase/161_private_loan.sql`** – **`subscriptions`**: privātais aizdevums (`is_private_loan`, `loan_principal`, `loan_total_repay`, `loan_payments` JSON ar datumu/summu/`paidOn`); periods **`once`**, **`is_dynamic_amount`** (Mainīt summu). Pēc **`160_*`**; tulkojumi **`database/translations_daily/2026-05-30-private-loan.sql`**.
   - **`database/supabase/162_subscription_category_private_loan.sql`** – kategorija **`private_loan`** + tulkojumi. Pēc **`161_*`**.
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

- **Lokāle** – **`resolveUiLocaleCodeForRequest`** (`lib/ui/ui-locale-from-request.ts`), izsaukts caur **`resolveRequestUiLocales`** (`lib/ui/server-ui-phrases.ts`) ar **`resolveRequestCountryCode`** (CDN / IP, **`lib/geo/resolve-request-country.ts`**) un **`pickUiLocaleFromCountryForCatalog`** (**`lib/geo/country-code-to-ui-locale.ts`**): valsts → **`languages.code`**, ja nav kartējuma vai valoda nav katalogā – **`languages.is_default`**. **Viesis:** sīkdatne **`subtrack_ui_locale`** (manuāla izvēle) → ģeo → **`Accept-Language`**. **Ielogots:** ja **`display_preferences.interface_language_user_set`** (Iestatījumi / topbar) – profila valoda; citādi ģeo → profils → **`Accept-Language`**. Reģistrācija: metadata **`interface_language_code`** + **`165_handle_new_user_geo_ui_language.sql`**. Saknes **`app/layout.tsx`**, **`HtmlLangBridge`** (viesim **`localStorage`** tikai ar sīkdatni). **`/settings`**, **`NavUiLanguageSwitcher`** – **`router.refresh()`** pēc maiņas.
- **Serveris** - saknes **`app/layout.tsx`** paraleli ielādē **`getPublicSiteTranslationsMerged(locale, defaultLocale)`** (`lib/site-translations-public.ts`, anon Supabase klients + **`unstable_cache`**, tags **`site-translations-public`**) un **`getPublicSystemSettings()`** (`lib/system-settings-public.ts`: **`systemName`**, **`brandLogo`**, **`pwa`**, display prefs, **`paidPlan`** ar **`paid_plan_*`**, **`paid_plan_annual_*`**, **`paid_plan_lifetime_*`** → **`paidPlan.lifetime`**; keša tags **`system-settings`**, versija **`subtrack-system-settings-v11`**, **`signupEnabled`**), tad ietin saturu **`SubtrackIntlProvider`** + **`NavBrandBridge`**. Paneļa lapas papildus nodod **`brand`** caur **`loadNavBrandSnapshot()`** → **`NavDash`** → **`DashBrandLink`** (vienāda SSR/hydrācija).
- **Lappušu `<title>` (App Router)** - daudzos maršrutos **`generateMetadata`** izsauc **`getUiPhraseForRequest('meta.title.*')`** (`lib/ui/server-ui-phrases.ts`; tās pašas lokāļa izvēles kā layout), piem.: **`/admin/*`**, **`/login`**, **`/signup`**, **`/dashboard`**, **`/analytics`**, **`/settings`**, **aizmirstā parole / mainīt paroli**. **Sākumlapa `/`:** angļu **`buildSiteSharePageTitle`** + **`title.absolute`** (**`lib/seo/landing-seo.ts`**). **Juridiskās un demo:** **`buildPublicPageMetadata`** – **`canonical`**, **`description`**, OG/Twitter ar pareizu URL (**`lib/seo/public-page-metadata.ts`**).
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
app/(app)/                # panelis, auth, admin – critical + deferred CSS (skat. Veiktspēja)
app/(app)/blog/           # publisks saraksts + `blog/[slug]` (BBCode → HTML)
app/(app)/admin/blog/     # admin bloga CRUD
app/(app)/admin/user-messages/  # admin: ieteikumi / atsauksmes / atbalsts (SSR + dynamic view)
app/globals.css           # `@import` `subtrack.css`; papildu CSS (login sociālais tweak, admin integrāciju slēdzis – sk. Tehniskais steks)
app/(app)/api/subscriptions/    # autentificēts CRUD (`requireApiSession`, `lib/subscriptions/subscription-map.ts`)
app/(app)/api/family-sharing/   # ģimenes dalīšana: GET/POST; PATCH `[id]` (accept, decline, revoke, leave, krāsa, combine)
app/(app)/api/billing/checkout/           # POST – Stripe Checkout Session (sesija, `paid_plan_enabled`)
app/(app)/api/billing/sync-checkout/      # POST – Pro statuss no `session_id` (sesija; Stripe API)
app/(app)/api/billing/pro-track-subscription/  # POST – kalendāra ieraksts pēc Pro (prasa `paid_plan_active`)
app/(app)/api/billing/portal/             # POST – Stripe Customer Portal URL (sesija)
app/(app)/api/stripe/webhook/             # POST – Stripe webhook (bez sesijas; `STRIPE_WEBHOOK_SECRET`)
app/(app)/subscribe/success/              # pēc Checkout + billing sync + pro-track modālis
app/(app)/api/admin/                    # `users/delete`, `users/pro-vip`, `users/sync-stripe-billing`, `cron/run`
app/family-sharing/       # lapa (integrācijas karodziņš `family_sharing`)
components/               # nav-landing, nav-dash, landing-page.tsx (SSR saturs), landing-pricing-lifetime-urgency.tsx, landing-nav-sync, mobile-bottom-nav(+item), …
components/family-sharing/  # family-sharing-view.tsx
components/legal/         # juridiskās lapas, SiteLandingFooter, LegalFooterLinks (+ Blogs, ja ir publicēti ieraksti), cookie-consent-root, cookie-settings-modal
components/blog/          # blog-index-view, blog-post-view, blog-bbcode-content
components/authed/          # authed-content-action-links-bar, authed-footer-action-links, authed-nav-overlays-provider (support + suggestions + feedback modāļi)
components/support/         # palīdzības modālis, Resend e-pasts
components/suggestions/     # ieteikumi + balsošana
components/feedback/        # atsauksmes (zvaigznes 1–5, viens ieraksts / konts)
components/subtrack-tooltip.tsx  # admin (u.c.) hover tooltipi: portal + fine-pointer; hover uz burbuļa; stili `subtrack.css`
components/flash-param-toast.tsx  # auth flash + HoverPauseToast (hover aptur auto-aizvēršanu)
lib/push-dom-toast.ts         # admin / settings toast (#toast-container)
lib/dom-toast-hover-dismiss.ts  # kopīga hover → auto-aizvēršana (arī FS showToast)
components/auth/          # auth-login-flow.tsx, auth-signup-flow.tsx; reģistrācijas forma – `components/signup-form.tsx` (autocomplete + autofill sync)
components/admin/         # admin-shell, admin-users-view, admin-todos-board-dynamic, admin-user-messages-view-dynamic, admin-categories-panel, admin-blog-panel, …
components/billing/           # `billing-subscription-modal`, `nav-user-billing-entry`, `NavUserBillingMenuItem`
components/subscribe-pro-track-prompt.tsx, subscribe-success-billing-sync.tsx
components/app/           # `app-page-content-gate.tsx` – lapas ielādes spinneris + teksts (`AppPageContentGate`)
components/fs/            # Paneļa / analītikas skati; `fs-i18n-bootstrap.tsx` – servera inlīnas `window.__SUBTRACK_*` pirms /fs/js
lib/app/                  # `page-content-ready.ts` – FS boot notikums `subtrack-page-content-ready`
components/settings/          # settings-hub paneļi: parole, e-pasta prefs, konta dzēšana
components/pro-trial/     # `pro-trial-chrome.tsx` – progress josla, Pro badge (izmēģinājums)
lib/api/                  # Route Handler boilerplate: `require-api-session`, `require-api-admin`, `parse-json-body`, `json-response`
lib/validation/           # `uuid.ts` – kopīga UUID validācija (API + admin)
lib/admin/                # Server Actions, `form-helpers.ts`, `admin-*-data.ts` (SSR admin lapām), `admin-user-messages-*`, `run-cron-job.ts`, `format-user-last-seen-display.ts`
lib/brand/                # Storage + `/brand/*` (`logo-assets.ts`, `process-logo.ts`); `nav-brand-snapshot.ts`; noklusējuma zīmols – `lib/pwa/brand-mark.tsx`
lib/pwa/                  # `app-badge.ts`, `native-launcher-badge-notification.ts`, `native-launcher-badge-cache.ts`, `native-launcher-badge-resync.ts`, `register-app-badge-bridge.ts`, `test-launcher-badge.ts`, …
lib/capacitor/            # `native-app.ts`, `prepare-native-web-shell.ts`, `native-shell-storage.ts`, `brand-home-href.ts`, `native-shell-paint-inject.ts`
components/capacitor/     # `capacitor-native-shell-bootstrap.tsx`, `native-shell-paint-guard.tsx` (inline `<script>`, ne `next/script` – React 19)
capacitor.config.ts       # `server.url`, `plugins.Badge`, SplashScreen, `appId` `com.repazy.app`
android/                  # Gradle projekts (`npx cap add android`); sync ar `npx cap sync`
components/brand/         # `site-brand-logo.tsx`, `dash-brand-link.tsx`
components/pwa/           # `pwa-deferred-install-provider`, `pwa-install-host`, `pwa-install-banner`, `pwa-settings-install`, `offline-page-view`
lib/system-name-placeholder.ts # {SYSTEM_NAME} aizvietošana `t()` ceļā
lib/paid-plan-annual.ts        # gada cena, atlaide % pret 12× mēneša, publiskais pitch (`buildPaidPlanAnnualPitchCopy`)
lib/paid-plan-lifetime.ts      # lifetime cena, laika/iegādes limits, `resolvePaidPlanLifetimePublic`, `paidPlanShowsLifetime`
lib/billing/                   # Stripe: checkout, portal, webhook; `session-billing-summary.ts` (klientam drošs); `load-session-billing-summary.ts` (SSR)
components/subscribe-pro-purchase-button.tsx  # `/subscribe` – „Iegādāties” → checkout API
lib/system-settings-public.ts  # anon kešots: nosaukums, `brandLogo`, `pwa`, `paidPlan` (+ `lifetime`), display prefs (`system-settings`)
lib/i18n/pwa-fallback-phrases.ts  # PWA + admin PWA fallback (papildus `fallback-phrases.ts`)
lib/site-translations-public.ts  # anon kešots `site_translations` merge sabiedriskajam UI
lib/ui/server-ui-phrases.ts     # `getUiPhraseForRequest`, `getUiPhrasesForRequest` (bulk), `resolveRequestUiLocales`
lib/landing/                  # `landing-phrase-keys.ts`, `get-landing-ui-phrases.ts` – sākumlapas `t()` bulk SSR
lib/demo/                     # `demo-dashboard-subscriptions.ts` (SSR parauga dati `/demo/*`), `build-demo-analytics-snapshot.ts`
lib/blog/                     # `bbcode.ts`, `slug.ts`, `blog-public.ts` (publicētie ieraksti, sitemap)
lib/seo/                      # `landing-seo.ts`, `public-page-metadata.ts`, `site-share-metadata.ts`, `search-crawl.ts` (robots + sitemap ceļi)
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
lib/subscriptions/        # `subscription-map.ts`, `private-loan.ts`, `subscription-payment.ts`, kategorijas, analytics, paid calendar
lib/security/             # `auth-rate-limit.ts`, `rate-limit-allow.ts` (opc. Upstash), `cron-auth.ts`, `server-action-rate-limit.ts`
lib/supabase/middleware.ts  # sesija, lapu aizsardzība, `/api/*` → 401 bez sesijas
security_check.md         # drošības audits, vērtējums ~9/10, Advisor checklist
lib/emails/               # admin šabloni, Resend; `account_deletion_notice`, cron: due-today/weekly/trial/win-back
lib/sentry/               # `is-sentry-enabled.ts` (lokāli off, Vercel production on)
lib/cron/                 # `email-cron-common.ts` (+ `loadServiceRoleCronContext`), `email-reminder-send.ts` (cron GET wrapper, e-pasta send/log), `run-win-back-emails.ts`, `cron-job-registry.ts`, `sentry-cron-monitor.ts`
instrumentation.ts        # Sentry server registration (`onRequestError`)
instrumentation-client.ts # Sentry browser + Session Replay
sentry.server.config.ts
sentry.edge.config.ts
app/global-error.tsx
app/(app)/api/sentry-test/  # GET – tikai development (Sentry smoke)
lib/emails/email-notification-preferences.ts
app/(app)/settings/             # preferences + parole + e-pasta prefs + konta dzēšana (settings-hub)
app/(app)/email-notifications/  # redirect → `/settings`
app/(app)/change-password/      # `recovery=1` – atjaunošana; citādi redirect → `/settings`
app/(app)/api/user/email-notification-preferences/  # PATCH prefs
app/(app)/api/user/delete-account/              # POST – pašdzēšana (`/settings`, opc. `reason`)
lib/auth/delete-user-account.ts               # kopīgs ar admin delete (Stripe, storage, family, auth)
lib/auth/send-account-deletion-notice-email.ts  # `account_deletion_notice` → support
app/(app)/admin/cron-jobs/      # admin: piespiedu cron testi
app/(app)/admin/user-messages/  # admin: lietotāju ieteikumi, atsauksmes, atbalsta pieprasījumi
app/(app)/admin/categories/     # admin: maksājumu kategoriju katalogs (CRUD, drag, i18n)
app/(app)/api/admin/cron/run/   # POST – `requireApiAdmin`
app/(app)/api/cron/             # due-today, weekly-summary, trial-ending, win-back-7d/30d, payment-push (CRON_SECRET + `createAuthorizedCronGetRoute`)
lib/integrations/       # `integration-enabled.ts`, OAuth: `login-social-flags.ts`
lib/family-sharing/     # `family-sharing-server.ts`, `send-family-invite-email.ts` (`invite_user`), tipi, dashboard bootstrap ar kopīgotajiem ierakstiem
lib/support/            # atbalsta Server Actions, Resend e-pasts + DB `user_support_requests` (`174_*`)
lib/suggestions/        # ieteikumi + balsošana (Server Actions)
lib/feedback/           # atsauksmes, `parse-star-rating.ts`, landing kešs (`landing-feedback.ts`)
lib/user-display-preferences.ts  # display_preferences; **`mergeDisplayPreferencesForUser`** (lietotājs → sistēmas defaults → kods), **`formatDateForDisplayPreferences`**
lib/languages-catalog.ts  # kešots valodu katalogs + noklusējuma `code` (caur `public-anon-client`)
lib/supabase/             # `client.ts`, `server.ts`, `service-role-client.ts`, `public-anon-client.ts`, `middleware.ts` (sesija + `/api/*` 401)
proxy.ts                  # **rate limit** auth ceļiem, tad `updateSession` + redirecti; sk. **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**
database/supabase/        # Postgres + RLS (`001` … **`175`**); Stripe **`159`–`160`**, kategorijas **`131`–`138`**, budžets **`132`–`133`**, lapas ielāde **`139`**, ģimenes ārējais uzaicinājums **`140`**, landing ģimene **`141`**, dinamiskā summa **`130`**, OAuth avatārs **`125`**, admin cron **`127`**, e-pasta prefs/cron **`123`–`124`**, Auth e-pasti **`117`–`122`**, retired signup **`119`–`120`**, PWA **`067`–`070`**, logo **`071`–`075`**, drošība **`078`–`080`**, push **`081`–`082`**, family **`084`–`095`**, todos **`096`–`100`**, Pro trial **`107`–`116`**, atbalsts DB + admin lietotāju ziņas **`174`–`175`**
serwist.config.js         # Serwist build (CommonJS; ģenerē `public/sw.js`)
scripts/                  # `export_site_translations_sql.py`; **`security-*.mjs`** (smoke, regression, migration-checklist)
public/fs/js/             # FS panelis (tikai aktīvie): `display-preferences-format.js`, `subscriptions-data.js`, `subscriptions-helpers.js`, `dash-alerts.js`, `dashboard.js`, `analytics.js`, `modal-overlay-guard.js`, `signup.js` (login/signup); ielāde – `components/fs/load-fs-scripts.tsx`. Sākumlapas anchor nav – `components/landing-nav-sync.tsx` (ne `/fs/js/`)
public/landing-coffee.svg # pricing ilustrācija (`landing-page.tsx`, `subscribe-pro-view.tsx`)
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

**Stripe (lokāli, ja testē maksājumus):** obligāti **[Stripe (norēķini)](#stripe-norēķini)** – `.env.local` + atsevišķs terminālis ar **`stripe listen`** (CLI nav daļa no `npm run dev`).

**Sentry (lokāli):** ar `npm run dev` **nekas netiek sūtīts** uz Sentry (kvota). DSN `.env.local` var palikt produkcijas deployam. Pārbaudei lokāli: `SENTRY_ENABLED=1` + restart → **`/api/sentry-test`**. Detalizēti – **[Sentry (kļūdu uzskaite)](#sentry-kļūdu-uzskaite)**.

**PWA:** izstrādē **`npm run dev`** ģenerē/uzrauga **`public/sw.js`**; pilnai instalācijas plūsmai pirms deploy – **`npm run build`**. Detalizēti – **[PWA (SubTrack)](#pwa-subtrack)**.

**Capacitor Android:** pēc **`git pull`**, ja mainīts **`capacitor.config.ts`** (piem. **`native_shell`**), **`package.json`** vai **`android/`** – no mapes **`subtrack-web`**: **`npm install`**, **`npx cap sync android`**, Studio **Sync** + **Run**. Tikai web izmaiņām (badge, native shell, iziet, logo) pietiek ar **deploy** uz **repazy.com** + app restart; jaunam plugin vai **`server.url`** – arī **sync** + **Run**. Badge: **[Capacitor → Launcher badge](#launcher-badge--pārbaude-un-ierobežojumi)**.

**Ja izstrādē konsolē vai pārlūkā parādās:** `Router action dispatched before initialization` (**`use-action-queue`**, **`hmrRefresh`**) vai **`ChunkLoadError` / `Failed to load chunk`** (`/_next/static/chunks/...`) – tipiska **Next.js 16 Turbopack** HMR / fragmentu sacīkste (parasti tikai **`next dev`** bez **`--webpack`**). **Risinājums:** apturēt serveri, izdzēst mapi **`.next`**, palaist **`npm run dev`** no jauna un **cietā pārlādēšana**; ja atkārtojas – **`npm run dev:webpack`** (stabilāks izstrādes serveris).

**Uzmanību:** nekādā **`next.config`** nelietojiet `deploymentId: process.env.X ?? ""`, ja rezultāts var būt **`""`** – tukša virkne Turbopack režīmā var salauzt hidratāciju un līdzīgas kļūdas (skat. [next.js #92858](https://github.com/vercel/next.js/issues/92858)).

**Drošība:** **`security_check.md`** (vērtējums **~9,0** repozitorijā, **~9,1** ar pilnu DB + smoke; sadaļa **`/admin/user-messages`**). **`npm run security:check`** = regresija + audit + smoke. **`npm run security:deploy-checklist`** – produkcijas soļi; **`npm run security:verify-migrations`** – pārbauda **159/161/174** kolonnas. API: middleware **401** + **`requireApiSession`** / **`requireApiAdmin`**; cron **Bearer**; rate limit auth + **`/api/*`** (iesk. **`/api/billing`**, opc. Upstash).

```bash
npm run build
npm run start
npm run lint
npm run security:check    # pēc DB / drošības izmaiņām
```

## Stripe (norēķini)

Aktivizējas tikai ar **`system_settings.paid_plan_enabled`** (admin **`/admin/system`**). Cenas Checkout sesijā tiek ņemtas no DB (**`paid_plan_price_eur`**, **`paid_plan_annual_price_eur`**, **`paid_plan_lifetime_price_eur`**), ne no fiksētiem Stripe Price ID.

### Obligātie soļi (SQL + admin)

| Solis | Darbība |
|-------|---------|
| **SQL** | Supabase SQL Editor: **`159_stripe_billing_users.sql`**, tad **`160_site_translations_stripe_billing.sql`**. |
| **Admin** | **`/admin/system`** – ieslēdz **maksas plāns** un cenas (mēnesis / gads / lifetime pēc vajadzības). |

### ENV mainīgie

| Mainīgais | Lokāli (Test mode) | Produkcija (Live mode) |
|-----------|-------------------|------------------------|
| **`STRIPE_SECRET_KEY`** | **Developers → API keys** → Secret `sk_test_...` | Tas pats, **Live** → `sk_live_...` |
| **`STRIPE_WEBHOOK_SECRET`** | **Stripe CLI** `stripe listen` izdrukā `whsec_...` (ne API keys lapa) | **Webhooks** → tavs endpoint → **Signing secret** `whsec_...` |
| **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** | Opc. `pk_test_...` | Opc. `pk_live_...` (Checkout šajā projektā iet caur serveri; **nav obligāts**) |
| **`NEXT_PUBLIC_SITE_URL`** | `http://localhost:3000` | `https://repazy.com` (Vercel Production) |

Pēc **jebkuras** `.env.local` maiņas: **pārstartē** `npm run dev`. **Nekommitē** `.env.local`. Produkcijā – Vercel ENV + **Redeploy** (skat. **[Produkcija (Live + Vercel)](#produkcija-live--vercel)**).

### Lokāla izstrāde – divi termināļi

`stripe listen` **nav** jāliek failā; to palaiž **atsevišķā** logā, kamēr darbojas lietotne.

| Terminālis | Komanda |
|------------|---------|
| **1** | `cd subtrack-web` → `npm run dev` → [http://localhost:3000](http://localhost:3000) |
| **2** | `stripe listen --forward-to localhost:3000/api/stripe/webhook` (logu **neaizver** testa laikā) |

Pirmajā reizē CLI: `stripe login` (pārlūkā apstiprina). Terminālis **2** izdrukā, piem.: `Ready! Your webhook signing secret is whsec_...` → ieliec **`STRIPE_WEBHOOK_SECRET`** → **pārstartē** termināli **1**. Ja **`listen`** palaid no jauna, `whsec_` var mainīties – atjaunini ENV un atkal restartē dev.

### Stripe CLI (Windows)

Ja komanda `stripe` nav atpazīta:

```powershell
winget install --id Stripe.StripeCli -e --accept-source-agreements --accept-package-agreements
```

Pēc instalācijas – **jauns** terminālis. Alternatīva: [stripe-cli releases](https://github.com/stripe/stripe-cli/releases/latest) (`windows_x86_64.zip`), pievienot mapi PATH.

### Testa maksājums

1. Ielogojies → **`/subscribe`** → **Iegādāties**.
2. Stripe test karte: **`4242 4242 4242 4242`**, derīgs termiņš, jebkurš CVC.
3. Terminālī **`listen`** jāparādās notikumi (piem. `checkout.session.completed`).
4. **`/subscribe/success`**; Supabase **`users`**: `paid_plan_active`, `paid_plan_type`, `stripe_customer_id` (abonementam arī `stripe_subscription_id`).

### Biežas kļūmes

| Simptoms | Risinājums |
|----------|------------|
| Checkout: „nav konfigurēts” | Trūkst **`STRIPE_SECRET_KEY`** vai nav pārstartēts dev pēc `.env.local`. |
| Maksājums izdevās, bet Pro nav | **`stripe listen`** nav palaists, nepareizs **`STRIPE_WEBHOOK_SECRET`**, vai nav restartēts dev pēc `whsec_` maiņas; atver **`/subscribe/success`** ar `session_id` URL (izsauc **sync-checkout**); admin **`/admin/users`** → **Sinhronizēt no Stripe**. |
| `stripe` nav komanda | Instalē CLI (skat. augšā). |

### Stripe Customer Portal (profila izvēlne)

1. Stripe Dashboard → **Settings → Billing → Customer portal** – ieslēdz portālu (atcelšana, kartes maiņa, rēķini pēc vajadzības).
2. Lietotājs: profila izvēlne → **Pro abonements** → modālis; **Atvērt Stripe portālu** → **`POST /api/billing/portal`** → atgriešanās **`/dashboard?billing=1`** (modālis atveras atkārtoti).
3. **VIP** – tikai info modālī; portāls nav pieejams.

### Drošība un sync (0.6.0)

- **Pro tiesības** tikai caur **`users.paid_plan_*`** (RLS – klients nevar pats uzlikt); webhook ar **`stripe-signature`**.
- **`sync-checkout`** – lasa sesiju no Stripe API, pārbauda `user_id` + apmaksu + **aktīvu** abonementu (nav vecās `cs_` replay pēc atcelšanas).
- **Admin sync** – **`sync-user-billing-from-stripe`** – tikai **pašreizējais** Stripe abonements / lifetime maksājums.

### Produkcija (Live + Vercel)

Produkcijā Stripe strādā **Live režīmā**. **`stripe listen`** un **`sk_test_` / `whsec_` no CLI** uz Vercel **nelieto**.

#### 1. Stripe konts

1. [Stripe Dashboard](https://dashboard.stripe.com/) – pabeidz **Activate account** (uzņēmums, banka), lai ieslēgtos **Live**.
2. Pārslēdz no **Test mode** uz **Live** (slēdzis augšā pie logos).

#### 2. Webhook (obligāti)

**Developers → Webhooks → Add endpoint**

| Lauks | Vērtība |
|-------|---------|
| **Endpoint URL** | `https://repazy.com/api/stripe/webhook` (ja lieto citu apex – tas pats domēns) |
| **Listen to** | **Selected events** |
| **Events** | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

Pēc saglabāšanas: atver endpoint → **Signing secret** → kopē `whsec_...` → tas ir produkcijas **`STRIPE_WEBHOOK_SECRET`** (atšķiras no lokālā CLI `listen`).

Pārbaude: pēc testa maksājuma **Webhooks → endpoint → Recent deliveries** – `checkout.session.completed` ar **200**.

#### 3. Vercel Environment Variables (Production)

| Mainīgais | Vērtība |
|-----------|---------|
| **`STRIPE_SECRET_KEY`** | Live **Secret key** `sk_live_...` (**Developers → API keys**, Live) |
| **`STRIPE_WEBHOOK_SECRET`** | `whsec_...` no **2. punkta** webhook (ne no `stripe listen`) |
| **`NEXT_PUBLIC_SITE_URL`** | `https://repazy.com` (bez `/` beigās) |

Pārējās atslēgas – kā **[Vercel un produkcijas domēns](#vercel-un-produkcijas-domēns)** un **`supabase.env.template`**. Pēc pievienošanas: **Redeploy** production.

#### 4. Supabase un SubTrack (bez tā Pro nestrādās)

| Solis | Darbība |
|-------|---------|
| SQL | **`159_stripe_billing_users.sql`**, **`160_site_translations_stripe_billing.sql`** |
| Admin | **`/admin/system`** – ieslēgts **maksas plāns** + cenas |
| Tulkošanas | **`database/translations_daily/2026-05-30.sql`**, **`2026-05-30-pro-track-prompt.sql`**, **`2026-05-30-billing-portal.sql`** (7 valodas) |

#### 5. Produkcijas pārbaude

1. `https://repazy.com` → ielogojies → **`/subscribe`** → **Iegādāties** (īsta karte Live režīmā).
2. Stripe webhook **Recent deliveries** – 200.
3. Supabase **`users`**: `paid_plan_active`, `paid_plan_type`, `stripe_customer_id` (abonementam arī `stripe_subscription_id`).
4. Ja Pro nav uzreiz: atver **`/subscribe/success`** ar `session_id` URL (fallback **sync-checkout**) vai admin **`/admin/users`** → **Sinhronizēt no Stripe**.

**Kods:** `lib/billing/*`, checkout / sync-checkout / pro-track / **portal** / webhook route. **`npm install`** ietver **`stripe`**. **VIP** (`pro_vip`) – admin dāvina Pro, **atsevišķi** no Stripe. **Customer Portal** – ieslēdz Stripe Dashboard + profila izvēlne **Pro abonements**.

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
   - Pārējās atslēgas kā lokāli: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, cron, VAPID, Stripe (**[Produkcija (Live + Vercel)](#produkcija-live--vercel)** – `sk_live_` + Live webhook `whsec_`), **`NEXT_PUBLIC_SENTRY_DSN`**, **`SENTRY_DSN`**, **`SENTRY_AUTH_TOKEN`** (source maps) u.c. (skatīt **`supabase.env.template`**, **[Sentry](#sentry-kļūdu-uzskaite)**).
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

- **`/login`** / **`/signup`** - Google poga (bez papildu norādes zem pogas). Google piesaiste notiek caur Supabase **Automatic linking** pie login (skat. tabulu augšā). **`SettingsConnectGoogle`** (`linkIdentity`) **`/settings`** noņemts (**0.5.17**); manuāla piesaiste vairs nav UI.

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

1. **Indexing → Sitemaps** – pievienot `sitemap.xml` (pilns URL: `https://repazy.com/sitemap.xml`). Ģenerē **`app/sitemap.ts`**: statiskās lapas no **`lib/seo/search-crawl.ts`** (`/`, `/demo/*`, juridiskās, **`/blog`**) + **dinamiski** katrs publicēts **`/blog/{slug}`** (no **`blog_posts`**). **`app/robots.ts`**: `Disallow` panelis, auth, **`/admin`**, API – **`/blog` nav** sarakstā (indeksējams). **`/dashboard`** / **`/analytics`** nebloķē **`/demo/*`** .
2. **Pārbaude pārlūkā:** `https://repazy.com/robots.txt` rāda `Sitemap: https://repazy.com/sitemap.xml`; `NEXT_PUBLIC_SITE_URL` produkcijā = `https://repazy.com` (bez `/` beigās). Juridiskās / demo lapās (piem. `/cookies`) – **`rel="canonical"`** un **`og:url`** uz **to pašu** ceļu (skat. **`lib/seo/public-page-metadata.ts`**).
3. **URL Inspection (ne obligāti):** augšējā GSC meklētājā ievadi **pilnu URL** (piem. `https://repazy.com/` vai `https://repazy.com/privacy`) → Enter → pagaidi pārskatu → tad var parādīties **Request indexing**. Statuss **„Discovered – currently not indexed”** ar **Last crawled: N/A** jaunam domēnam bieži nozīmē rindu, ne kļūdu. Ja pogas nav – pietiek ar sitemap; **Performance** dati parādās tikai pēc rādījumiem meklēšanā (bieži **nedēļas** jaunam domēnam).
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
3. **Supabase un ENV** – salīdzināt **`database/supabase/`** (līdz **`175_*`**: admin lietotāju ziņas **`174_*`**, **`175_*`**, e-pasta prefs footnote **`173_*`**, analītikas tukšais stāvoklis **`172_*`**, konta dzēšana **`169_*`**, **`171_*`**, panelis tukšais hints **`170_*`**, nedēļas e-pasta kopsavilkums **`168_*`**, reģistrācijas slēdzis **`166_*`**, **`167_*`**, privātais aizdevums **`161`–`162`**, Stripe **`159`–`160`**, Advisor **`158`**, lifetime Pro **`156`–`157`**, win-back **`155_*`**, blogs **`153`–`154`**, u.c.) un **`supabase.env.template`** ar **`.env.local`**. **Stripe (ja ieslēgts maksas plāns):** **`159_*`**, **`160_*`**, ENV **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`** – skatīt **[Stripe (norēķini)](#stripe-norēķini)**. **Privātais aizdevums:** **`161_private_loan.sql`**, **`162_subscription_category_private_loan.sql`**, tulkojumi **`database/translations_daily/2026-05-30-private-loan.sql`**. **Lifetime Pro:** **`156_paid_plan_lifetime.sql`**, tulkošanas **`157_*`** vai **`database/translations_daily/2026-05-29.sql`** (lifetime bloks). **Blogs:** **`153_blog_posts.sql`**, **`154_blog_storage.sql`**; attēlu augšupielādei – **`SUPABASE_SERVICE_ROLE_KEY`** (kā logo **`072`**). **Atbalsts DB:** **`174_user_support_requests.sql`**, admin UI tulkošanas **`175_*`**. **Pro trial:** **`107`–`116`**. **Drošība:** **`078`–`080`**, **`022`**, **`023`**, **`158`**. **`SUPABASE_SERVICE_ROLE_KEY`** obligāts: signup/confirm e-pasti, Pro trial RPC, VIP, cron, admin user delete, admin kategoriju usage refresh, daļa family **`PATCH`**, blog/storage (ieteicams). **Resend:** `RESEND_API_KEY`, `EMAIL_FROM`. **Cron:** `CRON_SECRET` (`.env.local` + Vercel ENV; skat. **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)** → CRON_SECRET un cron-job.org). Pēc SQL: **`npm run security:check`**. Ja mainīts **`styles/subtrack.css`**: **`npm run css:split`**. Tulkošanas: **`database/translations_daily/2026-05-29.sql`**, **`2026-05-30.sql`**, **`2026-05-30-pro-track-prompt.sql`**, **`2026-05-30-billing-portal.sql`**, **`2026-05-30-private-loan.sql`**, **`2026-05-30-missing-locales.sql`** – **vienmēr 7 valodas** (`lv`, `en`, `fr`, `de`, `es`, `pt`, `ru`; skat. **`.cursor/rules/translations-all-locales.mdc`**). Migrācijas: **Supabase iestatīšana**, **`npm run security:migration-checklist`**, **`security_check.md`**.
4. **Pārbaude** – **`npm run lint`** un **`npm run build`** pēc lielākām izmaiņām; ikdienas **`npm run dev`**. Ja mainīta drošība/DB: **`npm run security:check`**. Mobilā: PWA banneris + **`/offline`** (**[PWA](#pwa-subtrack)**). **≥0.4.22:** pēc pull pārbaudīt **Font Awesome** ikonas (admin todos ✓/rediģēt, panelis, landing); ja tukšas – **`app/layout.tsx`** nedrīkst lietot atlikto FA ielādi (`media="print"`). Turbopack **`CssSyntaxError`** uz **`landing.css`** (piem. `Unexpected }`) – vispirms **`npm run css:split`**, tad dzēst **`.next`** un restartēt dev (**0.4.38**).
5. **Produkcija (Vercel)** – ja mainīts domēns vai ENV: Vercel **Redeploy**; pārbaudīt **`NEXT_PUBLIC_SITE_URL`**, **`CRON_SECRET`**, **`STRIPE_*`** (ja Stripe), Supabase **Redirect URLs** un Porkbun DNS (skatīt **[Vercel un produkcijas domēns](#vercel-un-produkcijas-domēns)**). Cron stundai: **cron-job.org** ar Bearer header (**[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**). Ja pieslēdz **Google Search Console** – TXT **Porkbun**, pēc tam **sitemap.xml** GSC (skatīt **[Google Search Console](#google-search-console-pēc-verifikācijas)**).
6. **Capacitor Android** – ja pull satur **`capacitor.config.ts`** (`native_shell`), **`CapacitorNativeShellBootstrap`**, **`prepare-native-web-shell.ts`**, badge labojumus, **`android/`**: no **`subtrack-web`** – **`npm install`**, **`npx cap sync android`**, Studio **Run**; tikai web (badge, native shell) – **deploy** + app restart (**[Capacitor (Android)](#capacitor-android)** → **[Launcher badge](#launcher-badge--pārbaude-un-ierobežojumi)**).

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
| Admin lietotāja dzēšana | **`POST /api/admin/users/delete`** – **`lib/auth/delete-user-account.ts`** (Stripe, storage, ģimenes saites, `auth.admin.deleteUser`, **`retired_signup_emails`**) |
| Lietotāja pašdzēšana | **`POST /api/user/delete-account`** – tas pats helpers; ne administratoriem; opc. iemesls → atbalsta e-pasts |
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
npm run security:migration-checklist   # obligāto SQL saraksts (H1 + 158–162)
npm run security:deploy-checklist      # produkcijas deploy soļi (teksts)
npm run security:verify-migrations     # pēc SQL 159/161/174 (service_role)
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
- **Middleware API:** `lib/supabase/middleware.ts` – `/api/*` bez sesijas → **401** JSON (izņ. cron, dev-env-check); handleros – **`lib/api/require-api-session.ts`** / **`require-api-admin.ts`** (ne dublēt `getUser()` katrā route).
- **CSP enforce:** `next.config.ts` (`Content-Security-Policy`).

### Supabase Dashboard (manuāli)

- **Leaked password protection:** Authentication → Providers → Email (Pro plānā; Free var rādīt Advisor brīdinājumu pat pēc ieslēgšanas).
- Pēc SQL pull: **Security Advisor → Refresh**.

- `.gitignore` izslēdz `node_modules`, `.next` un līdzīgi.

## Ceļš uz backend

Paneļa **abonementu CRUD** izmanto **Supabase Postgres** (`001` → **`subscriptions`**, RLS) un **Next Route Handlers** (`app/(app)/api/subscriptions`). Kopīgais HTTP slānis – **`lib/api/`**; biznesa validācija – **`lib/subscriptions/subscription-map.ts`**. Citas funkcijas un paplašinājumi dokumentē atsevišķi. Vecāka prototipa atsauce: **`www/FS`** (īpašiem workspace gadījumiem).

## Izmaiņu žurnāls

Šeit īss pieraksts par izlaistām izmaiņām. **PWA** – **[PWA (SubTrack)](#pwa-subtrack)**. **0.4.x** no **0.4.0** (= agrāk **0.3.54**).

### 0.6.31 (2026-09-01)

- **Ikonas** – Font Awesome atgriezts parastam `<link rel="stylesheet">` root layout; aizturi ar `afterInteractive` skriptu vairs nesalauž `<i class="fa-*">` ikonas visā UI.

### 0.6.30 (2026-08-11)

- **Drošība** – konta dzēšana ar **paroles re-auth** (N2, SQL **`177_*`**); signup e-pasta enumerācija mīkstināta (bloķēts e-pasts → check-email UX; `signupEmailExistsAction` bez noplūdes); blog attēli **sharp** pārkodēti uz WebP; **CSP** paplašināts (`default-src`, `script-src`, Stripe frames, Sentry, Supabase).
- **Veiktspēja (panelis)** – ikonu/vizuālo bootstrap noņemts no SSR HTML (`GET /api/fs/icon-visual-bootstrap` pie modāļa); `DashboardFsView` props retināti; SSR kalendāra due/paid marķieri; dashboard SSR `Promise.all` paralelizācija.

### 0.6.29 (2026-08-11)

- **Drošība** – **`176_handle_new_user_signup_enabled_gate.sql`**: `signup_enabled=false` bloķē arī Auth/OAuth jauno kontu (N1); rate limit **neattiecas** uz Stripe webhook un cron; middleware **503** produkcijā bez Supabase env; family PATCH `service_role` filtri ar `invite_email` / partneri; family invite bez e-pasta orākula (`emailed` noņemts).
- **Veiktspēja (panelis)** – `dash-alerts` / modal guard **pēc** gate; API sync bez dubultā `continueDashboardBoot`, ja dati nemainās; **Cache-Control** `/fs/js/*` un `/styles/*`.
- **`security_check.md`** – N1 labots; vērtējums ~**9,2**.

### 0.6.28 (2026-08-11)

- **Atkarības – `npm audit`** – **`next`/`eslint-config-next` `16.3.0`**, **`sharp` `^0.35.3`**, **`npm audit fix`** (babel, brace-expansion, esbuild, fast-uri, js-yaml, nanoid, shell-quote, tar u.c.); **`overrides.postcss` ≥ 8.5.23**. **`npm run audit`** → **0** high+.

### 0.6.27 (2026-08-11)

- **Panelis – apmaksa bez step-scroll** – pēc **atzīmēt kā samaksātu** vairs netiek palaista „vilkšanas” animācija cauri kartēm (`renderList()` bez `scrollToItemId`).
- **Panelis – tooltipi** – FS **`data-tooltip`** rāda fixed burbuli uz **`document.body`** (`subtrackInitDataTooltipPortals`), lai overflow / blakus kartes neapgrieztu tekstu.
- **Panelis – beigušās iekārtas** – papildu uzstādījumu iekārtas ar noslēgtu termiņu (`pct >= 100`) sarakstā vairs netiek rādītas (`buildDeviceTermHtml`).

### 0.6.26 (2026-06-03)

- **Ieeja – e-pasts pēc kļūdas** – neveiksmīgā parole/e-pasts atgriež **`/login?email=`**; **`auth-login-flow.tsx`** `defaultValue` (**`signInWithPasswordAction`**).
- **Ieteikumi · Atsauksmes · Palīdzība** – no footer uz **saturs augšā** (zem **`NavDash`**, centrētas, ne fixed); **`AuthedContentActionLinksBar`**, **`nav-dash.tsx`**; footer/admin footer vairs nerāda **`showAuthedActionLinks`**.
- **Admin `/admin/user-messages`** – cilnes ieteikumi / atsauksmes (zvaigznes) / atbalsts; dzēšana; atsauksmēm **Sākumlapā** toggle. **`lib/admin/admin-user-messages-*`**, **`admin-user-messages-view-dynamic.tsx`** (`ssr: false`, kā todos). SQL **`174_user_support_requests.sql`**, **`175_site_translations_admin_user_messages.sql`**; sānizvēlne **`admin.nav.user_messages`**.
- **Palīdzība → DB** – pēc veiksmīga Resend e-pasta ieraksts **`user_support_requests`** (**`lib/support/support-actions.ts`**).
- **Ieteikumi modālī** – **`is_admin > 0`** var dzēst (**`deleteSuggestionAction`**, **`suggestions-modal.tsx`**).
- **Capacitor** – **`NativeShellPaintGuard`**: inline `<script>` (**`native-shell-paint-inject.ts`**) nevis `next/script` `beforeInteractive` (React 19 brīdinājums).
- **Drošība** – **`security_check.md`** sadaļa **`/admin/user-messages`**; regresija **L2.2b** (**`scripts/security-regression-check.mjs`**, **`security-verify-migrations.mjs`**).

### 0.6.25 (2026-06-03)

- **Reģistrācija – pārlūka parole** – **`components/signup-form.tsx`**: e-pasts **`autocomplete="username"`** (Chrome/Edge atpazīst signup formu); paroles lauki **`new-password`** + **`onInput`** un DOM sinhronizācija (`focusin`, delayed sync), lai „Ieteikt drošu paroli” / aizpildītājs aizpildītu abus laukus un **Reģistrēties** nepaliktu disabled (controlled React stāvoklis).

### 0.6.24 (2026-06-03)

- **Atlieku tīrīšana (`public/`)** – noņemti neizmantoti faili bez runtime atsaučēm: **`landing-nav.js`** (aizstāj **`components/landing-nav-sync.tsx`**), **`settings.js`** (aizstāj **`settings-fs-view`** + **`display-preferences-format.js`**), **`subscriptions-empty.js`** (dublē **`subscriptions-data.js`**); Next.js šablona SVG (**`vercel.svg`**, **`next.svg`**, **`globe.svg`**, **`file.svg`**, **`window.svg`**). **`npm run build`** ✅. Lighthouse uz **`/`** praktiski nemainās (faili netika ielādēti).

### 0.6.23 (2026-06-03)

- **SEO – canonical juridiskajām un demo** – **`lib/seo/public-page-metadata.ts`** (`buildPublicPageMetadata`): katram ceļam **`alternates.canonical`**, **`description`**, OG/Twitter ar pareizu **`og:url`** (ne saknes layout `https://repazy.com`). Lapas: **`/privacy`**, **`/terms`**, **`/cookies`**, **`/demo/dashboard`**, **`/demo/analytics`**. Blogs un `/` jau bija atsevišķi.

### 0.6.22 (2026-06-03)

- **Konta dzēšana – atsevišķs bloks** – no preferences formas izņemts; **`components/settings/settings-delete-account-panel.tsx`** otrajā kolonnā **zem e-pasta paziņojumiem** (mobilais – apakšā). Modāļi un **`POST /api/user/delete-account`** paliek tajā pašā komponentā.
- **E-pasta prefs footnote** – lietotājam tikai „Izmaiņas saglabājas automātiski.” (bez Resend tehniskās piezīmes). SQL **`173_site_translations_email_notif_footnote.sql`**.
- **Iestatījumi – e-pasta bloka UI** – kompaktāka apakšējā atstarpe settings hub kontekstā (**`.settings-hub-panel--email`**; **`npm run css:split`**).

### 0.6.21 (2026-06-03)

- **Iestatījumu centrs** – **`/settings`** apvieno preferences, **paroles maiņu** un **e-pasta paziņojumus**: desktop **2 kolonnas** (`settings-hub`, **`styles/subtrack.css`** → **`css:split`**); mobilais – viena kolonna (preferences → parole → e-pasta prefs). **`components/settings/settings-change-password-panel.tsx`**, **`settings-email-notifications-panel.tsx`**. Profila izvēlnē tikai **Iestatījumi** (**`nav-user-menu.tsx`**; demo panelis – tā pati). **`/change-password`** (ne recovery) un **`/email-notifications`** → **`redirect`** uz **`/settings`**; **`changePasswordAction`** (ielogots) → **`/settings?message=`**. Nedēļas e-pasta atslēgšana: **`/settings?disable=weekly`**. Noņemts **`email-notifications-view.tsx`**.

### 0.6.20 (2026-06-03)

- **Konta pašdzēšana** (`/settings`) – ne administratoriem: apstiprinājums → neobligāts iemesls; **`POST /api/user/delete-account`**. Kopīga **`lib/auth/delete-user-account.ts`** (Stripe atcelšana, storage, ģimenes saites, `auth.admin.deleteUser`, **`retired_signup_emails`**). Admin **`POST /api/admin/users/delete`** izmanto to pašu helperi. Ja norādīts iemesls – Resend uz **`support_contact_email`** ar šablonu **`account_deletion_notice`** (**`/admin/email-design`**, Reply-To = lietotājs). SQL **`169_*`**, **`171_*`**.
- **Panelis – tukšs stāvoklis** – bez abonementiem kalendārs un statistika ar nullēm; lielā **`#empty-state`** karte paslēpta; pelēks hints zem **„Jūsu maksājumi”** (**`fs.dashboard.empty_list_hint`**, **`dashboard-pay-calendar-initial.tsx`**, SQL **`170_*`**).
- **Analītika – tukšs stāvoklis** – bez maksājumiem paslēpts stat režģis; hints **`fs.analytics.empty_no_data`** (**`analytics-fs-view.tsx`**, **`analytics.js`**, SQL **`172_*`**).

### 0.6.19 (2026-06-03)

- **Mobilais panelis – stat kartes** – **≤960 px**: kopējā summa un aktīvie maksājumi **divās kolonnās**; ar budžetu un kavētiem – **budžeta atlikums** | **kavētie** blakus (`dashboard-overview-right-col--has-budget`, `display: contents` uz `stats-row` / `next-slot` / `stat-next-pay-grid`). Bez kavētiem budžets pilnā platumā. Kategoriju josla mobilajā paslēpta; vienādi lielāki kopsummu cipari kā „Kavētie”. **`components/fs/dashboard-fs-view.tsx`**, **`styles/subtrack.css`** → **`npm run css:split`**.

### 0.6.18 (2026-06-03)

- **Admin – jaunu reģistrāciju slēdzis** – **`/admin/system`**: **`signup_enabled`** (autosave). Izslēdzot: **`/signup`** → **`/login`**, **`NavLanding`** / landing / demo topbar bez reģistrācijas; **`signUpAction`** atgriež kļūdu; **`handle_new_user`** (**`176_*`**) bloķē arī Auth/OAuth jauno kontu. Publiski **`getPublicSystemSettings().signupEnabled`**. SQL **`166_*`**, **`167_*`**, **`176_*`**.
- **Nedēļas kopsavilkums – „šonedēļ” kopsumma** – e-pastā sadaļa **Jāmaksā šonedēļ**: ja **> 1** maksājums, rinda **`Kopā šonedēļ: … (N maksājumi)`** virs atsevišķajām rindām (**`lib/emails/weekly-summary-email.ts`**, **`email.weekly.due_week_total`**). SQL **`168_site_translations_weekly_due_week_total.sql`**.

### 0.6.17 (2026-05-31)

- **Lighthouse – render-blocking CSS** – `app/(app)/layout.tsx` importē tikai **`subtrack-app-critical.bundle.css`** (~102 KB); **`subtrack-app-deferred.bundle.css`** (~111 KB) no **`public/styles/`** caur **`AppDeferredStyles`** (preload + `media=print` onload). **`scripts/split-landing-css.mjs`**: moduļi **`subtrack-app-panel`**, **`subtrack-app-deferred`**, **`subtrack-app-shell-nav`**, **`subtrack-app-tail`**. Pilns **`subtrack-app.bundle.css`** paliek ģenerēts salīdzināšanai.

### 0.6.16 (2026-05-31)

- **UI valoda pēc valsts (VPN / IP)** – **`lib/geo/country-code-to-ui-locale.ts`**, **`resolveUiLocaleCodeForRequest`** + **`resolveRequestUiLocales`**: viesis – sīkdatne → ģeo → `Accept-Language`; ielogots bez manuālas izvēles – ģeo → profils. **`interface_language_user_set`** Iestatījumos / topbar. Reģistrācija + OAuth backfill; SQL **`165_handle_new_user_geo_ui_language.sql`**.

### 0.6.15 (2026-05-31)

- **Capacitor – launcher badge (Home)** – **`native-launcher-badge-resync.ts`** + **`native-launcher-badge-cache.ts`**: pēc **Home** atkārtoti **`Badge.set`** un fona paziņojums; stat ikona **`android/.../drawable/ic_stat_repazy.xml`**, **`ongoing: true`**. Web: deploy; **jaunā `android/res`**: **`npx cap sync android`** + **Run**. Emulators bieži nerāda skaitli.
- **Capacitor – loading logo** – noņemts pelēkais rāmis ap logo (**`.cap-native-loading-logo`**, **`styles/modules/core.css`**).
- **Capacitor – dashboard fons** – tumšs **`#050510`** tikai boot (**`native-shell-pending`**); pēc **`hideBootOverlay()`** parasts panelis.
- **PWA** – **`beforeinstallprompt`** netiek capture uz **desktop** (≥961px), lai Chrome konsolē nerādītu brīdinājumu uz **`/dashboard`**.

### 0.6.14 (2026-05-31)

- **Capacitor – repazy „R” ikona un splash** – avots **`assets/icon.png`** / **`assets/splash.png`**; **`npm run cap:assets`** (`npx @capacitor/assets`, nav repo deps – CI audit); tumšs fons **`#050510`**; WebView ielāde **`/native-shell-logo.png`**. **0.6.14+:** bez **`splashImmersive`** (Android „Viewing full screen” dialogs), tumšs WebView fons, overlay līdz login formai.
- **Capacitor – sesija + bez cookie bannera** – native app: **`@capacitor/preferences`** sesijas backup, auto cookie consent, nav GDPR modāļa; pēc restart → **`/dashboard`** ja ielogots. **`cap sync`** obligāti.
- **Capacitor – loading pirms WebView** – SSR boot overlay (`x-native-shell`, inline CSS head), native splash paslēpjas tikai kad overlay ir redzams.
- **Capacitor – ielāde, atļaujas, logo ceļi** – **`CapacitorNativeAppLoading`** (logo + progress, **`@capacitor/splash-screen`**, **`launchAutoHide: false`**); **`requestNativeAppPermissions`** pēc shell gatavs (login + dashboard). README: kur likt logo (**`/admin/system`**, mipmap).

### 0.6.13 (2026-05-31)

- **Capacitor – badge labojums + tests** – **`AuthedNotifyBootstrap`** vairs nepārraksta **`subtrackSyncAppBadge`** (payload ar tekstu vairs nedod `count: 0`). Konsole: **`subtrackTestLauncherBadge`**, **`subtrackRefreshLauncherBadge`**, **`subtrackDebugLauncherBadge`**. README testa sadaļa.

### 0.6.12 (2026-05-31)

- **Admin – atsevišķs topbar logo** – **`/admin/system`**: otra augšupielāde tikai augšējai joslai (**`topbar-logo.png`**, **`topbar_logo_revision`**); PWA/favicon logo paliek pirmajā laukā. SQL **`163_*`**, **`164_*`**, tulkošanas **`2026-05-31-topbar-logo.sql`**. Esošiem: bez topbar logo joslā joprojām **`icon-64`** (fallback).
- **Capacitor – paziņojuma teksts** – Android joslā rāda kopsavilkumu: **kavētie / šodien / gaidāmie (7 d.) / uzaicinājumi** (**`dash-alerts.js`**, **`native.launcher_notify.line_*`**, SQL **`2026-05-31-native-launcher-notify.sql`**). Deploy uz **repazy.com** (+ SQL Supabase).

### 0.6.11 (2026-05-31)

- **Capacitor – launcher badge (Pixel / AOSP)** – **`@capacitor/local-notifications`**: fona režīmā diskrēts paziņojums ar to pašu skaitli kā zvans (daudzi launcheri, ieskaitī emulatoru, rāda ikonas skaitli no **aktīvajiem** paziņojumiem, ne tikai ShortcutBadger). **`lib/pwa/native-launcher-badge-notification.ts`**, **`POST_NOTIFICATIONS`**, app priekšplānā paziņojums noņemts no joslas. Obligāti: **deploy** + **`npx cap sync android`** + **Run**; atļaut paziņojumus pirmajā reizē.

### 0.6.10 (2026-05-31)

- **Capacitor – badge + PWA SW** – **`server.url`** → **`https://repazy.com/login?native_shell=1`**; **`CapacitorNativeShellBootstrap`** + **`prepare-native-web-shell.ts`** atslēdz **service worker** un PWA kešu native čaulā (SW ar **`server.url`** bloķēja Capacitor tiltu → **`Badge`** nestrādāja). **`PwaSwRegister`** nerēģistrē SW native; **`lib/pwa/register-app-badge-bridge.ts`**, **`dash-alerts.js`** **`subtrackSyncLauncherBadge`** (retry). Iziet → **`/login?native_shell=1`**. README **[Capacitor → Launcher badge](#launcher-badge--pārbaude-un-ierobežojumi)**. Pēc pull: **Vercel deploy** + **`npx cap sync android`** + Studio **Run**; pirmajā atvēršanā iespējama **viena automātiska pārlāde**.

### 0.6.9 (2026-05-31)

- **Capacitor – launcher badge labojums** – **`lib/pwa/app-badge.ts`**: kļūda **`supported`** vietā **`isSupported`** no **`Badge.isSupported()`** – native skaitlis nekad netika iestatīts; tagad vienmēr **`Badge.set` / `clear`** (ar **`checkPermissions` / `requestPermissions`** kur pieejams). **Deploy** uz **repazy.com** + app restart (WebView ielādē JS no servera).

### 0.6.8 (2026-05-31)

- **Capacitor – launcher badge** – **`@capawesome/capacitor-badge`**; **`lib/pwa/app-badge.ts`** sinhronizē ar **`dash-alerts.js`** (tas pats `count` kā zvans); **`capacitor.config.ts`** `plugins.Badge`. Pēc pull: **`cd subtrack-web`**, **`npm install`**, **`npx cap sync android`**, Studio **Run**. Android launcher badge atbalsts atkarīgs no ražotāja.
- **Capacitor – iziet** – native app **`signOutAction`** → **`/login`** (`native_app`, **`guestEntryPath`**, **`nav-session-actions.tsx`**); iziet notīra badge.
- **README Capacitor** – `npx cap` tikai no projekta mapes; atšķirība starp **skaitļa badge** un **launcher ikonas attēlu** (mipmap).

### 0.6.7 (2026-05-31)

- **Capacitor – bez PWA instalācijas UI** – native app nerāda mobilā banneri **`PwaInstallBanner`** un neuztur **`beforeinstallprompt`** (**`isNativeCapacitorApp`** – **`lib/pwa/install-prompt-capture.ts`**, **`pwa-install-host.tsx`**, **`pwa-install-banner.tsx`**, **`pwa-deferred-install-provider.tsx`**). Deploy uz **repazy.com** pietiek (nav jauna APK).

### 0.6.6 (2026-05-31)

- **Capacitor Android (WebView)** – **`@capacitor/core`**, **`@capacitor/cli`**, **`@capacitor/android`**; **`capacitor.config.ts`** (`com.repazy.app`, **`server.url`** **`https://repazy.com/login`**, SplashScreen); **`android/`** projekts; **`android/app/build.gradle`** – **`proguard-android-optimize.txt`**. Native UX: **`lib/capacitor/*`** – viesiem logo un „mājas” → **`/login`** (**`brand-home-href.ts`**, **`NavLanding`**, legal/blog back); guest landing nav un apakšējā pill paslēpta appā. README **[Capacitor (Android)](#capacitor-android)**.

### 0.6.5 (2026-05-30)

- **Cron – šodienas maksājumu e-pasts (digest)** – **`due-today-payment-emails`** sūta **vienu e-pastu dienā** uz lietotāju ar visiem šodienas maksājumiem, rindu sarakstu un **kopsummu** (kā push digest); **08:00** lietotāja TZ (`isDueTodaySendWindow`). **`lib/emails/due-today-digest-email.ts`**, **`sendPaymentDueTodayDigestEmail`**, žurnāls `email_reminder_log` ar `subscription_id` null. Tulkojumi **`database/translations_daily/2026-05-30-due-today-digest.sql`**.
- **Lighthouse / panelis – veiktspēja** – **`AppPageContentGate`**: **`subtrackNotifyPageContentReady`** pēc **`continueDashboardBoot()`** / **`renderAnalytics()`** ar SSR bootstrap; **`subtrackSyncSubscriptionsFromApi`** un ģimenes sync **fonā** (**`public/fs/js/dashboard.js`**, **`analytics.js`**). FS ielāde: **`loadScriptsInTiers`**, **`loadDashboardPageScripts`**, **`loadAnalyticsPageScripts`**, **`async`** skripti (**`components/fs/load-fs-scripts.tsx`**). **Sentry Replay** – lazy **`@sentry/browser`**, **`replaysSessionSampleRate: 0.01`**. Mobilajā **`content-visibility`** abonementu sarakstam; FA **`prefetch`**. README **[Panelis un Lighthouse](#panelis-un-lighthouse-mobilais)**.

### 0.6.4 (2026-05-30)

- **Pro abonements – UI un izvēlne** – **`/settings`** vairs nerāda norēķinu bloku; **profila izvēlnē** **Pro abonements** (zeltaina ikona) atver modāli (2×2 kartītes, Stripe portāla poga, zils info par auto-atjaunošanu). Modālis **`createPortal`** uz `document.body` (nav iekš dropdown). **`POST /api/billing/portal`**, atgriešanās **`/dashboard?billing=1`**. Stili tikai **`styles/subtrack.css`** → **`npm run css:split`** (`.billing-subscription-*`, `.dash-user-dropdown-item--pro`).
- **Hydrācija – zīmols** – **`DashBrandLink`** vairs nelieto `useSubtrackIntl` logo/nosaukumam; **`loadNavBrandSnapshot()`** + `brand` props no servera lapām (**`dashboard`**, **`analytics`**, **`settings`**, **`admin`**, **`demo`**). Kešs **`subtrack-system-settings-v9`**. **`lib/brand/nav-brand-snapshot.ts`**, **`load-session-billing-summary.ts`** (atdalīts no klienta importiem).
- **README – Lighthouse / panelis** – jauna sadaļa **[Panelis un Lighthouse (mobilais)](#panelis-un-lighthouse-mobilais)**: **`AppPageContentGate`**, FS skriptu ķēde, API sync pirms gate, ieteicamā optimizācijas secība; papildināts **[Pieejamība un Lighthouse](#pieejamība-un-lighthouse)**, **[Navigācija un veiktspēja](#navigācija-un-veiktspēja-kopīgas-sajūtas)**, **[Sentry](#sentry-kļūdu-uzskaite)**.

### 0.6.3 (2026-05-30)

- **Dashboard – privātais aizdevums (UX)** – vienkārša forma: aizņemtā summa, kopā atmaksājam, nākamais maksājums; **Mainīt summu** pirms apmaksas; progress **`€samaksāts / €kopā`**; automātisks nākamais termiņš. **`lib/subscriptions/private-loan.ts`**, **`dashboard.js`**, tulkojumi **`2026-05-30-private-loan.sql`**.

### 0.6.2 (2026-05-30)

- **Pro abonements (sākums)** – modālis un **`POST /api/billing/portal`**; sākotnēji **`/settings`** (aizstāts ar izvēlni **0.6.4**). **`components/billing/*`**, **`lib/billing/*`**, **`2026-05-30-billing-portal.sql`**. Stripe: **Customer portal**.
- **Drošība – deploy** – **`security_check.md`** atjaunināts (2026-05-30); regresijas skripts atpazīst **`requireApiSession`** / **`requireApiAdmin`**; rate limit **`/api/billing`**, **`/api/user`**, catch-all **`/api`**; jauni skripti **`security:deploy-checklist`**, **`security:verify-migrations`**; migrāciju checklist paplašināts ar **158–162**.
- **Dashboard – privātais aizdevums (sākums)** – kategorija **`private_loan`**: DB lauki, progress josla, „Samaksāts”. SQL **`161_private_loan.sql`**, **`162_subscription_category_private_loan.sql`**. Detalizēta UX – **0.6.3**.

### 0.6.1 (2026-05-30)

- **README – Stripe produkcija** – jauna sadaļa **[Produkcija (Live + Vercel)](#produkcija-live--vercel)**: Live konts, webhook URL + 3 notikumi, Vercel ENV (`sk_live_`, Live `whsec_`), SQL/admin, pārbaude; ENV tabula Test vs Live.

### 0.6.0 (2026-05-30)

- **Stripe Pro pēc apmaksas** – **`grantProFromCheckoutSession`** (`lib/billing/verify-checkout-grant.ts`): apmaksa + aktīvs/trial abonements; **`POST /api/billing/sync-checkout`** + **`SubscribeSuccessBillingSync`** uz **`/subscribe/success`** (retry, ja webhook kavējas).
- **Pro kalendāra ieraksts** – modālis pēc mēneša/gada checkout (**`SubscribeProTrackPrompt`**, **`POST /api/billing/pro-track-subscription`**); prasa apmaksātu Pro; SQL/tulkojumi **`2026-05-30-pro-track-prompt.sql`**.
- **Stripe drošība** – nav `paid_plan_active` bez Stripe verifikācijas; **`sync-checkout`** neļauj vecās `session_id` replay; **`pro-track`** tikai ar **`paid_plan_active`** / VIP.
- **Admin Stripe sync** – **`/admin/users`**: poga sinhronizācijai (**`POST /api/admin/users/sync-stripe-billing`**, **`sync-user-billing-from-stripe.ts`**) – pašreizējais Stripe stāvoklis (atceltam lietotājam izslēdz Pro, ja nav aktīva abonementa).
- **Admin todos** – SSR dati **`admin-todos-data.ts`** (ne no `"use server"` faila); Kanban **`admin-todos-board-dynamic.tsx`** (`ssr: false`) – novērš bundļu kļūdu uz dashboard.
- **Tulkojumi** – **`database/translations_daily/2026-05-30.sql`** (sync-checkout, admin stripe sync; **7 valodas**); noteikums **`.cursor/rules/translations-all-locales.mdc`**.

### 0.5.42 (2026-05-30)

- **README – Stripe lokāli** – paplašināta **[Stripe (norēķini)](#stripe-norēķini)**: kur ņemt `sk_test_` / `whsec_`, **divi termināļi** (`npm run dev` + `stripe listen`), Windows CLI (`winget`), testa karte, biežas kļūmes; **Palaišana lokāli** un Vercel ENV atsauce.

### 0.5.41 (2026-05-30)

- **Admin `/admin/users`** – maksas plāna kopsavilkuma **bloki** virs tabulas (`stat-card`, skaits + filtrs); bloki tikai, ja kategorijā ir lietotāji; noņemtas filtra pogas; kolonna **Pro** ar plāna birku; **VIP** API – tiešs `users.update` (ne `admin_set_user_pro_vip` RPC). **`lib/admin/admin-users-filter.ts`**, **`admin-user-plan-label.ts`**, **`styles/modules/subtrack-app.css`**.

### 0.5.40 (2026-05-30)

- **Sentry lokāli izslēgts** – `lib/sentry/is-sentry-enabled.ts`: `enabled: false` pie `npm run dev` (kvota); produkcijā kā iepriekš. Cron monitori un `/api/sentry-test` respektē to pašu; piespiedu tests: **`SENTRY_ENABLED=1`**. README **[Sentry](#sentry-kļūdu-uzskaite)**.
- **Stripe norēķini** – SQL **`159_stripe_billing_users.sql`**, **`160_site_translations_stripe_billing.sql`**; **`POST /api/billing/checkout`**, **`POST /api/stripe/webhook`** (publisks ceļš); **`/subscribe/success`**, **`SubscribeProPurchaseButton`**; ENV **`STRIPE_*`** (`supabase.env.template`). **`lib/billing/*`**, **`npm install stripe`**. Ceļvedis README **[Stripe (norēķini)](#stripe-norēķini)**.

### 0.5.39 (2026-05-30)

- **Refaktors – dublētas funkcijas** – kopīgs **`lib/api/`** (sesija, admin, JSON, UUID, atbildes); **`lib/admin/form-helpers.ts`**, **`lib/admin/admin-*-data.ts`** (system, integrations, languages, pwa, email-design, users); **`lib/subscriptions/parse-interface-locale.ts`**, **`lib/supabase/public-anon-client.ts`**, **`lib/cron/email-reminder-send.ts`** (cron route wrapper + e-pasta send/log); FS **`public/fs/js/display-preferences-format.js`**. API route un cron handleri pārslēgti uz helperiem.
- **README** – **Struktūra**, ievads, admin SSR datu loaderi, **`lib/api/`** / middleware / Ceļš uz backend.

### 0.5.38 (2026-05-30)

- **README – Sentry** – jauna sadaļa **[Sentry (kļūdu uzskaite)](#sentry-kļūdu-uzskaite)**: DSN (`ingest.de`), ENV, Vercel, pārbaude (`/api/sentry-test`, Issues), cron monitori; **Tehniskais steks**, **Palaišana lokāli**, **Vercel**, **Struktūra**, **proxy** (`monitoring` izņēmums). Kods: tunelis **`/monitoring`** tikai produkcijā; **`app/(app)/api/sentry-test/route.ts`** (dev); `instrumentation-client.ts` – `debug` development.

### 0.5.37 (2026-05-30)

- **README – cron uzstādīšana** – sadaļa **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**: soli pa solim `CRON_SECRET` (`.env.local` + Vercel ENV), `curl` pārbaude, cron-job.org tabula (6 jobi), `sent`/`skipped` interpretācija; brīdinājums par URL tokeniem un localhost.

### 0.5.36 (2026-05-30)

- **Sentry** (skill **`sentry-nextjs-sdk`**): kļūdas + tracing + **Session Replay** (`replayIntegration`), server **`includeLocalVariables`**, `next.config.ts` – **`authToken`**, tunnel **`/monitoring`**, **`proxy.ts`** izslēdz `monitoring`; **Cron Monitors** – `lib/cron/sentry-cron-monitor.ts` + visi **`/api/cron/*`**. ENV: **`NEXT_PUBLIC_SENTRY_DSN`**, **`SENTRY_DSN`**, build **`SENTRY_AUTH_TOKEN`** (`.env.sentry-build-plugin`). Pārbaude: īslaicīga kļūda API/route → [Issues](https://sentry.io/issues/).

### 0.5.35 (2026-05-30)

- **Cron plānotājs** – produkcija: **cron-job.org** (6 jobi, `0 * * * *` UTC, `Authorization: Bearer CRON_SECRET`); README, **`supabase.env.template`**, **`/admin/cron-jobs`** norāde; **`lib/security/cron-auth.ts`** `timingSafeEqual`. Tulkošanas **`database/translations_daily/2026-05-30.sql`**. Vercel Hobby built-in cron nav nepieciešams.

### 0.5.34 (2026-05-30)

- **Security Advisor** – SQL **`158_security_advisor_categories_last_seen_feedback.sql`**: `validate_subscription_category_ref` `search_path`; kategoriju usage un feedback triggeri – revoke EXECUTE no `anon`/`authenticated`; `refresh_subscription_category_usage_counts` tikai `service_role` (`subscription-categories-server.ts`); `touch_user_last_seen` → SECURITY INVOKER. **`security_check.md`**.

### 0.5.33 (2026-05-29)

- **Admin cron testi** – **`/admin/cron-jobs`**: poga **Testa sūtījums** sūta **tikai admina** e-pastu / push (`testUserId`); neieraksta dedup žurnālā; paraugu dati, ja nav reālu. **`lib/cron/cron-admin-test.ts`**, visi **`/api/cron/*`**, **`lib/admin/run-cron-job.ts`**. Tulkošanas **`database/translations_daily/2026-05-29.sql`**.
- **Lifetime / Pro cenu UI** – sākumlapa **`#pricing`** un **`/subscribe`**: lifetime ar **live countdown** (max platums, centrēts), **atlikušo vietu** badge (desktop – kartes augšējā labajā; mobile – centrēts, `margin-top: 20px`); landing – **„One-time”** badge aiz cenas (**`landing-pricing-lifetime-price-group`**), tagline **vienā rindā**. **`/subscribe`**: ar **`paid_plan_annual_enabled`** cenas bloks kā landing (**mēneša pill** + **gada karte**); **`subscribe-pro-plans-stack`** – vienādas atstarpes starp plānu blokiem mobilajā. Avots **`styles/subtrack.css`** (+ **`npm run css:split`**). **`components/subscribe-pro-view.tsx`**, **`components/landing-page.tsx`**, **`components/landing-pricing-lifetime-urgency.tsx`**, **`app/(app)/subscribe/page.tsx`**.

### 0.5.32 (2026-05-29)

- **E-pasta datumu formāts** – cron un admin priekšskatījums: lietotāja **`display_preferences`** pār sistēmas **`default_display_preferences`** (`mergeDisplayPreferencesForUser`, `formatCronEmailDate`). **`/admin/email-design`**: `system_settings` noklusējums + `email-design-preview-dates.ts`. Šabloni **`win_back_7d`**, **`win_back_30d`**. Faili: **`lib/cron/email-cron-common.ts`**, **`lib/emails/preview-context.ts`**, **`components/admin/admin-email-design-panel.tsx`**.

### 0.5.31 (2026-05-29)

- **Lifetime Pro** – admin **`/admin/system`**: slēdzis (tikai ar maksas plānu), **lifetime cena EUR**, neobligāts **beigu datums/laiks** un/vai **iegādes limits**; piedāvājums pazūd, kad beidzas laiks **vai** sasniegts limits (`paid_plan_lifetime_purchase_count` ≥ limit). Sākumlapa **`#pricing`** un **`/subscribe`**: trešā karte ar cenu, **live countdown** un/vai **`{count} spots left`**. **`156_paid_plan_lifetime.sql`**, **`157_site_translations_paid_plan_lifetime.sql`**, **`lib/paid-plan-lifetime.ts`**, **`lib/system-settings-public.ts`** (`paidPlan.lifetime`), **`components/admin/admin-system-panel.tsx`**, **`components/landing-page.tsx`**, **`components/landing-pricing-lifetime-urgency.tsx`**, **`components/subscribe-pro-view.tsx`**, **`styles/subtrack.css`**, **`fallback-phrases.ts`**, **`database/translations_daily/2026-05-29.sql`**. *Checkout vēl nav – `purchase_count` palielinās manuāli DB vai nākotnes API.*

### 0.5.30 (2026-05-29)

- **Win-back e-pasti** – cron **`GET /api/cron/win-back-7d-emails`**, **`GET /api/cron/win-back-30d-emails`** (neaktīvs tieši 7 / 30 kalendāra dienas, `users.last_seen`, 09:00 lietotāja TZ). Admin šabloni **`win_back_7d`**, **`win_back_30d`** (`/admin/email-design`). Prefs **`win_back`** (`/settings`). SQL **`155_*`**, tulkošanas **`database/translations_daily/2026-05-29.sql`**, **`lib/cron/run-win-back-emails.ts`**.

### 0.5.29 (2026-05-29)

- **Blogs (labojumi)** – admin forma bez atsevišķa slug lauka (URL no virsraksta); **ievads (SEO)** neobligāts; admin UI kā **`/admin/todos`** (`btn btn-primary`, modālis ar `modal-overlay open`). SEO dokumentācija: **`robots.txt`** neliedz `/blog`; sitemap + publicētie slug. README paplašināts.

### 0.5.28 (2026-05-29)

- **Blogs** – admin **`/admin/blog`**: BBCode, attēli (Storage **`blog`**), YouTube, publicēšana. Publiski **`/blog`**, **`/blog/{slug}`**. Footer **Blogs** tikai ja ≥1 publicēts ieraksts. **`app/sitemap.ts`** (statisks `/blog` + DB slug), canonical/OG. SQL **`153_*`**, **`154_*`**, tulkošanas **`2026-05-29.sql`**.

### 0.5.27 (2026-05-29)

- **Atbalsts / ieteikumi / atsauksmes → footer** – teksta saites **Ieteikumi · Atsauksmes · Palīdzība** (bez ikonām topbar un apakšējā pill). **`components/authed/authed-footer-action-links.tsx`**, **`SiteLandingFooter`** `showAuthedActionLinks`, admin footer. SQL **`149`–`152`**, tulkošanas **`2026-05-29.sql`**.
- **Atsauksmju modālis** – tikai forma (zvaigznes + teksts); aizveras pēc saglabāšanas; ielāde bez spinnera (forma redzama uzreiz, īslaicīgi atspējota). **`fetchOwnFeedbackAction`**, **`components/feedback/feedback-modal.tsx`**.

### 0.5.26 (2026-05-29)

- **Atsauksmes** – individuāli katram lietotājam, **zvaigžņu vērtējums 1–5** (bez thumbs-up balsošanas); viens ieraksts / konts. Landing: `getLandingFeedback()` ar `starRating`. **`152_user_feedback_star_rating.sql`**.

### 0.5.25 (2026-05-29)

- **Ieteikumi / balsošana** – modālis ar sarakstu, jaunu ieteikumu formu un balsīm (kopš **0.5.27** – footer saite, ne topbar). DB: **`user_suggestions`**, **`user_suggestion_votes`**, RPC **`list_user_suggestions`**. **`150_user_suggestions.sql`**, **`lib/suggestions/*`**, **`components/suggestions/*`**.

### 0.5.24 (2026-05-29)

- **Atbalsts (Help)** – modālis ar ziņojumu → e-pasts uz admin norādīto adresi (**`system_settings.support_contact_email`**, forma **`/admin/system`**), **Reply-To** = lietotāja e-pasts (kopš **0.5.27** – footer saite **Palīdzība**). **`149_system_settings_support_contact_email.sql`**, **`lib/support/*`**, **`components/support/*`**, Resend. Tulkošanas **`2026-05-29.sql`**, **`fallback-phrases.ts`**.

### 0.5.23 (2026-05-29)

- **Reģistrācijas valsts un norēķinu valūta** – pie reģistrācijas tiek saglabāta **`users.registration_country`** (CDN galvene `x-vercel-ip-country` / `cf-ipcountry` vai IP ģeolokācija); **`display_preferences.currency`** = **EUR** (ES), **GBP** (UK), **USD** (pārējie). OAuth backfill **`auth/callback`**. Viesiem sākumlapā **`#pricing`** un hero paraugi rāda valūtu pēc tā paša principa; **`/subscribe`** – pēc lietotāja valsts. **`lib/geo/*`**, **`lib/billing/*`**, SQL **`148_users_registration_country.sql`**.

### 0.5.22 (2026-05-29)

- **Admin `last_seen` – hydration** – relatīvais teksts (min/s, dienas) tikai pēc klienta mount; SSR/hydrācijā – stabils absolūts datums. **`components/admin/admin-users-view.tsx`**.
- **`database/translations_daily/2026-05-29.sql`** – noņemts dublikāts **`landing.features.cards.family_sharing.text`** vienā `INSERT` (kļūda `ON CONFLICT … cannot affect row a second time`).

### 0.5.21 (2026-05-29)

- **`public.users.last_seen`** – kolonna un RPC **`touch_user_last_seen`** (atjauninājums pie pieslēgšanās un GET lapām, max reizi 2 min). **`lib/auth/touch-user-last-seen.ts`**, **`lib/supabase/middleware.ts`**, **`app/(app)/auth/callback/route.ts`**. Admin **`/admin/users`**: zem reģistrācijas **Pēdējoreiz** (šodien – min/s pirms; 1–30 d. – dienas nav redzēts; vecāk – pilns datums; hover – absolūts laiks). **`lib/admin/format-user-last-seen-display.ts`**, stili **`styles/modules/subtrack-app.css`**. SQL **`145_*`**, **`146_*`**, **`147_*`**, tulkošanas **`2026-05-29.sql`**.

### 0.5.20 (2026-05-29)

- **Sākumlapa – Explore analītikas Pro birka** – **`landing.explore.pro_in_app_badge`**: tikai **Pro** (nevis „Pro lietotnē” / „Pro in app”). **`lib/i18n/fallback-phrases.ts`**, SQL **`144_*`**, tulkošanas **`2026-05-29.sql`**.

### 0.5.19 (2026-05-29)

- **Sākumlapa – ģimenes dalīšana** – ja admin ieslēdz integrāciju **`family_sharing`**, landing rāda trust rindu un septīto iespēju kartīti (**`landing.features.cards.family_sharing.*`**). **`components/landing-page.tsx`**, SQL **`141_*`**, tulkošanas **`2026-05-29.sql`**.
- **Ģimenes dalīšana – uzaicinājums ārpus sistēmas** – ja e-pasts nav `public.users`, **`POST /api/family-sharing`** izveido pending **`family_sharing_links`** (redzams **Tavi uzaicinājumi**) un sūta **`invite_user`** (admin e-pasta dizains); reģistrācija **`/signup?email=…`**. Ja Resend nav vai sūtīšana neizdodas – kļūda, pending netiek atstāts. **`lib/family-sharing/send-family-invite-email.ts`**, **`app/(app)/api/family-sharing/route.ts`**, **`signup/page.tsx`**, SQL **`140_*`**, tulkošanas **`2026-05-29.sql`**.
- **Panelis – modāļa kategorijas pēc popularitātes** – `<select id="sub-category">` kārtība: **lietotāja lietojums → globālā `usage_count` → admin `sort_order`**. SSR **`fetchEnabledSubscriptionCategoryOptions`** (pēc abonementu ielādes, ne **`Promise.all`** ar neeksistējošu `subsBundle`); bootstrap **`#subtrack-category-options-bootstrap-json`** ar `usage_count` / `sort_order`; modāļa atvēršanā **`reorderSubCategorySelect`** (**`subscriptions-helpers.js`**, **`dashboard.js`**). **`/demo/dashboard`** – tā pati loģika no demo abonementiem. SQL **`138_*`** (automātiska **`usage_count`** sinhronizācija) – obligāti Supabase.

### 0.5.18 (2026-05-29)

- **Lapas ielādes indikators** – **`AppPageContentGate`**: lielāks spinneris + **`app.page_loading`**; saturs paslēpts līdz gatavam (ne **`€0,00`** / **`0`** placeholder). **`/dashboard`**, **`/analytics`** – pēc **`fsBoot*`** + **`subtrackNotifyPageContentReady`** (**`subscriptions-helpers.js`**, **`dashboard.js`**, **`analytics.js`**); **`/settings`** – pēc preferences hydrācijas; **`/change-password`**, **`/email-notifications`**, **`/family-sharing`** – pēc klienta mount. **`components/app/app-page-content-gate.tsx`**, **`lib/app/page-content-ready.ts`**, **`styles/subtrack.css`**, SQL **`139_*`**, tulkošanas **`2026-05-29.sql`**.

### 0.5.17 (2026-05-29)

- **Panelis – budžeta kartīte (UI)** – **2px** zaļa/sarkana apmale un fons; kopējais budžets zem atlikuma; **5px** progress josla (% izlietots); stat kājenes (**„par mēnesi”** / **„kopā”** / **„atlicis”**) vienā līmenī (**`stat-card-main`** / **`stat-card-foot`**). **`dashboard-fs-view.tsx`**, **`public/fs/js/dashboard.js`**, **`styles/subtrack.css`**.
- **Iestatījumi – vienkāršota forma** – noņemts **Google piesaiste**, **PWA instalācija** un **push slēdzis** no **`/settings`** (**`settings-fs-view-client.tsx`**); komponenti repo paliek. PWA instalācija – mobilais banneris; push – tikai esošie abonementi.

### 0.5.16 (2026-05-29)

- **Iestatījumi – mēneša budžets** – lauks **`monthly_budget`** **`users.display_preferences`** JSONB (jauna kolonna nav vajadzīga); autosaglabāšana kā citām prefs. **`components/fs/settings-fs-view-client.tsx`**, **`lib/user-display-preferences.ts`**.
- **Panelis – budžeta atlikums** – trešā stat kartīte aiz „Aktīvie maksājumi”, ja budžets iestatīts; atlikums = budžets − kopējā mēneša summa; zaļa / sarkana apmale un fons. **`dashboard-fs-view.tsx`**, **`public/fs/js/dashboard.js`**, **`#subtrack-display-prefs-bootstrap-json`**, SQL **`133_*`**, tulkošanas **`2026-05-29.sql`**.
- **Admin – maksājumu kategorijas** – **`/admin/categories`**: CRUD; **secība** automātiska + **drag-and-drop**; admin tabulā **`usage_count` DESC**, tad **`sort_order`**. Modālī kategorijas – **lietotāja lietojums → globālā popularitāte → admin secība** (skat. **0.5.19**). SQL **`131`–`138`**. **`reorderCategoriesAction`**, **`dashboard-fs-view.tsx`**, **`subscriptions-helpers.js`**.
- **Kalendārs – periodiskie termiņi** – mēneša navigācija rāda visus atkārtojumus skatītajā mēnesī (**`subscriptionDueDatesInMonth`**, **`getPaymentsByDateInMonth`** **`dashboard.js`**). **Mēneša beigu diena** (31. u.tml.) – **`calendarDateOnBillingDay`**, **`subscriptionPreferredBillingDay`** (**`subscriptions-helpers.js`**); **`markPaid`** / **`dash-alerts.js`** izmanto to pašu loģiku nākamajam `next_payment_date`.
- **Dinamiskais maksājums – „Nākamajam: iepriekšējā summa”** – **`is_dynamic_carry_previous`** (noklusējums **false**); pēc apmaksas nākamajam termiņam **`due_amount_override`** no iepriekšējā perioda bāzes summas. SQL **`130_subscriptions_dynamic_carry_previous.sql`**; **`subscription-map.ts`**, **`PATCH /api/subscriptions/[id]`**, modāļa otrais slēdzis (**`dashboard-fs-view.tsx`**, **`dashboard.js`**). Tulkošanas arī **`database/translations_daily/2026-05-28.sql`**.
- **Modālis – nosaukuma ieteikumi** – **`#sub-name-suggestions`**: populārākie nosaukumi no lietotāja ierakstiem, citādi noklusējumi (piem. GYM) pēc UI valodas; līdz **3** rindām; paslēpjas rakstot. **`dashboard.js`**, **`fs-page-i18n-keys.ts`**, **`fallback-phrases.ts`**, CSS **`subtrack.css`**.
- **Panelis – virsraksts** – noņemta **Pro** birka blakus **„Maksājumi”** (**`dashboard-fs-view.tsx`**).
- **`css:split`** – **`scripts/split-landing-css.mjs`** pārbūvēts uz **sekciju marķieriem** + PostCSS validācija; noteikums **`.cursor/rules/subtrack-css-split.mdc`**. Pēc **`subtrack.css`** – **`npm run css:split`**.

### 0.5.15 (2026-05-28)

- **Panelis – kategoriju josla Pro** – virs **„Jūsu maksājumi”** segmentu josla tikai ar **`paid_plan_enabled`** un Pro (**`navUserHasProEntitlement`** / **`#subtrack-free-tier-gate-json`** **`isPaidUser`**); **`subtrackCanShowDashboardCategoryBar`**, **`renderDashboardCategoryBar`** (**`public/fs/js/dashboard.js`**). **`/demo/dashboard`** paliek redzama (demo gate **`enforcement: false`**).

### 0.5.14 (2026-05-28)

- **Pro priekšskatījums – daļējs blur** – **kalendārs:** 1. nedēļa + toolbar + leģenda; no 2. nedēļas šūnas ar **`filter: blur`** (ne **`display: none`**), CTA **`pay-calendar-preview-overlay`**. **Analītika:** pirmā rinda (2 kartītes), pārējās ar blur (**`analytics-preview-wrap--locked`**). CTA kartēs **bez** apakšteksta (kalendārs / analītika). **`components/pro-feature-preview-gate.tsx`**, **`dashboard-fs-view.tsx`**, **`analytics-fs-view.tsx`**, **`public/fs/js/dashboard.js`**, **`public/fs/js/analytics.js`**, **`styles/subtrack.css`**.
- **Free tier bootstrap analītikai** – **`FsAnalyticsBootstrapTemplates`** ietver **`#subtrack-free-tier-gate-json`** (bez pilna dashboard bootstrap). **`lib/subscriptions/dashboard-free-tier-gate-payload.ts`** klientam; serveris – **`dashboard-free-tier-gate.ts`**.
- **`css:split` – griezumi** – atjaunināti ankeri pēc kalendāra/analītikas CSS (**`scripts/split-landing-css.mjs`**): shell **`2933–4157`**, **`7784–7874`**, **`8107–8576`**; mock **`4162–4236`** … **`5104–5562`**. Novērsts **`landing.css`** **`Unexpected }`** (admin `@media` fragments shell griezumā).

### 0.5.13 (2026-05-28)

- **Demo – dinamiski datumi** – **`buildDemoDashboardSubscriptions()`** (`lib/demo/demo-dashboard-subscriptions.ts`): 1× nokavēts, 1× šodien, 1× šonedēļ, 1× nākamnedēļ, pārējie tālāk; ierīču termiņi arī relatīvi. **`/demo/dashboard`**, **`/demo/analytics`** (kalendārs, kopsavilkumi, paziņojumi).
- **Demo topbar – mobilā birka** – **≤960 px** mazāka **`.subtrack-demo-topbar-badge`**, logo + birka vienā rindā (**`styles/subtrack.css`** → **`demo-app.css`**).
- **`css:split` – griezumi** – atjaunināti ankeri pēc demo CSS un agrākajiem labojumiem (**`scripts/split-landing-css.mjs`**): landing-shell **`2933–4110`**, **`7741–7830`**, **`8064–8521`**; novērsts **`landing.css`** **`Unexpected }`**. Pēc **`subtrack.css`** izmaiņām pirms ankeriem – pārrēķini un **`npm run css:split`**.

### 0.5.12 (2026-05-28)

- **Pro priekšskatījums (panelis / analītika)** – ar **`paid_plan_enabled`** bez Pro: kalendārs un analītikas režģis **blur** + CTA uz **`/subscribe`** (**`ProFeaturePreviewGate`**, **`isProFeaturePreviewLocked`**); noņemts kalendāra paslēpšana un **`/analytics` redirect**; navigācijā analītika vienmēr redzama. **`dashboard-fs-view.tsx`**, **`analytics-fs-view.tsx`**, **`styles/subtrack.css`**.
- **Sākumlapa – teksti** – hero (badge, apakšvirsraksts), uzticības bloks (**7** kategorijas, e-pasts, ģimene), kājene **tracker**; **`components/landing-page.tsx`**, **`lib/i18n/fallback-phrases.ts`**, SQL **`database/translations_daily/2026-05-28.sql`**.
- **Admin uzdevumi – vilkšana uz atkritni** – **`/admin/todos`**: pilna platuma drop zona ar **`fa-trash`** virs un zem kolonnām **Uzdevums** / **Procesā**; ievilkta karte → **`moveAdminTodoAction`** uz **`done`** (optimistiski, toast, bez modāļa). **`AdminTodosTrashDropZone`**, **`.admin-todos-trash-zone*`** (**`styles/subtrack.css`**).
- **Mobilā apakšējā navigācija** – **≤960 px** pill rāda **tikai ikonas** (`.mobile-bottom-nav-label { display: none }`); **`mobile-bottom-nav-item.tsx`** – **`aria-label`**. **`styles/subtrack.css`**.
- **`css:split` – landing shell** – pēc mobilās nav saīsināšanas laboti griezumi: **`[7601, 7690]`**, **`[7924, 8392]`** (**`scripts/split-landing-css.mjs`**); novērsts **`landing.css`** **`Unclosed block`**. Pēc **`subtrack.css`** izmaiņām pirms ~7600. / ~7924. rindas – pārrēķini griezumus un **`npm run css:split`**.

### 0.5.11 (2026-05-23)

- **Noņemts kavēto maksājumu cron** – dzēsts **`/api/cron/overdue-payment-emails`**, admin **`/admin/cron-jobs`** rinda, e-pasta šablons **`overdue_payment`** no dizaina. Atlikušie cron: due-today, weekly, trial, push. SQL **`129_*`**, README **`0.5.11`**.

### 0.5.10 (2026-05-23)

- **Admin – cron testi** – **`/admin/cron-jobs`**: piespiedu palaišana visiem **`/api/cron/*`** darbiem; **`POST /api/admin/cron/run`**; nedēļas/trial ar **`?force=1`** (laika logs). **`lib/admin/run-cron-job.ts`**, **`lib/cron/cron-job-registry.ts`**, **`cron-force-query.ts`**. SQL **`127_*`**, stili **`.admin-cron-*`**.
- **Login / signup** – noņemts OAuth norādes teksts zem Google pogas (`auth.social.same_account_hint`); **`components/login-social-buttons.tsx`**, **`fallback-phrases.ts`**.

### 0.5.9 (2026-05-23)

- **OAuth viens konts (e-pasts + Google)** – Supabase automātiska saistīšana dokumentēta; login norāde (`auth.social.same_account_hint`); **`/settings`** **`SettingsConnectGoogle`** (`linkIdentity`). SQL **`126_*`**, **`lib/auth/oauth-redirect.ts`**, README **[Google OAuth → Viens konts](#6-viens-konts-e-pasts--parole-un-google)**.

### 0.5.8 (2026-05-23)

- **OAuth profila bilde** – Google (un citi provideri ar `avatar_url` / `picture` metadata) rāda profila foto topbar lietotāja izvēlnē un **`/admin/users`**; rezerve – inicialēs. SQL **`125_users_oauth_avatar_url.sql`** (`avatar_url`, `handle_new_user`, Auth trigeris, backfill). Kods: **`UserAvatar`**, **`sync-oauth-avatar.ts`**, **`auth/callback`** sinhronizācija, **`user-display.ts`**.
- **E-pasta paziņojumi – UI un dokumentācija** – **`/email-notifications`**: `auth-card`, `admin-switch`, `.email-notif-*` (**`styles/subtrack.css`**; pēc izmaiņām **`npm run css:split`**). Profila izvēlne **E-pasta paziņojumi**. README: **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)** (cron plānotājs), struktūra, **Pēc Git** līdz **`124_*`**, **`supabase.env.template`** cron ceļi.

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
- **Hydrācija (zīmols)** – **`NavBrandBridge`** layoutā; paneļa lapās arī **`loadNavBrandSnapshot()`** → **`NavDash` `brand` prop** → **`DashBrandLink`** (ne Intl fallback). Skat. **0.6.4**.
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

- **Iziet** – pārlūkā **`signOutAction`** → **`/`**; **Capacitor native** → **`/login`** (**`guestEntryPath`**, `native_app` forma).
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

- **Dinamiskā summa** – **`subscriptions.is_dynamic_amount`** (**`065_*`**); perioda pārklājums **`due_amount_override`** / **`due_amount_override_for`** (**`066_*`**) – **„Mainīt summu”** maina tikai tekošā termiņa summu; nākamais periods atkal no iestatījumiem (`amount`); pēc **„Samaksāts”** pārklājums tiek notīrīts (izņemums: **`is_dynamic_carry_previous`** **`130_*`** – nākamajam termiņam saglabā iepriekšējā perioda bāzes summu). Modāļa slēdži; sarakstā **„Mainīt summu”** un **`fa-chart-line`** pie nosaukuma. **`dashboard-fs-view.tsx`**, **`dashboard.js`**, **`subscriptions-helpers.js`**, **`subscription-map.ts`**, **`subscription-payment.ts`**, demo **`mockWeekBill`**.

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

- **Admin – e-pasta dizains** – **`/admin/email-design`**: priekšskatījums un rediģēšana **7 valodās**; saglabāšana **`system_settings_email_templates`**. Ar Resend + service role: **`confirm_signup`**, **`reset_password`** (UI valoda); cron šabloni **`payment_due_today`**, **`weekly_summary`**, **`trial_ending`**. Cron testa palaišana: **`/admin/cron-jobs`**. Skatīt **[E-pasta paziņojumi (cron)](#e-pasta-paziņojumi-cron)**. SQL **`051`–`055`**, **`117`–`129`**.

### 0.3.40 (2026-05-18)

- **Sākumlapa – teksti** – **`landing.footer.byline`**: „pārvaldība” (ne prototips); **`landing.hero.subtitle`**: **`{SYSTEM_NAME}`** vietā fiksēta „SubTrack”; **`050_site_translations_landing_footer_hero.sql`**, **`fallback-phrases.ts`**.
- **Juridiskās lapas un sīkdatnes** – publiski **`/terms`**, **`/privacy`**, **`/cookies`** (sitemap, **`canonical`** + OG – **`public-page-metadata.ts`**); reģistrācijā saites; **`components/legal/*`**. **Ielogots** – **`NavDash`** (ne landing navigācija), atpakaļ uz **`/dashboard`**; **viesis** – **`NavLanding`**. Kājene ar juridiskajām saitēm **`legal-page` / `auth-page`** mobilajā; **`app-layout`** panelī kājene paslēpta. Cookie banner pirmajā apmeklējumā. **`049_site_translations_legal.sql`**.

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
