# Native app ikonas un splash

Avota fails: **`icon.png`** un **`splash.png`** (1024×1024, repazy „R” uz tumša fona).

Pēc logo maiņas:

```bash
npm run cap:assets
```
(palaiž `npx @capacitor/assets` – nav repo atkarības, lai CI audit paliek tīrs)

```bash
npx cap sync android
```

Android Studio → **Run**.
