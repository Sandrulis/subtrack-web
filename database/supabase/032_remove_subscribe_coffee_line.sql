-- Noņem nepiesaistīto subscribe.coffee.line pēc Pro lapas kopsavilkuma teksta maiņas.

DELETE FROM public.site_translations
WHERE translation_key = 'subscribe.coffee.line';
