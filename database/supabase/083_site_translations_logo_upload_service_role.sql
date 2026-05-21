-- Logo augšupielāde: serverī pēc admin pārbaudes izmanto service_role (kā VIP API).
-- Palaid pēc 077_site_translations_admin_logo_err_storage_hint.sql.

insert into public.site_translations (translation_key, locale, value)
values
  ('admin.forms.logo_err_service_role', 'lv', 'Trūkst SUPABASE_SERVICE_ROLE_KEY (.env.local). Logo vajag arī migrāciju 072_brand_storage.sql.'),
  ('admin.forms.logo_err_service_role', 'en', 'Missing SUPABASE_SERVICE_ROLE_KEY (.env.local). Logo also needs migration 072_brand_storage.sql.'),
  ('admin.forms.logo_err_service_role', 'fr', 'SUPABASE_SERVICE_ROLE_KEY manquant (.env.local). Migration 072_brand_storage.sql requise pour le logo.'),
  ('admin.forms.logo_err_service_role', 'de', 'SUPABASE_SERVICE_ROLE_KEY fehlt (.env.local). Logo braucht Migration 072_brand_storage.sql.'),
  ('admin.forms.logo_err_service_role', 'es', 'Falta SUPABASE_SERVICE_ROLE_KEY (.env.local). El logo requiere la migración 072_brand_storage.sql.'),
  ('admin.forms.logo_err_service_role', 'pt', 'Falta SUPABASE_SERVICE_ROLE_KEY (.env.local). O logótipo precisa da migração 072_brand_storage.sql.'),
  ('admin.forms.logo_err_service_role', 'ru', 'Нет SUPABASE_SERVICE_ROLE_KEY (.env.local). Для логотипа нужна миграция 072_brand_storage.sql.'),
  ('admin.forms.logo_err_storage_policy', 'lv', ' Pārbaudi, vai ir palaista 072_brand_storage.sql un .env satur SUPABASE_SERVICE_ROLE_KEY.'),
  ('admin.forms.logo_err_storage_policy', 'en', ' Check that 072_brand_storage.sql was applied and .env has SUPABASE_SERVICE_ROLE_KEY.'),
  ('admin.forms.logo_err_storage_policy', 'fr', ' Vérifiez 072_brand_storage.sql et SUPABASE_SERVICE_ROLE_KEY dans .env.'),
  ('admin.forms.logo_err_storage_policy', 'de', ' 072_brand_storage.sql ausgeführt? SUPABASE_SERVICE_ROLE_KEY in .env?'),
  ('admin.forms.logo_err_storage_policy', 'es', ' Comprueba 072_brand_storage.sql y SUPABASE_SERVICE_ROLE_KEY en .env.'),
  ('admin.forms.logo_err_storage_policy', 'pt', ' Confirme 072_brand_storage.sql e SUPABASE_SERVICE_ROLE_KEY no .env.'),
  ('admin.forms.logo_err_storage_policy', 'ru', ' Проверьте 072_brand_storage.sql и SUPABASE_SERVICE_ROLE_KEY в .env.')
on conflict (translation_key, locale) do update set
  value = excluded.value,
  updated_at = now();
