-- Sākumlapas hero CTA: „Sākt lietot” (visas lokāles).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.hero.cta_signup', 'lv', 'Sākt lietot'),
  ('landing.hero.cta_signup', 'en', 'Start using'),
  ('landing.hero.cta_signup', 'fr', 'Commencer à utiliser'),
  ('landing.hero.cta_signup', 'de', 'Jetzt nutzen'),
  ('landing.hero.cta_signup', 'es', 'Empezar a usar'),
  ('landing.hero.cta_signup', 'pt', 'Começar a usar'),
  ('landing.hero.cta_signup', 'ru', 'Начать использовать')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();
