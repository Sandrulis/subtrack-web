-- Īsāki admin / iestatījumu / FS apraksti; noņemti liekie hint teksti (UI jau nerāda).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.users.lead_intro', 'lv', 'Visi reģistrētie lietotāji'),
  ('admin.users.lead_intro', 'en', 'All registered users'),
  ('admin.users.lead_intro', 'fr', 'Tous les utilisateurs inscrits'),
  ('admin.users.lead_intro', 'de', 'Alle registrierten Nutzer'),
  ('admin.users.lead_intro', 'es', 'Todos los usuarios registrados'),
  ('admin.users.lead_intro', 'pt', 'Todos os utilizadores registados'),
  ('admin.users.lead_intro', 'ru', 'Все зарегистрированные пользователи'),

  ('admin.languages.lead_intro_codes', 'lv', 'Atbalstītās lokāļu valodas. Kods ir tehniskais lokālis (piemēram en, lv). Saraksts sakārtots pēc nosaukuma.'),
  ('admin.languages.lead_intro_codes', 'en', 'Supported locales. Code is the technical locale (e.g. en, lv). List sorted by name.'),
  ('admin.languages.lead_intro_codes', 'fr', 'Langues d''interface prises en charge. Le code est la locale technique (ex. en, lv). Liste triée par nom.'),
  ('admin.languages.lead_intro_codes', 'de', 'Unterstützte Oberflächensprachen. Code ist der technische Locale (z. B. en, lv). Liste nach Name sortiert.'),
  ('admin.languages.lead_intro_codes', 'es', 'Idiomas de interfaz admitidos. El código es el locale técnico (p. ej. en, lv). Lista ordenada por nombre.'),
  ('admin.languages.lead_intro_codes', 'pt', 'Idiomas de interface suportados. O código é a locale técnica (ex. en, lv). Lista ordenada por nome.'),
  ('admin.languages.lead_intro_codes', 'ru', 'Поддерживаемые локали. Код - техническая локаль (например, en, lv). Список отсортирован по названию.'),

  ('admin.translations.lead_before_langs', 'lv', 'Tulkošanas atslēgas un teksti valodām, kas definētas sadaļā Valodas.'),
  ('admin.translations.lead_before_langs', 'en', 'Translation keys and strings for languages defined under Languages.'),
  ('admin.translations.lead_before_langs', 'fr', 'Clés et textes pour les langues définies dans Langues.'),
  ('admin.translations.lead_before_langs', 'de', 'Übersetzungsschlüssel und Texte für unter Sprachen definierte Locales.'),
  ('admin.translations.lead_before_langs', 'es', 'Claves y textos para los idiomas definidos en Idiomas.'),
  ('admin.translations.lead_before_langs', 'pt', 'Chaves e textos para línguas definidas em Idiomas.'),
  ('admin.translations.lead_before_langs', 'ru', 'Ключи переводов и тексты для языков, определенных в разделе Языки.'),

  ('admin.integrations.lead_before_code', 'lv', 'Ieslēdzamas un izslēdzamas ārējo pakalpojumi un funkcijas.'),
  ('admin.integrations.lead_before_code', 'en', 'Toggle external services and app features on or off.'),
  ('admin.integrations.lead_before_code', 'fr', 'Activer ou désactiver les services externes et les fonctionnalités.'),
  ('admin.integrations.lead_before_code', 'de', 'Externe Dienste und Funktionen ein- und ausschalten.'),
  ('admin.integrations.lead_before_code', 'es', 'Activar o desactivar servicios externos y funciones.'),
  ('admin.integrations.lead_before_code', 'pt', 'Ativar ou desativar serviços externos e funcionalidades.'),
  ('admin.integrations.lead_before_code', 'ru', 'Включение и отключение внешних сервисов и функций.'),

  ('admin.system.lead_before_code', 'lv', 'Globālais produkta nosaukums un noklusējumi datumam, laikam, valūtai un kalendāra nedēļas sākumam.'),
  ('admin.system.lead_before_code', 'en', 'Global product name and defaults for date, time, currency, and calendar week start.'),
  ('admin.system.lead_before_code', 'fr', 'Nom du produit et valeurs par défaut pour la date, l''heure, la devise et le début de semaine du calendrier.'),
  ('admin.system.lead_before_code', 'de', 'Globaler Produktname und Standardwerte für Datum, Uhrzeit, Währung und Wochenstart.'),
  ('admin.system.lead_before_code', 'es', 'Nombre del producto y valores por defecto de fecha, hora, divisa e inicio de semana del calendario.'),
  ('admin.system.lead_before_code', 'pt', 'Nome global do produto e predefinições de data, hora, moeda e início da semana.'),
  ('admin.system.lead_before_code', 'ru', 'Глобальное название продукта и значения по умолчанию для даты, времени, валюты и начала календарной недели.'),

  ('admin.forms.preview_intro', 'lv', 'Piemērs:'),
  ('admin.forms.preview_intro', 'en', 'Example:'),
  ('admin.forms.preview_intro', 'fr', 'Exemple :'),
  ('admin.forms.preview_intro', 'de', 'Beispiel:'),
  ('admin.forms.preview_intro', 'es', 'Ejemplo:'),
  ('admin.forms.preview_intro', 'pt', 'Exemplo:'),
  ('admin.forms.preview_intro', 'ru', 'Пример:'),

  ('fs.dashboard.advanced_hint_devices', 'lv', 'Piemēram papildpaketes vai iekārtas ar atsevišķu termiņu.'),
  ('fs.dashboard.advanced_hint_devices', 'en', 'e.g. routers or insurance riders with amounts and expiry.'),
  ('fs.dashboard.advanced_hint_devices', 'fr', 'ex. équipements ou lignes annexes avec montants et dates.'),
  ('fs.dashboard.advanced_hint_devices', 'de', 'z. B. Router oder Zuschläge mit Betrag/Datum.'),
  ('fs.dashboard.advanced_hint_devices', 'es', 'p. ej. hardware o cargos adicionales con importe/fecha.'),
  ('fs.dashboard.advanced_hint_devices', 'pt', 'p. ex. extras com próprio montante/data.'),
  ('fs.dashboard.advanced_hint_devices', 'ru', 'например маршрутизаторы или страховые компании с указанием сумм и срока действия.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
