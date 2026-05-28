-- Jaunas maksājumu kategorijas + tulkojumi (lv, en, fr, de, es, pt, ru).
-- Palaid pēc 131_subscription_categories.sql un 134_subscription_categories_usage_count.sql.

insert into
  public.subscription_categories (category_key, label, sort_order, enabled)
select
  v.category_key,
  v.label,
  v.sort_order,
  true
from
  (
    values
      ('sports', 'Sportss', 70),
      ('education', 'Izglītība', 80),
      ('utilities', 'Komunālie maksājumi', 90),
      ('auto', 'Auto', 100),
      ('food', 'Ēdiens', 110),
      ('health', 'Veselība', 120)
  ) as v(category_key, label, sort_order)
where not exists (
  select
    1
  from public.subscription_categories c
  where lower(c.category_key) = lower(v.category_key)
);

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('subscription.category.sports', 'lv', 'Sportss'),
  ('subscription.category.sports', 'en', 'Sports'),
  ('subscription.category.sports', 'fr', 'Sport'),
  ('subscription.category.sports', 'de', 'Sport'),
  ('subscription.category.sports', 'es', 'Deporte'),
  ('subscription.category.sports', 'pt', 'Desporto'),
  ('subscription.category.sports', 'ru', 'Спорт'),
  ('subscription.category.education', 'lv', 'Izglītība'),
  ('subscription.category.education', 'en', 'Education'),
  ('subscription.category.education', 'fr', 'Éducation'),
  ('subscription.category.education', 'de', 'Bildung'),
  ('subscription.category.education', 'es', 'Educación'),
  ('subscription.category.education', 'pt', 'Educação'),
  ('subscription.category.education', 'ru', 'Образование'),
  ('subscription.category.utilities', 'lv', 'Komunālie maksājumi'),
  ('subscription.category.utilities', 'en', 'Utilities'),
  ('subscription.category.utilities', 'fr', 'Charges locatives'),
  ('subscription.category.utilities', 'de', 'Nebenkosten'),
  ('subscription.category.utilities', 'es', 'Servicios'),
  ('subscription.category.utilities', 'pt', 'Utilidades'),
  ('subscription.category.utilities', 'ru', 'Коммунальные платежи'),
  ('subscription.category.auto', 'lv', 'Auto'),
  ('subscription.category.auto', 'en', 'Car'),
  ('subscription.category.auto', 'fr', 'Automobile'),
  ('subscription.category.auto', 'de', 'Auto'),
  ('subscription.category.auto', 'es', 'Automóvil'),
  ('subscription.category.auto', 'pt', 'Automóvel'),
  ('subscription.category.auto', 'ru', 'Автомобиль'),
  ('subscription.category.food', 'lv', 'Ēdiens'),
  ('subscription.category.food', 'en', 'Food'),
  ('subscription.category.food', 'fr', 'Alimentation'),
  ('subscription.category.food', 'de', 'Lebensmittel'),
  ('subscription.category.food', 'es', 'Alimentación'),
  ('subscription.category.food', 'pt', 'Alimentação'),
  ('subscription.category.food', 'ru', 'Питание'),
  ('subscription.category.health', 'lv', 'Veselība'),
  ('subscription.category.health', 'en', 'Health'),
  ('subscription.category.health', 'fr', 'Santé'),
  ('subscription.category.health', 'de', 'Gesundheit'),
  ('subscription.category.health', 'es', 'Salud'),
  ('subscription.category.health', 'pt', 'Saúde'),
  ('subscription.category.health', 'ru', 'Здоровье')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
