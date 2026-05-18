-- Noņem nepiesaistītās tulkošanas atslēgas pēc Pro lapas „Maksāšana drīzumā” bloka noņemšanas.

DELETE FROM public.site_translations
WHERE translation_key IN ('subscribe.cta.coming', 'subscribe.cta.note');
