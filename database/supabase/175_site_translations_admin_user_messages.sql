-- Admin: lietotāju ieteikumi, atsauksmes, atbalsta ziņojumi (UI).
-- Palaid pēc 174_user_support_requests.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.nav.user_messages', 'lv', 'Lietotāju viedoklis'),
  ('admin.nav.user_messages', 'en', 'User messages'),
  ('admin.nav.user_messages', 'ru', 'Сообщения пользователей'),
  ('meta.title.admin.user_messages', 'lv', 'Lietotāju viedoklis'),
  ('meta.title.admin.user_messages', 'en', 'User messages'),
  ('meta.title.admin.user_messages', 'ru', 'Сообщения пользователей'),
  ('admin.user_messages.heading', 'lv', 'Ieteikumi, atsauksmes un atbalsts'),
  ('admin.user_messages.heading', 'en', 'Suggestions, feedback and support'),
  ('admin.user_messages.heading', 'ru', 'Предложения, отзывы и поддержка'),
  ('admin.user_messages.lead', 'lv', 'Skaties un pārvaldi lietotāju ieteikumus, atsauksmes ar vērtējumu un atbalsta ziņojumus. Atbalsta e-pasts joprojām tiek sūtīts uz adresi no sistēmas iestatījumiem.'),
  ('admin.user_messages.lead', 'en', 'Review and manage user suggestions, star-rated feedback, and support messages. Support email is still sent to the address in system settings.'),
  ('admin.user_messages.lead', 'ru', 'Просмотр и управление предложениями, отзывами со звёздами и обращениями в поддержку. E-mail поддержки по-прежнему уходит на адрес из системных настроек.'),
  ('admin.user_messages.tab_suggestions', 'lv', 'Ieteikumi'),
  ('admin.user_messages.tab_suggestions', 'en', 'Suggestions'),
  ('admin.user_messages.tab_suggestions', 'ru', 'Предложения'),
  ('admin.user_messages.tab_feedback', 'lv', 'Atsauksmes'),
  ('admin.user_messages.tab_feedback', 'en', 'Feedback'),
  ('admin.user_messages.tab_feedback', 'ru', 'Отзывы'),
  ('admin.user_messages.tab_support', 'lv', 'Atbalsts'),
  ('admin.user_messages.tab_support', 'en', 'Support'),
  ('admin.user_messages.tab_support', 'ru', 'Поддержка')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();
