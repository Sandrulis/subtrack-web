-- Dinamiskam maksājumam: pēc „Samaksāts” nākamajam termiņam rādīt iepriekšējā perioda bāzes summu.

alter table public.subscriptions
  add column if not exists is_dynamic_carry_previous boolean not null default false;

comment on column public.subscriptions.is_dynamic_carry_previous is
  'Ja is_dynamic_amount: pēc apmaksas nākamajam next_payment_date saglabā iepriekšējā perioda bāzes summu kā due_amount_override.';

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'lv',
    'Nākamajam: iepriekšējā summa'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'en',
    'Next entry: previous amount'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'fr',
    'Suivant : montant précédent'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'de',
    'Nächster Eintrag: vorheriger Betrag'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'es',
    'Siguiente: importe anterior'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'pt',
    'Próximo: valor anterior'
  ),
  (
    'fs.dashboard.label_dynamic_carry_previous',
    'ru',
    'Следующий: сумма прошлого периода'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'lv',
    'Pēc „Samaksāts” nākamajā termiņā tiek rādīta iepriekšējā perioda summa (nevis tikai iestatījumu summa).'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'en',
    'After „Mark paid”, the next due date shows the previous period''s amount (not only the amount from settings).'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'fr',
    'Après „Marquer payé”, l''échéance suivante reprend le montant de la période précédente.'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'de',
    'Nach „Als bezahlt markieren” zeigt der nächste Termin den Betrag der vorherigen Periode.'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'es',
    'Tras „Marcar pagado”, el siguiente vencimiento muestra el importe del periodo anterior.'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'pt',
    'Após „Marcar pago”, o próximo vencimento mostra o valor do período anterior.'
  ),
  (
    'fs.dashboard.hint_dynamic_carry_previous',
    'ru',
    'После „Отметить оплаченным” следующий срок показывает сумму прошлого периода.'
  )
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
