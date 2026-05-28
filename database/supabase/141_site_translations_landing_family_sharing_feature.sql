-- Landing: feature card for family_sharing (when integration enabled in app)
-- Palaid pēc 140_site_translations_family_sharing_external_invite.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.features.cards.family_sharing.title', 'lv', 'Ģimenes dalīšana'),
  ('landing.features.cards.family_sharing.title', 'en', 'Family sharing'),
  ('landing.features.cards.family_sharing.title', 'fr', 'Partage familial'),
  ('landing.features.cards.family_sharing.title', 'de', 'Familienfreigabe'),
  ('landing.features.cards.family_sharing.title', 'es', 'Uso familiar compartido'),
  ('landing.features.cards.family_sharing.title', 'pt', 'Partilha familiar'),
  ('landing.features.cards.family_sharing.title', 'ru', 'Семейный доступ'),

  ('landing.features.cards.family_sharing.text', 'lv', 'Uzaicini tuvinieku un skati kopīgos periodiskos izdevumus panelī un kalendārā.'),
  ('landing.features.cards.family_sharing.text', 'en', 'Invite someone close and see shared recurring expenses on your dashboard and calendar.'),
  ('landing.features.cards.family_sharing.text', 'fr', 'Invitez un proche et voyez ses dépenses récurrentes partagées sur le tableau de bord et le calendrier.'),
  ('landing.features.cards.family_sharing.text', 'de', 'Laden Sie eine nahestehende Person ein und sehen Sie gemeinsame wiederkehrende Ausgaben in Dashboard und Kalender.'),
  ('landing.features.cards.family_sharing.text', 'es', 'Invita a un familiar y consulta gastos recurrentes compartidos en el panel y el calendario.'),
  ('landing.features.cards.family_sharing.text', 'pt', 'Convide um familiar e veja despesas recorrentes partilhadas no painel e no calendário.'),
  ('landing.features.cards.family_sharing.text', 'ru', 'Пригласите близкого человека и смотрите общие регулярные расходы на панели и в календаре.')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
