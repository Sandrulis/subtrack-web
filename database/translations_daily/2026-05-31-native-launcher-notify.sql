-- Native Android launcher notification lines (payment digest on shade)

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('native.launcher_notify.line_overdue', 'lv', 'Kavētie: {count}'),
  ('native.launcher_notify.line_overdue', 'en', 'Overdue: {count}'),
  ('native.launcher_notify.line_overdue', 'fr', 'En retard : {count}'),
  ('native.launcher_notify.line_overdue', 'de', 'Überfällig: {count}'),
  ('native.launcher_notify.line_overdue', 'es', 'Atrasados: {count}'),
  ('native.launcher_notify.line_overdue', 'pt', 'Em atraso: {count}'),
  ('native.launcher_notify.line_overdue', 'ru', 'Просрочено: {count}'),
  ('native.launcher_notify.line_today', 'lv', 'Šodien jāmaksā: {count}'),
  ('native.launcher_notify.line_today', 'en', 'Due today: {count}'),
  ('native.launcher_notify.line_today', 'fr', 'À payer aujourd''hui : {count}'),
  ('native.launcher_notify.line_today', 'de', 'Heute fällig: {count}'),
  ('native.launcher_notify.line_today', 'es', 'Vence hoy: {count}'),
  ('native.launcher_notify.line_today', 'pt', 'Vence hoje: {count}'),
  ('native.launcher_notify.line_today', 'ru', 'Сегодня к оплате: {count}'),
  ('native.launcher_notify.line_upcoming', 'lv', 'Gaidāmie (7 d.): {count}'),
  ('native.launcher_notify.line_upcoming', 'en', 'Upcoming (7 days): {count}'),
  ('native.launcher_notify.line_upcoming', 'fr', 'À venir (7 j.) : {count}'),
  ('native.launcher_notify.line_upcoming', 'de', 'Anstehend (7 T.): {count}'),
  ('native.launcher_notify.line_upcoming', 'es', 'Próximos (7 d.): {count}'),
  ('native.launcher_notify.line_upcoming', 'pt', 'Próximos (7 d.): {count}'),
  ('native.launcher_notify.line_upcoming', 'ru', 'Скоро (7 д.): {count}'),
  ('native.launcher_notify.line_family', 'lv', 'Uzaicinājumi: {count}'),
  ('native.launcher_notify.line_family', 'en', 'Invites: {count}'),
  ('native.launcher_notify.line_family', 'fr', 'Invitations : {count}'),
  ('native.launcher_notify.line_family', 'de', 'Einladungen: {count}'),
  ('native.launcher_notify.line_family', 'es', 'Invitaciones: {count}'),
  ('native.launcher_notify.line_family', 'pt', 'Convites: {count}'),
  ('native.launcher_notify.line_family', 'ru', 'Приглашения: {count}')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
