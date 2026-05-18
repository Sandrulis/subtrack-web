-- Atjaunina Pro / subscribe hero lead ( „ne aizmirst maksājumus” ) visās publiskajās lokālēs.
-- Palaid pēc `029_site_translations_subscribe.sql` (vai esošas DB, kur jau ir `subscribe.hero.lead`).

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'subscribe.hero.lead',
    'lv',
    'Neierobežoti ieraksti, atgādinājumi un pilns maksājumu kalendārs vienā vietā. Aptuveni tikpat cik viena kafija mēnesī — un tu nekad neaizmirsti savus maksājumus.'
  ),
  (
    'subscribe.hero.lead',
    'en',
    'Unlimited entries, reminders, and a full payment calendar in one place. About the price of a coffee a month — and you never forget your payments.'
  ),
  (
    'subscribe.hero.lead',
    'fr',
    'Entrées illimitées, rappels et calendrier des paiements complet au même endroit. À peu près le prix d’un café par mois — et vous n’oubliez jamais vos paiements.'
  ),
  (
    'subscribe.hero.lead',
    'de',
    'Unbegrenzte Einträge, Erinnerungen und voller Zahlungskalender an einem Ort. Etwa so viel wie ein Kaffee im Monat — und dir entgeht keine Zahlung.'
  ),
  (
    'subscribe.hero.lead',
    'es',
    'Entradas ilimitadas, recordatorios y calendario de pagos completo en un sitio. Alrededor del precio de un café al mes — y nunca olvidas tus pagos.'
  ),
  (
    'subscribe.hero.lead',
    'pt',
    'Entradas ilimitadas, lembretes e calendário completo de pagamentos num só sítio. Por volta do preço de um café por mês — e nunca te esqueces dos teus pagamentos.'
  ),
  (
    'subscribe.hero.lead',
    'ru',
    'Неограниченные записи, напоминания и полный календарь платежей в одном месте. Примерно как чашка кофе в месяц — и вы никогда не забываете о своих платежах.'
  )
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
