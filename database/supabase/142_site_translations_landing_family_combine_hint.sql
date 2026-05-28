-- Landing: ģimenes izdevumi – kopsummās vai tikai sarakstā/kalendārā
-- Palaid pēc 141_site_translations_landing_family_sharing_feature.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.trust.family_sharing_hint', 'lv', 'Saskaiti kopā ar saviem vai rādi tikai sarakstā un kalendārā.'),
  ('landing.trust.family_sharing_hint', 'en', 'Include in your totals or show only in your list and calendar.'),
  ('landing.trust.family_sharing_hint', 'fr', 'Inclure dans vos totaux ou afficher seulement dans la liste et le calendrier.'),
  ('landing.trust.family_sharing_hint', 'de', 'In Ihre Summen einbeziehen oder nur in Liste und Kalender anzeigen.'),
  ('landing.trust.family_sharing_hint', 'es', 'Súmalos a tus totales o muéstralos solo en la lista y el calendario.'),
  ('landing.trust.family_sharing_hint', 'pt', 'Incluir nos seus totais ou mostrar só na lista e no calendário.'),
  ('landing.trust.family_sharing_hint', 'ru', 'Учитывайте в итогах или показывайте только в списке и календаре.'),

  ('landing.features.cards.family_sharing.text', 'lv', 'Uzaicini tuvinieku: kopīgie izdevumi parādās sarakstā un kalendārā; pēc izvēles saskaiti tos kopā ar saviem kopsummās panelī.'),
  ('landing.features.cards.family_sharing.text', 'en', 'Invite someone close: shared expenses appear in your list and calendar; optionally include them in your dashboard totals.'),
  ('landing.features.cards.family_sharing.text', 'fr', 'Invitez un proche : ses dépenses partagées apparaissent dans la liste et le calendrier ; incluez-les dans vos totaux si vous le souhaitez.'),
  ('landing.features.cards.family_sharing.text', 'de', 'Laden Sie eine nahestehende Person ein: gemeinsame Ausgaben in Liste und Kalender; optional in Ihre Dashboard-Summen einbeziehen.'),
  ('landing.features.cards.family_sharing.text', 'es', 'Invita a un familiar: sus gastos compartidos en la lista y el calendario; opcionalmente súmalos a tus totales del panel.'),
  ('landing.features.cards.family_sharing.text', 'pt', 'Convide um familiar: despesas partilhadas na lista e no calendário; opcionalmente inclua-as nos totais do painel.'),
  ('landing.features.cards.family_sharing.text', 'ru', 'Пригласите близкого: общие расходы в списке и календаре; по желанию учитывайте их в итогах на панели.')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
