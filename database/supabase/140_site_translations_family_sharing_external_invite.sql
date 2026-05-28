-- Ģimenes dalīšana: uzaicinājums pa e-pastu, ja adresāts nav public.users (invite_user šablons).

insert into public.site_translations (translation_key, locale, value)
values
  (
    'family_sharing.err_email_not_configured',
    'lv',
    'E-pasta uzaicinājumus nevar nosūtīt: nav iestatīts RESEND vai EMAIL_FROM.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'en',
    'Cannot send invite emails: RESEND or EMAIL_FROM is not configured.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'ru',
    'Нельзя отправить приглашение по почте: не настроены RESEND или EMAIL_FROM.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'fr',
    'Impossible d''envoyer l''e-mail d''invitation : RESEND ou EMAIL_FROM manquant.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'de',
    'Einladungs-E-Mails können nicht gesendet werden: RESEND oder EMAIL_FROM fehlt.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'es',
    'No se pueden enviar invitaciones por correo: falta RESEND o EMAIL_FROM.'
  ),
  (
    'family_sharing.err_email_not_configured',
    'pt',
    'Não é possível enviar convites por e-mail: RESEND ou EMAIL_FROM em falta.'
  )
on conflict (translation_key, locale)
do update set
  value = excluded.value,
  updated_at = now();
