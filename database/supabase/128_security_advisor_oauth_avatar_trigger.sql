-- Security Advisor: sync_public_user_avatar_from_auth – trigeris uz auth.users;
-- nav izsaucams kā RPC no anon / authenticated (kā 022, 120).
-- Palaid pēc 125_users_oauth_avatar_url.sql.
--
-- Leaked password protection: nav SQL; Supabase Dashboard:
--   Authentication → Providers → Email → Prevent use of leaked passwords
--   (Pro plānā; Free projektā Advisor brīdinājums var palikt – skat. README).

revoke all on function public.sync_public_user_avatar_from_auth() from public;
revoke all on function public.sync_public_user_avatar_from_auth() from anon, authenticated;

comment on function public.sync_public_user_avatar_from_auth() is
  'Pēc Auth user_metadata maiņas sinhronizē public.users.avatar_url (SECURITY DEFINER trigeris; EXECUTE nav anon/authenticated).';
