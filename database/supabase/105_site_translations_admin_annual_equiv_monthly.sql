-- Admin: mēneša ekvivalents, ja lietotājs maksā gada cenu.
-- Palaid pēc 104_site_translations_paid_plan_annual_price.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'lv', 'Lietotājam sanāk {equiv}/mēnesī, ja maksā uz gadu.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'en', 'Users pay {equiv}/month when billed annually.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'fr', 'Pour l’utilisateur : {equiv}/mois en facturation annuelle.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'de', 'Für Nutzer: {equiv}/Monat bei Jahreszahlung.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'es', 'Para el usuario: {equiv}/mes con pago anual.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'pt', 'Para o utilizador: {equiv}/mês no plano anual.'),
  ('admin.forms.paid_plan_annual_hint_equiv_monthly', 'ru', 'Для пользователя: {equiv}/мес. при годовой оплате.')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
