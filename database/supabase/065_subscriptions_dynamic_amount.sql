-- Dinamiskā summa: abonementam var mainīt mēneša summu bez pilna labojuma modāļa.

alter table public.subscriptions
  add column if not exists is_dynamic_amount boolean not null default false;

comment on column public.subscriptions.is_dynamic_amount is
  'Ja true, summa var mainīties katru periodu (piem. komunālie); panelī rāda „Mainīt summu”.';

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.label_dynamic_amount', 'lv', 'Dinamiskais maksājums'),
  ('fs.dashboard.label_dynamic_amount', 'en', 'Dynamic payment'),
  ('fs.dashboard.label_dynamic_amount', 'fr', 'Paiement dynamique'),
  ('fs.dashboard.label_dynamic_amount', 'de', 'Dynamische Zahlung'),
  ('fs.dashboard.label_dynamic_amount', 'es', 'Pago dinámico'),
  ('fs.dashboard.label_dynamic_amount', 'pt', 'Pagamento dinâmico'),
  ('fs.dashboard.label_dynamic_amount', 'ru', 'Динамический платёж'),
  (
    'fs.dashboard.hint_dynamic_amount',
    'lv',
    'Summa var atšķirties katru mēnesi; sarakstā var ātri mainīt summu bez visa ieraksta labošanas.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'en',
    'The amount may change each month; use „Change amount” in the list without opening the full edit form.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'fr',
    'Le montant peut changer chaque mois; modifiez-le depuis la liste sans ouvrir le formulaire complet.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'de',
    'Der Betrag kann monatlich wechseln; in der Liste „Betrag ändern” ohne vollständiges Bearbeiten.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'es',
    'El importe puede cambiar cada mes; cámbielo desde la lista sin abrir el formulario completo.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'pt',
    'O valor pode mudar a cada mês; altere-o na lista sem abrir o formulário completo.'
  ),
  (
    'fs.dashboard.hint_dynamic_amount',
    'ru',
    'Сумма может меняться каждый месяц; измените её в списке без полного редактирования.'
  ),
  ('fs.dashboard.tooltip_change_amount', 'lv', 'Mainīt summu'),
  ('fs.dashboard.tooltip_change_amount', 'en', 'Change amount'),
  ('fs.dashboard.tooltip_change_amount', 'fr', 'Modifier le montant'),
  ('fs.dashboard.tooltip_change_amount', 'de', 'Betrag ändern'),
  ('fs.dashboard.tooltip_change_amount', 'es', 'Cambiar importe'),
  ('fs.dashboard.tooltip_change_amount', 'pt', 'Alterar valor'),
  ('fs.dashboard.tooltip_change_amount', 'ru', 'Изменить сумму'),
  ('fs.dashboard.aria_change_amount', 'lv', 'Mainīt summu'),
  ('fs.dashboard.aria_change_amount', 'en', 'Change amount'),
  ('fs.dashboard.aria_change_amount', 'fr', 'Modifier le montant'),
  ('fs.dashboard.aria_change_amount', 'de', 'Betrag ändern'),
  ('fs.dashboard.aria_change_amount', 'es', 'Cambiar importe'),
  ('fs.dashboard.aria_change_amount', 'pt', 'Alterar valor'),
  ('fs.dashboard.aria_change_amount', 'ru', 'Изменить сумму'),
  ('fs.dashboard.toast_amount_updated', 'lv', 'Summa atjaunināta'),
  ('fs.dashboard.toast_amount_updated', 'en', 'Amount updated'),
  ('fs.dashboard.toast_amount_updated', 'fr', 'Montant mis à jour'),
  ('fs.dashboard.toast_amount_updated', 'de', 'Betrag aktualisiert'),
  ('fs.dashboard.toast_amount_updated', 'es', 'Importe actualizado'),
  ('fs.dashboard.toast_amount_updated', 'pt', 'Valor atualizado'),
  ('fs.dashboard.toast_amount_updated', 'ru', 'Сумма обновлена')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
