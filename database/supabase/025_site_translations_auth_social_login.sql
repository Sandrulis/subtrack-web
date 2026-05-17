-- SubTrack: OAuth poga teksti pie login / signup (`LoginSocialButtons` + `t()`).
-- Pēc `012_site_translations_select_public.sql`.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.social.divider', 'lv', 'vai turpināt ar'),
  ('auth.social.divider', 'en', 'or continue with'),
  ('auth.social.divider', 'fr', 'ou continuer avec'),
  ('auth.social.divider', 'de', 'oder weiter mit'),
  ('auth.social.divider', 'es', 'o continuar con'),
  ('auth.social.divider', 'pt', 'ou continuar com'),
  ('auth.social.divider', 'ru', 'или продолжить с'),

  ('auth.social.google_label', 'lv', 'Turpināt ar Google'),
  ('auth.social.google_label', 'en', 'Continue with Google'),
  ('auth.social.google_label', 'fr', 'Continuer avec Google'),
  ('auth.social.google_label', 'de', 'Mit Google fortfahren'),
  ('auth.social.google_label', 'es', 'Continuar con Google'),
  ('auth.social.google_label', 'pt', 'Continuar com Google'),
  ('auth.social.google_label', 'ru', 'Продолжить с Google'),

  ('auth.social.apple_label', 'lv', 'Turpināt ar Apple'),
  ('auth.social.apple_label', 'en', 'Continue with Apple'),
  ('auth.social.apple_label', 'fr', 'Continuer avec Apple'),
  ('auth.social.apple_label', 'de', 'Mit Apple fortfahren'),
  ('auth.social.apple_label', 'es', 'Continuar con Apple'),
  ('auth.social.apple_label', 'pt', 'Continuar com Apple'),
  ('auth.social.apple_label', 'ru', 'Продолжить с Apple'),

  ('auth.social.aria_google', 'lv', 'Turpināt ar Google kontu'),
  ('auth.social.aria_google', 'en', 'Continue with Google account'),
  ('auth.social.aria_google', 'fr', 'Continuer avec un compte Google'),
  ('auth.social.aria_google', 'de', 'Mit Google-Konto fortfahren'),
  ('auth.social.aria_google', 'es', 'Continuar con tu cuenta Google'),
  ('auth.social.aria_google', 'pt', 'Continuar com a conta Google'),
  ('auth.social.aria_google', 'ru', 'Продолжить через аккаунт Google'),

  ('auth.social.aria_apple', 'lv', 'Turpināt ar Apple kontu'),
  ('auth.social.aria_apple', 'en', 'Continue with Apple account'),
  ('auth.social.aria_apple', 'fr', 'Continuer avec un compte Apple'),
  ('auth.social.aria_apple', 'de', 'Mit Apple-Konto fortfahren'),
  ('auth.social.aria_apple', 'es', 'Continuar con tu cuenta Apple'),
  ('auth.social.aria_apple', 'pt', 'Continuar com a conta Apple'),
  ('auth.social.aria_apple', 'ru', 'Продолжить через аккаунт Apple'),

  ('auth.social.flash_missing_supabase_env', 'lv', 'Pievieno .env.local: NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  ('auth.social.flash_missing_supabase_env', 'en', 'Add to .env.local: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  ('auth.social.flash_missing_supabase_env', 'fr', 'Ajouter dans .env.local : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  ('auth.social.flash_missing_supabase_env', 'de', 'Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local setzen.'),
  ('auth.social.flash_missing_supabase_env', 'es', 'Añade en .env.local: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  ('auth.social.flash_missing_supabase_env', 'pt', 'Adiciona em .env.local: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  ('auth.social.flash_missing_supabase_env', 'ru', 'Добавьте в .env.local: NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.'),

  ('auth.social.flash_oauth_url_missing', 'lv', 'OAuth URL netika atgriezts. Pārbaudi providerus Supabase.'),
  ('auth.social.flash_oauth_url_missing', 'en', 'OAuth URL was not returned. Check Supabase providers.'),
  ('auth.social.flash_oauth_url_missing', 'fr', 'URL OAuth introuvable. Verifie les fournisseurs Supabase.'),
  ('auth.social.flash_oauth_url_missing', 'de', 'OAuth-URL nicht erhalten. Supabase-Anbieter prufen.'),
  ('auth.social.flash_oauth_url_missing', 'es', 'No se obtuvo URL OAuth. Revisa los providers en Supabase.'),
  ('auth.social.flash_oauth_url_missing', 'pt', 'O URL OAuth nao foi devolvido. Verifica providers no Supabase.'),
  ('auth.social.flash_oauth_url_missing', 'ru', 'Не получен OAuth URL. Проверьте провайдеры в Supabase.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
