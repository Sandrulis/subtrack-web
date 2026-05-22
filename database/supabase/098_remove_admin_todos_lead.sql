-- Noņem neizmantotos admin.todos.lead un admin.todos.done_ttl_hint (UI vairs nerāda).
DELETE FROM public.site_translations
WHERE translation_key IN ('admin.todos.lead', 'admin.todos.done_ttl_hint');
