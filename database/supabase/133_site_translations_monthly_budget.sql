-- Iestatījumi: mēneša budžets; panelis: budžeta atlikums
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('settings.section_budget', 'lv', 'Budžets'),
  ('settings.section_budget', 'en', 'Budget'),
  ('settings.section_budget', 'fr', 'Budget'),
  ('settings.section_budget', 'de', 'Budget'),
  ('settings.section_budget', 'es', 'Presupuesto'),
  ('settings.section_budget', 'pt', 'Orçamento'),
  ('settings.section_budget', 'ru', 'Бюджет'),

  ('settings.label_monthly_budget', 'lv', 'Mēneša budžets'),
  ('settings.label_monthly_budget', 'en', 'Monthly budget'),
  ('settings.label_monthly_budget', 'fr', 'Budget mensuel'),
  ('settings.label_monthly_budget', 'de', 'Monatsbudget'),
  ('settings.label_monthly_budget', 'es', 'Presupuesto mensual'),
  ('settings.label_monthly_budget', 'pt', 'Orçamento mensal'),
  ('settings.label_monthly_budget', 'ru', 'Месячный бюджет'),

  ('settings.placeholder_monthly_budget', 'lv', 'piem. 500'),
  ('settings.placeholder_monthly_budget', 'en', 'e.g. 500'),
  ('settings.placeholder_monthly_budget', 'fr', 'ex. 500'),
  ('settings.placeholder_monthly_budget', 'de', 'z. B. 500'),
  ('settings.placeholder_monthly_budget', 'es', 'p. ej. 500'),
  ('settings.placeholder_monthly_budget', 'pt', 'ex. 500'),
  ('settings.placeholder_monthly_budget', 'ru', 'напр. 500'),

  (
    'settings.hint_monthly_budget',
    'lv',
    'Ja norādīts, panelī redzēsi atlikumu no budžeta salīdzinājumā ar kopējo mēneša summu.'
  ),
  (
    'settings.hint_monthly_budget',
    'en',
    'If set, the dashboard shows how much budget you have left compared to your total monthly amount.'
  ),
  (
    'settings.hint_monthly_budget',
    'fr',
    'Si renseigné, le tableau de bord affiche le reste de votre budget par rapport au total mensuel.'
  ),
  (
    'settings.hint_monthly_budget',
    'de',
    'Wenn gesetzt, zeigt das Dashboard den verbleibenden Budgetrest im Vergleich zur monatlichen Summe.'
  ),
  (
    'settings.hint_monthly_budget',
    'es',
    'Si lo indicas, el panel muestra cuánto presupuesto te queda frente al total mensual.'
  ),
  (
    'settings.hint_monthly_budget',
    'pt',
    'Se definido, o painel mostra quanto orçamento resta face ao total mensal.'
  ),
  (
    'settings.hint_monthly_budget',
    'ru',
    'Если указано, на панели показывается остаток бюджета относительно общей месячной суммы.'
  ),

  ('fs.dashboard.stat_budget_remaining_label', 'lv', 'Budžeta atlikums'),
  ('fs.dashboard.stat_budget_remaining_label', 'en', 'Budget remaining'),
  ('fs.dashboard.stat_budget_remaining_label', 'fr', 'Reste du budget'),
  ('fs.dashboard.stat_budget_remaining_label', 'de', 'Budgetrest'),
  ('fs.dashboard.stat_budget_remaining_label', 'es', 'Presupuesto restante'),
  ('fs.dashboard.stat_budget_remaining_label', 'pt', 'Orçamento restante'),
  ('fs.dashboard.stat_budget_remaining_label', 'ru', 'Остаток бюджета'),

  ('fs.dashboard.stat_budget_remaining_note', 'lv', 'atlicis'),
  ('fs.dashboard.stat_budget_remaining_note', 'en', 'remaining'),
  ('fs.dashboard.stat_budget_remaining_note', 'fr', 'restant'),
  ('fs.dashboard.stat_budget_remaining_note', 'de', 'übrig'),
  ('fs.dashboard.stat_budget_remaining_note', 'es', 'restante'),
  ('fs.dashboard.stat_budget_remaining_note', 'pt', 'restante'),
  ('fs.dashboard.stat_budget_remaining_note', 'ru', 'осталось'),

  ('fs.dashboard.stat_budget_over_note', 'lv', 'pārsniegts'),
  ('fs.dashboard.stat_budget_over_note', 'en', 'over budget'),
  ('fs.dashboard.stat_budget_over_note', 'fr', 'dépassé'),
  ('fs.dashboard.stat_budget_over_note', 'de', 'überschritten'),
  ('fs.dashboard.stat_budget_over_note', 'es', 'superado'),
  ('fs.dashboard.stat_budget_over_note', 'pt', 'excedido'),
  ('fs.dashboard.stat_budget_over_note', 'ru', 'превышен'),

  ('fs.dashboard.stat_budget_progress_aria', 'lv', 'Izlietots no budžeta'),
  ('fs.dashboard.stat_budget_progress_aria', 'en', 'Budget used'),
  ('fs.dashboard.stat_budget_progress_aria', 'fr', 'Budget utilisé'),
  ('fs.dashboard.stat_budget_progress_aria', 'de', 'Budget verbraucht'),
  ('fs.dashboard.stat_budget_progress_aria', 'es', 'Presupuesto usado'),
  ('fs.dashboard.stat_budget_progress_aria', 'pt', 'Orçamento usado'),
  ('fs.dashboard.stat_budget_progress_aria', 'ru', 'Использовано бюджета')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
