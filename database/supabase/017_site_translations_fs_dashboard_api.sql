-- SubTrack: tulkošanas atslēgas paneļa REST/API ziņām (`fallback-phrases` kopija).
-- Palaid pēc `011` / `012` (site_translations + publiskā SELECT).
-- Idempotenti: atkārtošana droša.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.toast_api_save_failed', 'lv', 'Neizdevās saglabāt. Pārbaudi savienojumu un mēģini vēlreiz.'),
  ('fs.dashboard.toast_api_save_failed', 'en', 'Could not save. Check your connection and try again.'),
  ('fs.dashboard.toast_api_save_failed', 'fr', 'Enregistrement impossible. Vérifiez la connexion.'),
  ('fs.dashboard.toast_api_save_failed', 'de', 'Speichern fehlgeschlagen. Verbindung prüfen und erneut versuchen.'),
  ('fs.dashboard.toast_api_save_failed', 'es', 'No se pudo guardar. Comprueba la conexión.'),
  ('fs.dashboard.toast_api_save_failed', 'pt', 'Não foi possível guardar. Verifique a ligação.'),
  ('fs.dashboard.toast_api_save_failed', 'ru', 'Не удалось сохранить. Проверьте подключение.'),
  ('fs.dashboard.toast_api_delete_failed', 'lv', 'Neizdevās dzēst. Pārbaudi savienojumu un mēģini vēlreiz.'),
  ('fs.dashboard.toast_api_delete_failed', 'en', 'Could not delete. Check your connection and try again.'),
  ('fs.dashboard.toast_api_delete_failed', 'fr', 'Suppression impossible. Vérifiez la connexion.'),
  ('fs.dashboard.toast_api_delete_failed', 'de', 'Löschen fehlgeschlagen. Verbindung prüfen und erneut versuchen.'),
  ('fs.dashboard.toast_api_delete_failed', 'es', 'No se pudo eliminar. Comprueba la conexión.'),
  ('fs.dashboard.toast_api_delete_failed', 'pt', 'Não foi possível eliminar. Verifique a ligação.'),
  ('fs.dashboard.toast_api_delete_failed', 'ru', 'Не удалось удалить. Проверьте подключение.'),
  ('fs.dashboard.notify_paid_today_single', 'lv', 'Maksājums atzīmēts. Nākamais termiņš: {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'en', 'Payment marked paid. Next due date: {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'fr', 'Paiement marqué comme payé. Prochaine échéance : {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'de', 'Zahlung als bezahlt markiert. Nächster Termin: {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'es', 'Pago marcado como pagado. Próximo vencimiento: {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'pt', 'Pagamento marcado como pago. Próximo vencimento: {date}.'),
  ('fs.dashboard.notify_paid_today_single', 'ru', 'Платёж отмечен как оплаченный. Следующая дата: {date}.'),
  ('fs.dashboard.notify_paid_today_multi', 'lv', '{count} šodienas maksājumi atzīmēti kā samaksāti.'),
  ('fs.dashboard.notify_paid_today_multi', 'en', '{count} payments due today marked as paid.'),
  ('fs.dashboard.notify_paid_today_multi', 'fr', '{count} paiements d''aujourd''hui marqués comme payés.'),
  ('fs.dashboard.notify_paid_today_multi', 'de', '{count} heute fällige Zahlungen als bezahlt markiert.'),
  ('fs.dashboard.notify_paid_today_multi', 'es', '{count} pagos de hoy marcados como pagados.'),
  ('fs.dashboard.notify_paid_today_multi', 'pt', '{count} pagamentos de hoje marcados como pagos.'),
  ('fs.dashboard.notify_paid_today_multi', 'ru', '{count} платежа сегодня отмечены как оплаченные.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
