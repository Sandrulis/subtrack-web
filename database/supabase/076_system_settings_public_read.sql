-- VĒSTURISKS: aizstāts ar 078_system_settings_email_templates_split.sql (noņem Security Definer View).
-- Ja 076 jau palaists, obligāti palaid arī 078.
-- Ierobežo tiešu SELECT uz system_settings (email_templates u.c. sensitīvie lauki).
-- Publiskie lauki – caur skatu system_settings_public (anon + authenticated).
-- Pilna rinda – tikai admin (current_user_is_admin).
-- Palaid pēc 051 (email_templates), 068 (PWA), 071 (logo_revision).

create or replace view public.system_settings_public as
select
  id,
  system_name,
  logo_revision,
  default_display_preferences,
  paid_plan_enabled,
  paid_plan_price_eur,
  paid_plan_free_subscription_limit,
  pwa_enabled,
  pwa_install_banner_enabled,
  pwa_install_settings_enabled,
  pwa_cache_revision,
  pwa_theme_color,
  pwa_background_color,
  pwa_short_name
from public.system_settings;

comment on view public.system_settings_public is
  'Publiski lasāmi system_settings lauki bez email_templates; tieša tabulas SELECT – tikai admin.';

grant select on public.system_settings_public to anon, authenticated;

drop policy if exists "system_settings_select_public" on public.system_settings;

drop policy if exists "system_settings_select_admin" on public.system_settings;
create policy "system_settings_select_admin"
  on public.system_settings for select
  to authenticated
  using (public.current_user_is_admin());
