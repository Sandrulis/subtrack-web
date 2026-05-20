-- Panelis: kategoriju progresa josla virs saraksta (aria).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.category_bar_aria', 'lv', 'Kopējā summa sadalījumā pa kategorijām'),
  ('fs.dashboard.category_bar_aria', 'en', 'Total amount split by category'),
  ('fs.dashboard.category_bar_aria', 'fr', 'Montant total réparti par catégorie'),
  ('fs.dashboard.category_bar_aria', 'de', 'Gesamtbetrag nach Kategorie'),
  ('fs.dashboard.category_bar_aria', 'es', 'Importe total por categoría'),
  ('fs.dashboard.category_bar_aria', 'pt', 'Total repartido por categoria'),
  ('fs.dashboard.category_bar_aria', 'ru', 'Общая сумма по категориям')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;
