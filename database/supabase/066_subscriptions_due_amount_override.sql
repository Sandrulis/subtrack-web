-- Dinamiskam maksājumam: summa tikai tekošajam termiņam (next_payment_date); nākamais periods – atkal `amount`.

alter table public.subscriptions
  add column if not exists due_amount_override numeric(12, 2),
  add column if not exists due_amount_override_for date;

comment on column public.subscriptions.due_amount_override is
  'Bāzes summa tikai periodam `due_amount_override_for` (ja `is_dynamic_amount`).';

comment on column public.subscriptions.due_amount_override_for is
  'Termiņa datums, kam attiecas `due_amount_override` (parasti = next_payment_date).';

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'fs.dashboard.hint_dynamic_amount',
    'lv',
    'Summa var atšķirties katru mēnesi. „Mainīt summu” maina tikai tekošā termiņa summu; nākamajam periodam atkal tiek izmantota iestatījumu summa.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'en',
    'The amount may change each month. „Change amount” updates only the current due period; the next period uses the amount from settings again.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'fr',
    'Le montant peut changer chaque mois. „Modifier le montant” ne concerne que l''échéance en cours; la suivante reprend le montant des paramètres.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'de',
    'Der Betrag kann monatlich wechseln. „Betrag ändern” gilt nur für die aktuelle Fälligkeit; die nächste Periode nutzt wieder den Betrag aus den Einstellungen.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'es',
    'El importe puede cambiar cada mes. „Cambiar importe” solo afecta al vencimiento actual; el siguiente periodo vuelve al importe de la configuración.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'pt',
    'O valor pode mudar a cada mês. „Alterar valor” aplica-se só ao vencimento atual; o período seguinte volta ao valor das definições.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'ru',
    'Сумма может меняться каждый месяц. „Изменить сумму” действует только на текущий срок; следующий период снова берёт сумму из настроек.'
  )
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
