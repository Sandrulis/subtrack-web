-- Demonstrācijas paneļa (/demo/dashboard) FS parauga nosaukumi + demo režīma paziņojums (toast).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'demo.dashboard.sub_mortgage',
    'lv',
    'Hipotekārais kredīts'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'en',
    'Mortgage'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'fr',
    'Crédit hypothécaire'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'de',
    'Hypothekendarlehen'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'es',
    'Crédito hipotecario'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'pt',
    'Crédito à habitação'
  ),
  (
    'demo.dashboard.sub_mortgage',
    'ru',
    'Ипотечный кредит'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'lv',
    'Apple Watch (Anna)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'en',
    'Apple Watch (Emma)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'fr',
    'Apple Watch (Emma)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'de',
    'Apple Watch (Mia)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'es',
    'Apple Watch (María)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'pt',
    'Apple Watch (Maria)'
  ),
  (
    'demo.dashboard.device_watch_zane',
    'ru',
    'Apple Watch (Анна)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'lv',
    'Apple Watch (Jānis)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'en',
    'Apple Watch (James)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'fr',
    'Apple Watch (Lucas)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'de',
    'Apple Watch (Leon)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'es',
    'Apple Watch (Carlos)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'pt',
    'Apple Watch (João)'
  ),
  (
    'demo.dashboard.device_watch_sandris',
    'ru',
    'Apple Watch (Александр)'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'lv',
    'Demonstrācijā izmaiņas netiek saglabātas serverī.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'en',
    'In the demo, changes are not saved on the server.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'fr',
    'Dans la démo, les modifications ne sont pas enregistrées sur le serveur.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'de',
    'In der Demo werden Änderungen nicht auf dem Server gespeichert.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'es',
    'En la demo, los cambios no se guardan en el servidor.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'pt',
    'Na demonstração, as alterações não são guardadas no servidor.'
  ),
  (
    'fs.dashboard.toast_demo_only',
    'ru',
    'В демо изменения не сохраняются на сервере.'
  )
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
