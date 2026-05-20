-- Panelis: kavētie / šodien kopsavilkuma kolonnas
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.stat_overdue_label', 'lv', 'Kavētie'),
  ('fs.dashboard.stat_overdue_label', 'en', 'Overdue'),
  ('fs.dashboard.stat_overdue_label', 'fr', 'En retard'),
  ('fs.dashboard.stat_overdue_label', 'de', 'Überfällig'),
  ('fs.dashboard.stat_overdue_label', 'es', 'Vencidos'),
  ('fs.dashboard.stat_overdue_label', 'pt', 'Em atraso'),
  ('fs.dashboard.stat_overdue_label', 'ru', 'Просроченные'),
  ('fs.dashboard.stat_today_due_label', 'lv', 'Šodien jāmaksā'),
  ('fs.dashboard.stat_today_due_label', 'en', 'Due today'),
  ('fs.dashboard.stat_today_due_label', 'fr', 'À payer aujourd’hui'),
  ('fs.dashboard.stat_today_due_label', 'de', 'Heute fällig'),
  ('fs.dashboard.stat_today_due_label', 'es', 'Vence hoy'),
  ('fs.dashboard.stat_today_due_label', 'pt', 'Vence hoje'),
  ('fs.dashboard.stat_today_due_label', 'ru', 'К оплате сегодня'),
  ('fs.dashboard.stat_bills_one', 'lv', '1 rēķins'),
  ('fs.dashboard.stat_bills_one', 'en', '1 bill'),
  ('fs.dashboard.stat_bills_one', 'fr', '1 facture'),
  ('fs.dashboard.stat_bills_one', 'de', '1 Rechnung'),
  ('fs.dashboard.stat_bills_one', 'es', '1 factura'),
  ('fs.dashboard.stat_bills_one', 'pt', '1 conta'),
  ('fs.dashboard.stat_bills_one', 'ru', '1 счёт'),
  ('fs.dashboard.stat_bills_other', 'lv', '{count} rēķini'),
  ('fs.dashboard.stat_bills_other', 'en', '{count} bills'),
  ('fs.dashboard.stat_bills_other', 'fr', '{count} factures'),
  ('fs.dashboard.stat_bills_other', 'de', '{count} Rechnungen'),
  ('fs.dashboard.stat_bills_other', 'es', '{count} facturas'),
  ('fs.dashboard.stat_bills_other', 'pt', '{count} contas'),
  ('fs.dashboard.stat_bills_other', 'ru', '{count} счетов')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;

