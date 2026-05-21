-- Family sharing: partner section + leave action (2026-05-21)

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('family_sharing.section_shared_with_me', 'lv', 'Dalība ar mani'),
  ('family_sharing.section_shared_with_me', 'en', 'Shared with me'),
  ('family_sharing.section_shared_with_me', 'ru', 'Доступ мне'),
  ('family_sharing.empty_shared_with_me', 'lv', 'Nav aktīvas dalības.'),
  ('family_sharing.empty_shared_with_me', 'en', 'No active sharing.'),
  ('family_sharing.empty_shared_with_me', 'ru', 'Нет активного доступа.'),
  ('family_sharing.lead_as_partner', 'lv', 'Panelī redzi šī lietotāja izdevumus (tikai skatīšanai).'),
  ('family_sharing.lead_as_partner', 'en', 'You see this user''s expenses on the dashboard (read-only).'),
  ('family_sharing.lead_as_partner', 'ru', 'Вы видите расходы этого пользователя (только просмотр).'),
  ('family_sharing.btn_leave', 'lv', 'Pamest dalību'),
  ('family_sharing.btn_leave', 'en', 'Leave sharing'),
  ('family_sharing.btn_leave', 'ru', 'Выйти из доступа')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
