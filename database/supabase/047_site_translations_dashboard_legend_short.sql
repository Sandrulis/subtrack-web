-- Kalendāra leģenda: īsāki, paralēli statusi (panelis + landing mock).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.mock.legend_due', 'lv', 'gaidāmais'),
  ('landing.mock.legend_due', 'en', 'upcoming'),
  ('landing.mock.legend_due', 'fr', 'à venir'),
  ('landing.mock.legend_due', 'de', 'fällig'),
  ('landing.mock.legend_due', 'es', 'próximo'),
  ('landing.mock.legend_due', 'pt', 'próximo'),
  ('landing.mock.legend_due', 'ru', 'предстоящий'),

  ('landing.mock.legend_overdue', 'lv', 'kavētais'),
  ('landing.mock.legend_overdue', 'en', 'overdue'),
  ('landing.mock.legend_overdue', 'fr', 'en retard'),
  ('landing.mock.legend_overdue', 'de', 'überfällig'),
  ('landing.mock.legend_overdue', 'es', 'vencido'),
  ('landing.mock.legend_overdue', 'pt', 'em atraso'),
  ('landing.mock.legend_overdue', 'ru', 'просроченный'),

  ('fs.dashboard.legend_paid_marked', 'lv', 'samaksātais'),
  ('fs.dashboard.legend_paid_marked', 'en', 'paid'),
  ('fs.dashboard.legend_paid_marked', 'fr', 'payé'),
  ('fs.dashboard.legend_paid_marked', 'de', 'bezahlt'),
  ('fs.dashboard.legend_paid_marked', 'es', 'pagado'),
  ('fs.dashboard.legend_paid_marked', 'pt', 'pago'),
  ('fs.dashboard.legend_paid_marked', 'ru', 'оплаченный')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
