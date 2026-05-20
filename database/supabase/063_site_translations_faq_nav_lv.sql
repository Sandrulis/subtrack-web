-- FAQ navigācija / sadaļa LV (iepriekš visās valodās atstāts "FAQ")

INSERT INTO public.site_translations (translation_key, locale, value)

VALUES

  ('nav.faq_nav', 'lv', 'BUJ'),

  ('mobile.aria.faq', 'lv', 'Biežāk uzdotie jautājumi'),

  ('landing.faq.label', 'lv', 'BUJ')

ON CONFLICT (translation_key, locale) DO UPDATE SET

  value = EXCLUDED.value;


