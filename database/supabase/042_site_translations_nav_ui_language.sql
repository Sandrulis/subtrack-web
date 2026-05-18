-- Globālais UI valodas slēdzis augšējā joslā (karogs + izvēlne).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('nav.ui_language_aria', 'lv', 'Mainīt saskarnes valodu'),
  ('nav.ui_language_aria', 'en', 'Change interface language'),
  ('nav.ui_language_aria', 'fr', 'Changer la langue de l’interface'),
  ('nav.ui_language_aria', 'de', 'Oberflächensprache ändern'),
  ('nav.ui_language_aria', 'es', 'Cambiar idioma de la interfaz'),
  ('nav.ui_language_aria', 'pt', 'Alterar idioma da interface'),
  ('nav.ui_language_aria', 'ru', 'Сменить язык интерфейса'),
  ('nav.ui_language_menu_aria', 'lv', 'Pieejamās saskarnes valodas'),
  ('nav.ui_language_menu_aria', 'en', 'Available interface languages'),
  ('nav.ui_language_menu_aria', 'fr', 'Langues d’interface disponibles'),
  ('nav.ui_language_menu_aria', 'de', 'Verfügbare Oberflächensprachen'),
  ('nav.ui_language_menu_aria', 'es', 'Idiomas de interfaz disponibles'),
  ('nav.ui_language_menu_aria', 'pt', 'Idiomas de interface disponíveis'),
  ('nav.ui_language_menu_aria', 'ru', 'Доступные языки интерфейса'),
  ('nav.ui_language_option_aria', 'lv', 'Pārslēgt uz: {label}'),
  ('nav.ui_language_option_aria', 'en', 'Switch to {label}'),
  ('nav.ui_language_option_aria', 'fr', 'Passer à {label}'),
  ('nav.ui_language_option_aria', 'de', 'Wechseln zu {label}'),
  ('nav.ui_language_option_aria', 'es', 'Cambiar a {label}'),
  ('nav.ui_language_option_aria', 'pt', 'Mudar para {label}'),
  ('nav.ui_language_option_aria', 'ru', 'Переключить на {label}')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
