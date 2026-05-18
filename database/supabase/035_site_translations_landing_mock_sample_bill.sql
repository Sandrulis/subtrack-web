-- Parauga „telefona rēķina” nosaukums hero / demo mock (lokāli pielāgots, piem. en → Phone bill).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.mock.sample_bill_name', 'lv', 'Telefona rēķins'),
  ('landing.mock.sample_bill_name', 'en', 'Phone bill'),
  ('landing.mock.sample_bill_name', 'fr', 'Facture téléphonique'),
  ('landing.mock.sample_bill_name', 'de', 'Handyrechnung'),
  ('landing.mock.sample_bill_name', 'es', 'Factura del móvil'),
  ('landing.mock.sample_bill_name', 'pt', 'Conta do telemóvel'),
  ('landing.mock.sample_bill_name', 'ru', 'Телефонный счёт')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Vairs neizmantots (vienota atslēga `landing.mock.sample_bill_name`).
DELETE FROM public.site_translations
WHERE translation_key = 'demo.analytics.next_name_sample';
