# SubTrack (subtrack-web)

**SubTrack** ir abonementu un periodisko maksājumu pārvaldības lietotne. Šis repozitorijs satur **web saskarni** (Next.js): paneli ar kalendāru, abonementu sarakstu, analītiku un autentifikācijas ekrānus. Biznesa loģika abonementiem pašlaik daļēji balstās uz **FS prototipa JavaScript** (`public/fs/js/`), kas ielādējas demonstrācijas režīmā; **īstā datu glabāšana un backend** (piemēram, Supabase) tiek plānots kā nākamais solis.

## Galvenās iespējas (UI)

- **Sākumlapa** - prezentācija, FAQ, saites uz paneli un reģistrāciju
- **Autentifikācija** - ieeja, reģistrācija, aizmirstas paroles forma (pagaidām bez servera)
- **Panelis** (`/dashboard`) - maksājumu kalendārs, kopsavilkums, abonementu CRUD (demo dati pārlūkā)
- **Analītika** (`/analytics`) - kopsavilkumi, kategorijas, Chart.js diagramma
- **Iestatījumi** - preferences `localStorage` ietvaros (prototips)
- **Sociālās ieejas pogas** (Google / Apple) ieejas lapā - pagaidām tikai UI, bez OAuth

## Tehniskais steks

| Slānis | Tehnoloģijas |
|--------|----------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19 |
| Valoda | TypeScript |
| Stili | `styles/subtrack.css` (pārnests no `FS` prototipa), globālie uzlabojumi `app/globals.css` |
| Ikonas | Font Awesome 6 (CDN), `next/font` - Inter |
| Demo panelis | Esošie skripti `public/fs/js/*.js` (kalendārs, modāļi, Chart.js utt.) |

## Struktūra (īsumā)

```
app/                  # Maršruti (lapas)
components/         # React komponenti (nav, landing, login sociālās pogas, FS skati)
components/fs/      # Panelis / analītika / iestatījumi - FS līdzinīgs saturs + skriptu ielāde
lib/                # Palīgfunkcijas (HTML valoda, FS ikonu saraksti)
public/fs/js/       # FS demo JavaScript (subscriptions, dashboard, analytics, utt.)
styles/subtrack.css # Galvenais dizaina fails
```

## Palaišana lokāli

Prasības: **Node.js** (LTS).

```bash
cd subtrack-web
npm install
npm run dev
```

Atver pārlūkā: [http://localhost:3000](http://localhost:3000).

Citas komandas:

```bash
npm run build   # produkcijas build
npm run start   # produkcijas serveris (pēc build)
npm run lint    # ESLint
```

## Vide un drošība

- **Nekommitē** `.env.local` vai jutīgas API atslēgas. Tajā glabāsi piemēram Supabase URL un anon atslēgu, kad pieslēgsi backend.
- Repozitorijā nav iekļauts `node_modules` un `.next` (skat. `.gitignore`).

## Ceļš uz backend

Plānots **Supabase** (Postgres, Auth, RLS) un pakāpeniska pāreja no `public/fs/js` uz **API + React** datu slāni. Iepriekšējais statiskais prototips ir aprakstīts mapē `www/FS` (cits projekts / workspace).

## Licence

Privāts projekts (`private` npm pakotnē). Precizē licenci, ja repo kļūst publisks.
