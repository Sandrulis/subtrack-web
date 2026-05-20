-- PWA admin: saite uz logo no /admin/system.
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.pwa.logo_icons_hint', 'lv', 'PWA ikonas (32–512 px, maskable) un favicon ir produkta logo no'),
  ('admin.pwa.logo_icons_hint', 'en', 'PWA icons (32–512 px, maskable) and favicon use the product logo from'),
  ('admin.pwa.logo_icons_hint', 'fr', 'Les icônes PWA (32–512 px, maskable) et le favicon viennent du logo produit dans'),
  ('admin.pwa.logo_icons_hint', 'de', 'PWA-Icons (32–512 px, maskable) und Favicon nutzen das Produktlogo unter'),
  ('admin.pwa.logo_icons_hint', 'es', 'Los iconos PWA (32–512 px, maskable) y el favicon usan el logo del producto en'),
  ('admin.pwa.logo_icons_hint', 'pt', 'Os ícones PWA (32–512 px, maskable) e o favicon usam o logótipo em'),
  ('admin.pwa.logo_icons_hint', 'ru', 'Иконки PWA (32–512 px, maskable) и favicon берутся из логотипа в'),
  ('admin.pwa.logo_icons_after_change', 'lv', 'Pēc logo maiņas iesaki „Atjaunināt konfigurāciju klientiem”.'),
  ('admin.pwa.logo_icons_after_change', 'en', 'After changing the logo, use “Push config update to clients”.'),
  ('admin.pwa.logo_icons_after_change', 'fr', 'Après changement du logo, utilisez « Mettre à jour la config clients ».'),
  ('admin.pwa.logo_icons_after_change', 'de', 'Nach Logo-Änderung „Konfiguration an Clients senden“ ausführen.'),
  ('admin.pwa.logo_icons_after_change', 'es', 'Tras cambiar el logo, usa «Actualizar config en clientes».'),
  ('admin.pwa.logo_icons_after_change', 'pt', 'Após alterar o logótipo, use «Atualizar config nos clientes».'),
  ('admin.pwa.logo_icons_after_change', 'ru', 'После смены логотипа нажмите «Обновить конфиг у клиентов».'),
  ('admin.pwa.logo_icons_custom', 'lv', 'Manifest un instalētā lietotne izmanto augšupielādēto logo.'),
  ('admin.pwa.logo_icons_custom', 'en', 'Manifest and installed app use the uploaded logo.'),
  ('admin.pwa.logo_icons_custom', 'fr', 'Le manifeste et l’app installée utilisent le logo téléversé.'),
  ('admin.pwa.logo_icons_custom', 'de', 'Manifest und installierte App nutzen das hochgeladene Logo.'),
  ('admin.pwa.logo_icons_custom', 'es', 'El manifiesto y la app instalada usan el logo subido.'),
  ('admin.pwa.logo_icons_custom', 'pt', 'O manifesto e a app instalada usam o logótipo carregado.'),
  ('admin.pwa.logo_icons_custom', 'ru', 'Манифест и установленное приложение используют загруженный логотип.'),
  ('admin.pwa.logo_icons_default', 'lv', 'Nav pielāgota logo: manifestā ģenerētās ikonas (burts R). Augšupielādē logo sadaļā Sistēma.'),
  ('admin.pwa.logo_icons_default', 'en', 'No custom logo: manifest uses generated icons (letter R). Upload a logo under System.'),
  ('admin.pwa.logo_icons_default', 'fr', 'Pas de logo personnalisé : icônes générées (lettre R). Téléversez un logo dans Système.'),
  ('admin.pwa.logo_icons_default', 'de', 'Kein eigenes Logo: generierte Icons (Buchstabe R). Logo unter System hochladen.'),
  ('admin.pwa.logo_icons_default', 'es', 'Sin logo personalizado: iconos generados (letra R). Sube un logo en Sistema.'),
  ('admin.pwa.logo_icons_default', 'pt', 'Sem logótipo personalizado: ícones gerados (letra R). Carregue em Sistema.'),
  ('admin.pwa.logo_icons_default', 'ru', 'Нет своего логотипа: в манифесте сгенерированные иконки (буква R). Загрузите в Система.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();
