-- Produkta nosaukums: repazy -> SubTrack (ja 070_* jau pārslēdzis uz repazy).
-- PWA teksti ar {SYSTEM_NAME} vietturi.

update public.system_settings
set
  system_name = 'SubTrack',
  pwa_short_name = case
    when trim(coalesce(pwa_short_name, '')) in ('', 'repazy') then 'SubTrack'
    else pwa_short_name
  end
where id = 1
  and system_name = 'repazy';

insert into public.site_translations (key, language_code, value)
values
  ('pwa.install.description', 'lv', 'Pievieno {SYSTEM_NAME} sākumekrānam ātrākai piekļuvei.'),
  ('pwa.install.description', 'en', 'Add {SYSTEM_NAME} to your home screen for quick access.'),
  ('pwa.install.description', 'fr', 'Ajoutez {SYSTEM_NAME} à l''écran d''accueil pour un accès rapide.'),
  ('pwa.install.description', 'de', '{SYSTEM_NAME} zum Startbildschirm hinzufügen für schnellen Zugriff.'),
  ('pwa.install.description', 'es', 'Añade {SYSTEM_NAME} a la pantalla de inicio para acceso rápido.'),
  ('pwa.install.description', 'pt', 'Adicione {SYSTEM_NAME} ao ecrã inicial para acesso rápido.'),
  ('pwa.install.description', 'ru', 'Добавьте {SYSTEM_NAME} на главный экран для быстрого доступа.'),
  ('pwa.banner.title', 'lv', 'Instalē {SYSTEM_NAME} savā tālrunī'),
  ('pwa.banner.title', 'en', 'Install {SYSTEM_NAME} on your phone'),
  ('pwa.banner.title', 'fr', 'Installez {SYSTEM_NAME} sur votre téléphone'),
  ('pwa.banner.title', 'de', '{SYSTEM_NAME} auf dem Handy installieren'),
  ('pwa.banner.title', 'es', 'Instala {SYSTEM_NAME} en tu móvil'),
  ('pwa.banner.title', 'pt', 'Instale {SYSTEM_NAME} no telemóvel'),
  ('pwa.banner.title', 'ru', 'Установите {SYSTEM_NAME} на телефон'),
  ('legal.cookies.s5.body', 'lv', 'Ja instalē {SYSTEM_NAME} kā lietotni, pārlūks var glabāt statiskos failus (service worker) ierīcē, lai ātrāk ielādētu saskarni. API un konta dati joprojām prasa interneta savienojumu.'),
  ('legal.cookies.s5.body', 'en', 'If you install {SYSTEM_NAME} as an app, the browser may store static files (service worker) on your device for faster UI loading. API and account data still require an internet connection.'),
  ('legal.cookies.s5.body', 'fr', 'Si vous installez {SYSTEM_NAME}, le navigateur peut mettre en cache des fichiers statiques pour accélérer l''interface. Les données de compte nécessitent toujours Internet.'),
  ('legal.cookies.s5.body', 'de', 'Bei Installation von {SYSTEM_NAME} kann der Browser statische Dateien (Service Worker) lokal speichern. API und Kontodaten benötigen weiterhin Internet.'),
  ('legal.cookies.s5.body', 'es', 'Si instalas {SYSTEM_NAME}, el navegador puede guardar archivos estáticos (service worker) en el dispositivo. Los datos de cuenta siguen requiriendo conexión.'),
  ('legal.cookies.s5.body', 'pt', 'Se instalar {SYSTEM_NAME}, o navegador pode guardar ficheiros estáticos (service worker) no dispositivo. Dados da conta ainda exigem Internet.'),
  ('legal.cookies.s5.body', 'ru', 'При установке {SYSTEM_NAME} браузер может кэшировать статические файлы (service worker). Данные аккаунта по-прежнему требуют интернет.')
on conflict (key, language_code) do update
set value = excluded.value;
