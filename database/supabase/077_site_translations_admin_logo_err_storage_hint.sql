-- Atjauno novecojušu logo kļūdas tekstu (service_role vairs nav obligāts; 072 + admin sesija).
-- Palaid pēc 073_site_translations_admin_logo.sql.

insert into public.site_translations (translation_key, locale, value)
values
  ('admin.forms.logo_err_service_role', 'lv', 'Logo saglabāšanai vajag admin sesiju un migrāciju 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'en', 'Logo upload requires an admin session and migration 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'fr', 'Le logo nécessite une session admin et la migration 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'de', 'Logo-Upload erfordert Admin-Session und Migration 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'es', 'Subir el logo requiere sesión de admin y la migración 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'pt', 'O logótipo exige sessão de admin e a migração 072_brand_storage.sql'),
  ('admin.forms.logo_err_service_role', 'ru', 'Загрузка логотипа: сессия админа и миграция 072_brand_storage.sql')
on conflict (translation_key, locale) do update set
  value = excluded.value,
  updated_at = now();
