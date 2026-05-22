-- Admin uzdevumi: pabeigšanas poga un apstiprinājuma modālis (bez Pabeigts kolonnas).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.todos.complete', 'lv', 'Pabeigt'),
  ('admin.todos.complete', 'en', 'Complete'),
  ('admin.todos.complete', 'fr', 'Terminer'),
  ('admin.todos.complete', 'de', 'Abschließen'),
  ('admin.todos.complete', 'es', 'Completar'),
  ('admin.todos.complete', 'pt', 'Concluir'),
  ('admin.todos.complete', 'ru', 'Завершить'),
  ('admin.todos.complete_confirm', 'lv', 'Vai uzdevums ir pabeigts?'),
  ('admin.todos.complete_confirm', 'en', 'Is this task completed?'),
  ('admin.todos.complete_confirm', 'fr', 'Cette tâche est-elle terminée ?'),
  ('admin.todos.complete_confirm', 'de', 'Ist diese Aufgabe erledigt?'),
  ('admin.todos.complete_confirm', 'es', '¿Está completada esta tarea?'),
  ('admin.todos.complete_confirm', 'pt', 'Esta tarefa está concluída?'),
  ('admin.todos.complete_confirm', 'ru', 'Задача выполнена?'),
  ('admin.todos.toast.completed', 'lv', 'Uzdevums pabeigts'),
  ('admin.todos.toast.completed', 'en', 'Task completed'),
  ('admin.todos.toast.completed', 'fr', 'Tâche terminée'),
  ('admin.todos.toast.completed', 'de', 'Aufgabe abgeschlossen'),
  ('admin.todos.toast.completed', 'es', 'Tarea completada'),
  ('admin.todos.toast.completed', 'pt', 'Tarefa concluída'),
  ('admin.todos.toast.completed', 'ru', 'Задача завершена')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();
