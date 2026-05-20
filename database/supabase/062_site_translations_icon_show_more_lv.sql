-- Poga zem ikonu hintu rindas (pievienošanas modālis)

INSERT INTO public.site_translations (translation_key, locale, value)

VALUES

  ('fs.dashboard.icon_show_all', 'lv', 'Parādīt vairāk')

ON CONFLICT (translation_key, locale) DO UPDATE SET

  value = EXCLUDED.value;


