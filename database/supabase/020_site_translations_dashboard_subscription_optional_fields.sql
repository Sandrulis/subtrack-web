-- SubTrack: paneļa validācijas ziņas un saraksta teksts (galvenais nosaukums ar papildu rindām; papildu rinda ar jebkuru lauku).
-- Atjauno `toast_device_name_when_term`; pievieno `toast_name_required_when_addons`, `list_untitled`.
-- Palaid pēc `012`. Idempotenti.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.toast_device_name_when_term', 'lv', 'Norādiet nosaukumu katrai papildu pozīcijai, kurā ir kāds datu lauks.'),
  ('fs.dashboard.toast_device_name_when_term', 'en', 'Enter a title for each extra line that has any details filled in.'),
  ('fs.dashboard.toast_device_name_when_term', 'fr', 'Donnez un nom pour chaque ligne supplémentaire contenant des données.'),
  ('fs.dashboard.toast_device_name_when_term', 'de', 'Geben Sie jeder Zusatzzeile mit ausgefüllten Feldern einen Namen.'),
  ('fs.dashboard.toast_device_name_when_term', 'es', 'Indica un nombre para cada línea extra con algún dato.'),
  ('fs.dashboard.toast_device_name_when_term', 'pt', 'Indique um nome para cada linha extra com algum preenchimento.'),
  ('fs.dashboard.toast_device_name_when_term', 'ru', 'Укажите название для каждой дополнительной строки с любыми данными.'),
  ('fs.dashboard.toast_name_required_when_addons', 'lv', 'Ja pievienotas papildu pozīcijas, norādiet arī šī ieraksta nosaukumu.'),
  ('fs.dashboard.toast_name_required_when_addons', 'en', 'If you add extras, enter a title for this subscription row.'),
  ('fs.dashboard.toast_name_required_when_addons', 'fr', 'Si vous ajoutez des lignes supplémentaires, donnez aussi un titre à l''entrée principale.'),
  ('fs.dashboard.toast_name_required_when_addons', 'de', 'Mit Zusatzzeilen benötigt der Haupteintrag ebenfalls einen Namen.'),
  ('fs.dashboard.toast_name_required_when_addons', 'es', 'Si añades líneas extra, pon también un título al registro principal.'),
  ('fs.dashboard.toast_name_required_when_addons', 'pt', 'Se adicionar linhas extra, indique também um título para este registo.'),
  ('fs.dashboard.toast_name_required_when_addons', 'ru', 'Если добавлены дополнительные строки, укажите и название основной записи.'),
  ('fs.dashboard.list_untitled', 'lv', 'Bez nosaukuma'),
  ('fs.dashboard.list_untitled', 'en', 'Untitled'),
  ('fs.dashboard.list_untitled', 'fr', 'Sans titre'),
  ('fs.dashboard.list_untitled', 'de', 'Ohne Titel'),
  ('fs.dashboard.list_untitled', 'es', 'Sin título'),
  ('fs.dashboard.list_untitled', 'pt', 'Sem título'),
  ('fs.dashboard.list_untitled', 'ru', 'Без названия')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
