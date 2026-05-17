-- SubTrack: kalendāra slēdzis „Visi maksājumi” (ieslēdzot – ar „atzīmēts samaksāts” dienām).

-- Palaid pēc `012`. Idempotenti.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.cal_toggle_all_payments_label', 'lv', 'Visi maksājumi'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'en', 'All payments'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'fr', 'Tous les paiements'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'de', 'Alle Zahlungen'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'es', 'Todos los pagos'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'pt', 'Todos os pagamentos'),
  ('fs.dashboard.cal_toggle_all_payments_label', 'ru', 'Все платежи'),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'lv',
    'Ieslēdzot, kalendārā redzami arī tie termiņi, kur atzīmēts samaksāts. Izslēdzot, tikai gaidāmie un kavētie apmaksas datumi.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'en',
    'When on, the calendar also shows days where you marked a payment as paid. When off, only unpaid due and overdue dates.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'fr',
    'Activé: le calendrier inclut aussi les jours marqués comme payés. Désactivé: uniquement les échéances à venir ou en retard.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'de',
    'Ein: Kalender zeigt auch Tage mit „bezahlt markiert“. Aus: nur fällige und überfällige Termine.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'es',
    'Activado: el calendario incluye también los días marcados como pagados. Desactivado: solo fechas pendientes y vencidas.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'pt',
    'Ativado: o calendário também mostra dias marcados como pagos. Desativado: apenas vencimentos em aberto e atrasados.'
  ),
  (
    'fs.dashboard.cal_toggle_all_payments_hint',
    'ru',
    'Вкл.: в календаре также отображаются дни с отметкой «оплачено». Выкл.: только предстоящие и просроченные сроки.'
  )
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
