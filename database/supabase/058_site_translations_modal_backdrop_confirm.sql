-- Modāļa aizvēršana pēc klikšķa uz fona: apstiprinājuma modālis (ne window.confirm).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('ui.modal.confirm_close_backdrop', 'lv', 'Nesaglabātie dati var tikt zaudēti.'),
  ('ui.modal.confirm_close_backdrop', 'en', 'Unsaved changes may be lost.'),
  ('ui.modal.confirm_close_backdrop', 'fr', 'Les modifications non enregistrées peuvent être perdues.'),
  ('ui.modal.confirm_close_backdrop', 'de', 'Nicht gespeicherte Änderungen können verloren gehen.'),
  ('ui.modal.confirm_close_backdrop', 'es', 'Los cambios no guardados pueden perderse.'),
  ('ui.modal.confirm_close_backdrop', 'pt', 'As alterações não guardadas podem perder-se.'),
  ('ui.modal.confirm_close_backdrop', 'ru', 'Несохранённые данные могут быть потеряны.'),

  ('ui.modal.confirm_close_title', 'lv', 'Aizvērt logu?'),
  ('ui.modal.confirm_close_title', 'en', 'Close this dialog?'),
  ('ui.modal.confirm_close_title', 'fr', 'Fermer cette fenêtre ?'),
  ('ui.modal.confirm_close_title', 'de', 'Fenster schließen?'),
  ('ui.modal.confirm_close_title', 'es', '¿Cerrar este cuadro?'),
  ('ui.modal.confirm_close_title', 'pt', 'Fechar esta janela?'),
  ('ui.modal.confirm_close_title', 'ru', 'Закрыть окно?'),

  ('ui.modal.confirm_close_stay', 'lv', 'Atcelt'),
  ('ui.modal.confirm_close_stay', 'en', 'Cancel'),
  ('ui.modal.confirm_close_stay', 'fr', 'Annuler'),
  ('ui.modal.confirm_close_stay', 'de', 'Abbrechen'),
  ('ui.modal.confirm_close_stay', 'es', 'Cancelar'),
  ('ui.modal.confirm_close_stay', 'pt', 'Cancelar'),
  ('ui.modal.confirm_close_stay', 'ru', 'Отмена'),

  ('ui.modal.confirm_close_confirm', 'lv', 'Aizvērt'),
  ('ui.modal.confirm_close_confirm', 'en', 'Close'),
  ('ui.modal.confirm_close_confirm', 'fr', 'Fermer'),
  ('ui.modal.confirm_close_confirm', 'de', 'Schließen'),
  ('ui.modal.confirm_close_confirm', 'es', 'Cerrar'),
  ('ui.modal.confirm_close_confirm', 'pt', 'Fechar'),
  ('ui.modal.confirm_close_confirm', 'ru', 'Закрыть')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
