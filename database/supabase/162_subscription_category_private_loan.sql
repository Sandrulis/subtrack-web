-- Kategorija „Privātais aizdevums” (aizstāj atsevišķo slēdzi formā).
-- Palaid pēc 161_private_loan.sql.

insert into public.subscription_categories (category_key, label, sort_order, enabled)
select 'private_loan', 'Privātais aizdevums', 45, true
where not exists (
  select 1
  from public.subscription_categories c
  where lower(c.category_key) = 'private_loan'
);

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('subscription.category.private_loan', 'lv', 'Privātais aizdevums'),
  ('subscription.category.private_loan', 'en', 'Private loan'),
  ('subscription.category.private_loan', 'fr', 'Prêt privé'),
  ('subscription.category.private_loan', 'de', 'Privatkredit'),
  ('subscription.category.private_loan', 'es', 'Préstamo privado'),
  ('subscription.category.private_loan', 'pt', 'Empréstimo privado'),
  ('subscription.category.private_loan', 'ru', 'Частный займ')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
