-- Gada cena no admin lauka; {discount} aprēķina aplikācija.
-- Palaid pēc 103_paid_plan_annual_price.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.forms.label_paid_plan_annual_price', 'lv', 'Gada cena (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'en', 'Annual price (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'fr', 'Prix annuel (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'de', 'Jahrespreis (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'es', 'Precio anual (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'pt', 'Preço anual (EUR)'),
  ('admin.forms.label_paid_plan_annual_price', 'ru', 'Годовая цена (EUR)'),

  ('admin.forms.paid_plan_annual_hint', 'lv', 'Norādi gada cenu. Atlaide % tiek aprēķināta pret 12× mēneša cenu un rādās tikai, ja gada summa ir zemāka.'),
  ('admin.forms.paid_plan_annual_hint', 'en', 'Enter the annual price. The discount % is calculated vs 12× the monthly price and shown only when the year total is lower.'),
  ('admin.forms.paid_plan_annual_hint', 'fr', 'Indiquez le prix annuel. Le % de réduction est calculé par rapport à 12× le prix mensuel et affiché seulement si le total annuel est inférieur.'),
  ('admin.forms.paid_plan_annual_hint', 'de', 'Jahrespreis eingeben. Der Rabatt-% wird gegenüber 12× Monatspreis berechnet und nur angezeigt, wenn die Jahressumme niedriger ist.'),
  ('admin.forms.paid_plan_annual_hint', 'es', 'Indica el precio anual. El % de descuento se calcula frente a 12× el precio mensual y solo se muestra si el total anual es menor.'),
  ('admin.forms.paid_plan_annual_hint', 'pt', 'Indique o preço anual. O desconto % é calculado face a 12× o preço mensal e só aparece se o total anual for inferior.'),
  ('admin.forms.paid_plan_annual_hint', 'ru', 'Укажите годовую цену. Скидка % считается от 12× месячной цены и показывается только если годовая сумма ниже.'),

  ('admin.forms.paid_plan_annual_hint_discount', 'lv', 'Aprēķinātā atlaide: {discount}% (12× mēneša cena → gada summa).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'en', 'Calculated discount: {discount}% (12× monthly → annual total).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'fr', 'Réduction calculée : {discount} % (12× mensuel → total annuel).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'de', 'Berechneter Rabatt: {discount} % (12× Monat → Jahressumme).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'es', 'Descuento calculado: {discount}% (12× mensual → total anual).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'pt', 'Desconto calculado: {discount}% (12× mensal → total anual).'),
  ('admin.forms.paid_plan_annual_hint_discount', 'ru', 'Расчётная скидка: {discount}% (12× месяц → годовая сумма).'),

  ('admin.forms.err_paid_plan_annual_price', 'lv', 'Norādi derīgu gada cenu (0,01–9999,99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'en', 'Enter a valid annual price (0.01–9999.99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'fr', 'Indiquez un prix annuel valide (0,01–9999,99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'de', 'Gültigen Jahrespreis eingeben (0,01–9999,99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'es', 'Indica un precio anual válido (0,01–9999,99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'pt', 'Indique um preço anual válido (0,01–9999,99 EUR).'),
  ('admin.forms.err_paid_plan_annual_price', 'ru', 'Укажите годовую цену от 0,01 до 9999,99 EUR.'),

  ('landing.pricing.annual_line', 'lv', 'Gads: {annual}'),
  ('landing.pricing.annual_line', 'en', 'Year: {annual}'),
  ('landing.pricing.annual_line', 'fr', 'An : {annual}'),
  ('landing.pricing.annual_line', 'de', 'Jahr: {annual}'),
  ('landing.pricing.annual_line', 'es', 'Año: {annual}'),
  ('landing.pricing.annual_line', 'pt', 'Ano: {annual}'),
  ('landing.pricing.annual_line', 'ru', 'Год: {annual}'),

  ('landing.pricing.annual_discount', 'lv', ' ({discount}% atlaide)'),
  ('landing.pricing.annual_discount', 'en', ' ({discount}% off)'),
  ('landing.pricing.annual_discount', 'fr', ' (−{discount} %)'),
  ('landing.pricing.annual_discount', 'de', ' ({discount}% Rabatt)'),
  ('landing.pricing.annual_discount', 'es', ' ({discount}% dto.)'),
  ('landing.pricing.annual_discount', 'pt', ' ({discount}% desconto)'),
  ('landing.pricing.annual_discount', 'ru', ' (скидка {discount}%)'),

  ('subscribe.price.annual_line', 'lv', 'Gads: {annual}'),
  ('subscribe.price.annual_line', 'en', 'Year: {annual}'),
  ('subscribe.price.annual_line', 'fr', 'An : {annual}'),
  ('subscribe.price.annual_line', 'de', 'Jahr: {annual}'),
  ('subscribe.price.annual_line', 'es', 'Año: {annual}'),
  ('subscribe.price.annual_line', 'pt', 'Ano: {annual}'),
  ('subscribe.price.annual_line', 'ru', 'Год: {annual}'),

  ('subscribe.price.annual_discount', 'lv', ' ({discount}% atlaide)'),
  ('subscribe.price.annual_discount', 'en', ' ({discount}% off)'),
  ('subscribe.price.annual_discount', 'fr', ' (−{discount} %)'),
  ('subscribe.price.annual_discount', 'de', ' ({discount}% Rabatt)'),
  ('subscribe.price.annual_discount', 'es', ' ({discount}% dto.)'),
  ('subscribe.price.annual_discount', 'pt', ' ({discount}% desconto)'),
  ('subscribe.price.annual_discount', 'ru', ' (скидка {discount}%)')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
