-- Admin kategorijas: drag-and-drop un popularitāte (papildina 132_*)
-- Palaid pēc 132_site_translations_admin_categories.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'admin.categories_panel.hint_drag_reorder',
    'lv',
    'Velc rindas, lai mainītu kārtību panelī. Kad lietotāji izvēlas kategorijas, saraksts panelī automātiski kārtojas pēc popularitātes (izvēles skaits).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'en',
    'Drag rows to set the default order. As users pick categories, the dashboard list sorts by popularity (usage count).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'fr',
    'Faites glisser les lignes pour l’ordre par défaut. Le tableau de bord trie ensuite par popularité (nombre d’utilisations).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'de',
    'Zeilen ziehen für die Standardreihenfolge. Das Dashboard sortiert danach nach Nutzung (Anzahl).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'es',
    'Arrastre filas para el orden por defecto. El panel ordena luego por popularidad (usos).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'pt',
    'Arraste linhas para a ordem padrão. O painel ordena depois por popularidade (usos).'
  ),
  (
    'admin.categories_panel.hint_drag_reorder',
    'ru',
    'Перетащите строки для порядка. Список в панели сортируется по популярности (число использований).'
  ),
  ('admin.categories_panel.drag_handle_aria', 'lv', 'Velc, lai pārkārtotu'),
  ('admin.categories_panel.drag_handle_aria', 'en', 'Drag to reorder'),
  ('admin.categories_panel.drag_handle_aria', 'fr', 'Glisser pour réordonner'),
  ('admin.categories_panel.drag_handle_aria', 'de', 'Ziehen zum Sortieren'),
  ('admin.categories_panel.drag_handle_aria', 'es', 'Arrastrar para reordenar'),
  ('admin.categories_panel.drag_handle_aria', 'pt', 'Arrastar para reordenar'),
  ('admin.categories_panel.drag_handle_aria', 'ru', 'Перетащить для сортировки'),
  ('admin.categories_panel.toast_reordered', 'lv', 'Kārtība saglabāta'),
  ('admin.categories_panel.toast_reordered', 'en', 'Order saved'),
  ('admin.categories_panel.toast_reordered', 'fr', 'Ordre enregistré'),
  ('admin.categories_panel.toast_reordered', 'de', 'Reihenfolge gespeichert'),
  ('admin.categories_panel.toast_reordered', 'es', 'Orden guardado'),
  ('admin.categories_panel.toast_reordered', 'pt', 'Ordem guardada'),
  ('admin.categories_panel.toast_reordered', 'ru', 'Порядок сохранён'),
  ('admin.categories_panel.usage_count_abbr', 'lv', 'lietojumi'),
  ('admin.categories_panel.usage_count_abbr', 'en', 'uses'),
  ('admin.categories_panel.usage_count_abbr', 'fr', 'util.'),
  ('admin.categories_panel.usage_count_abbr', 'de', 'Nutzung'),
  ('admin.categories_panel.usage_count_abbr', 'es', 'usos'),
  ('admin.categories_panel.usage_count_abbr', 'pt', 'usos'),
  ('admin.categories_panel.usage_count_abbr', 'ru', 'исп.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
