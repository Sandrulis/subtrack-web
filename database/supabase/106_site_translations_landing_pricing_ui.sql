-- Landing #pricing UI: monthly pill, annual badge, cleaner equiv line
-- Palaid pēc 105_site_translations_admin_annual_equiv_monthly.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.pricing.monthly_suffix', 'lv', '/ mēnesī'),
  ('landing.pricing.monthly_suffix', 'en', '/ month'),
  ('landing.pricing.monthly_suffix', 'fr', '/ mois'),
  ('landing.pricing.monthly_suffix', 'de', '/ Monat'),
  ('landing.pricing.monthly_suffix', 'es', '/ mes'),
  ('landing.pricing.monthly_suffix', 'pt', '/ mês'),
  ('landing.pricing.monthly_suffix', 'ru', '/ мес.'),

  ('landing.pricing.annual_label', 'lv', 'Gads'),
  ('landing.pricing.annual_label', 'en', 'Year'),
  ('landing.pricing.annual_label', 'fr', 'An'),
  ('landing.pricing.annual_label', 'de', 'Jahr'),
  ('landing.pricing.annual_label', 'es', 'Año'),
  ('landing.pricing.annual_label', 'pt', 'Ano'),
  ('landing.pricing.annual_label', 'ru', 'Год'),

  ('landing.pricing.annual_badge_off', 'lv', '−{discount}%'),
  ('landing.pricing.annual_badge_off', 'en', '−{discount}%'),
  ('landing.pricing.annual_badge_off', 'fr', '−{discount} %'),
  ('landing.pricing.annual_badge_off', 'de', '−{discount}%'),
  ('landing.pricing.annual_badge_off', 'es', '−{discount}%'),
  ('landing.pricing.annual_badge_off', 'pt', '−{discount}%'),
  ('landing.pricing.annual_badge_off', 'ru', '−{discount}%'),

  ('landing.pricing.annual_equiv', 'lv', 'Tas ir {equiv} mēnesī, ja apmaksā uz gadu'),
  ('landing.pricing.annual_equiv', 'en', 'Works out to {equiv}/mo when paying annually'),
  ('landing.pricing.annual_equiv', 'fr', 'Soit {equiv}/mois en paiement annuel'),
  ('landing.pricing.annual_equiv', 'de', 'Entspricht {equiv}/Mon. bei Jahreszahlung'),
  ('landing.pricing.annual_equiv', 'es', 'Equivale a {equiv}/mes pagando al año'),
  ('landing.pricing.annual_equiv', 'pt', 'Equivale a {equiv}/mês no plano anual'),
  ('landing.pricing.annual_equiv', 'ru', 'Это {equiv}/мес. при годовой оплате')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
