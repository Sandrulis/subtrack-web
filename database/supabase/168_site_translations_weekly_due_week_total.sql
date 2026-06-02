-- Nedēļas kopsavilkums: kopsumma „Jāmaksā šonedēļ”, ja > 1 maksājums.
-- Palaid pēc 167_site_translations_signup_enabled.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('email.weekly.due_week_total', 'lv', 'Kopā šonedēļ: {total} ({count} maksājumi)'),
  ('email.weekly.due_week_total', 'en', 'Due this week: {total} ({count} payments)'),
  ('email.weekly.due_week_total', 'fr', 'Total cette semaine : {total} ({count} paiements)'),
  ('email.weekly.due_week_total', 'de', 'Diese Woche gesamt: {total} ({count} Zahlungen)'),
  ('email.weekly.due_week_total', 'es', 'Total esta semana: {total} ({count} pagos)'),
  ('email.weekly.due_week_total', 'pt', 'Total esta semana: {total} ({count} pagamentos)'),
  ('email.weekly.due_week_total', 'ru', 'На этой неделе всего: {total} ({count} платежей)')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();
