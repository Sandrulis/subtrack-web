-- Aizpilda trūkstošos site_translations ierakstus VISĀM 7 valodām (lv, en, fr, de, es, pt, ru).
-- Avots: lib/i18n/fallback-phrases.ts (+ legal, pwa). Ģenerēts: generate_missing_site_translations_sql.py
-- 12 rindas, 3 atslēgas.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('family_sharing.aria_accept', 'fr', 'Accepter l''invitation'),
  ('family_sharing.aria_accept', 'de', 'Einladung annehmen'),
  ('family_sharing.aria_accept', 'es', 'Aceptar invitación'),
  ('family_sharing.aria_accept', 'pt', 'Aceitar convite'),
  ('family_sharing.aria_decline', 'fr', 'Refuser l''invitation'),
  ('family_sharing.aria_decline', 'de', 'Einladung ablehnen'),
  ('family_sharing.aria_decline', 'es', 'Rechazar invitación'),
  ('family_sharing.aria_decline', 'pt', 'Recusar convite'),
  ('family_sharing.toast_declined', 'fr', 'Invitation refusée'),
  ('family_sharing.toast_declined', 'de', 'Einladung abgelehnt'),
  ('family_sharing.toast_declined', 'es', 'Invitación rechazada'),
  ('family_sharing.toast_declined', 'pt', 'Convite recusado')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
