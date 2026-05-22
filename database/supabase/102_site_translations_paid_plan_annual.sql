-- Tulkošanas atslēgas gada maksas plāna slēdzim un cenām.
-- Palaid pēc 101_paid_plan_annual.sql un 028_site_translations_paid_plan.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.forms.paid_plan_annual_enable', 'lv', 'Rādīt gada norēķina opciju'),
  ('admin.forms.paid_plan_annual_enable', 'en', 'Show annual billing option'),
  ('admin.forms.paid_plan_annual_enable', 'fr', 'Afficher l’option de facturation annuelle'),
  ('admin.forms.paid_plan_annual_enable', 'de', 'Jahresabrechnung anzeigen'),
  ('admin.forms.paid_plan_annual_enable', 'es', 'Mostrar opción de pago anual'),
  ('admin.forms.paid_plan_annual_enable', 'pt', 'Mostrar opção de pagamento anual'),
  ('admin.forms.paid_plan_annual_enable', 'ru', 'Показывать годовую оплату'),

  ('landing.pricing.annual_equiv', 'lv', '({equiv}/mēn., ja apmaksā uz gadu)'),
  ('landing.pricing.annual_equiv', 'en', '({equiv}/mo when paying annually)'),
  ('landing.pricing.annual_equiv', 'fr', '({equiv}/mois en paiement annuel)'),
  ('landing.pricing.annual_equiv', 'de', '({equiv}/Mon. bei Jahreszahlung)'),
  ('landing.pricing.annual_equiv', 'es', '({equiv}/mes pagando al año)'),
  ('landing.pricing.annual_equiv', 'pt', '({equiv}/mês no plano anual)'),
  ('landing.pricing.annual_equiv', 'ru', '({equiv}/мес. при годовой оплате)'),

  ('subscribe.price.annual_equiv', 'lv', '({equiv}/mēn., ja apmaksā uz gadu)'),
  ('subscribe.price.annual_equiv', 'en', '({equiv}/mo when paying annually)'),
  ('subscribe.price.annual_equiv', 'fr', '({equiv}/mois en paiement annuel)'),
  ('subscribe.price.annual_equiv', 'de', '({equiv}/Mon. bei Jahreszahlung)'),
  ('subscribe.price.annual_equiv', 'es', '({equiv}/mes pagando al año)'),
  ('subscribe.price.annual_equiv', 'pt', '({equiv}/mês no plano anual)'),
  ('subscribe.price.annual_equiv', 'ru', '({equiv}/мес. при годовой оплате)')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
