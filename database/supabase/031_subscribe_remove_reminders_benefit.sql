-- Pro abonementa lapa: „Atgādinājumi” vairs nav Pro ieguvums (pieejami visiem).
-- Papildina admin maksas plāna skaidrojumu atbilstoši.

DELETE FROM public.site_translations
WHERE translation_key IN (
  'subscribe.benefit.reminders.title',
  'subscribe.benefit.reminders.text'
);

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'admin.forms.paid_plan_hint',
    'lv',
    'Kad ieslēgts, jaunus ierakstus nedrīkst pievienot virs limita, kamēr lietotājam nav aktivizēts maksas plāns (paid_plan_active datubāzē). Atgādinājumu panelis pieejams visiem lietotājiem.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'en',
    'When on, users cannot add rows beyond the limit until paid_plan_active is set in the database (e.g. after checkout). The reminders panel stays available for all users.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'fr',
    'Si activé, pas d’ajout au-delà de la limite sans paid_plan_active en base. Les rappels restent disponibles pour tous les comptes.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'de',
    'Wenn an: kein Anlegen über dem Limit ohne paid_plan_active in der DB. Erinnerungen im Panel sind für alle Nutzer verfügbar.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'es',
    'Si está activo, no se pueden añadir filas por encima del límite sin paid_plan_active en la base. Los recordatorios del panel siguen disponibles para todos.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'pt',
    'Se ativo, não é possível adicionar além do limite sem paid_plan_active na base de dados. Os lembretes no painel continuam disponíveis para todos.'
  ),
  (
    'admin.forms.paid_plan_hint',
    'ru',
    'Если включено, нельзя добавлять записи сверх лимита, пока в БД не установлен paid_plan_active. Напоминания в панели доступны всем пользователям.'
  )
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
