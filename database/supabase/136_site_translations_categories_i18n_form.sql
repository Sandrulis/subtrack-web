-- Admin kategorijas: daudzvalodu formas (papildina 135_*)
-- Palaid pēc 135_site_translations_categories_drag.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.categories_panel.translations_section_title', 'lv', 'Tulkojumi'),
  ('admin.categories_panel.translations_section_title', 'en', 'Translations'),
  ('admin.categories_panel.translations_section_title', 'fr', 'Traductions'),
  ('admin.categories_panel.translations_section_title', 'de', 'Übersetzungen'),
  ('admin.categories_panel.translations_section_title', 'es', 'Traducciones'),
  ('admin.categories_panel.translations_section_title', 'pt', 'Traduções'),
  ('admin.categories_panel.translations_section_title', 'ru', 'Переводы'),
  (
    'admin.categories_panel.translations_after_key_hint',
    'lv',
    'Ievadi atslēgu, lai parādītu tulkojumu laukus visām valodām.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'en',
    'Enter a key to show translation fields for all languages.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'fr',
    'Saisissez une clé pour afficher les champs de traduction pour toutes les langues.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'de',
    'Schlüssel eingeben, um Übersetzungsfelder für alle Sprachen anzuzeigen.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'es',
    'Introduzca una clave para mostrar los campos de traducción en todos los idiomas.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'pt',
    'Introduza uma chave para mostrar os campos de tradução em todos os idiomas.'
  ),
  (
    'admin.categories_panel.translations_after_key_hint',
    'ru',
    'Введите ключ, чтобы показать поля перевода для всех языков.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'lv',
    'Obligāts vismaz noklusējuma valodā ({code}). Tukšs lauks noņem tulkojumu.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'en',
    'Required at least in the default language ({code}). Empty field removes that translation.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'fr',
    'Obligatoire au moins dans la langue par défaut ({code}). Un champ vide supprime la traduction.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'de',
    'Mindestens in der Standardsprache ({code}) erforderlich. Leeres Feld entfernt die Übersetzung.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'es',
    'Obligatorio al menos en el idioma predeterminado ({code}). Campo vacío elimina la traducción.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'pt',
    'Obrigatório pelo menos no idioma predefinido ({code}). Campo vazio remove a tradução.'
  ),
  (
    'admin.categories_panel.translations_hint',
    'ru',
    'Обязательно хотя бы на языке по умолчанию ({code}). Пустое поле удаляет перевод.'
  ),
  ('admin.categories_panel.modal_edit_title', 'lv', 'Labot kategoriju'),
  ('admin.categories_panel.modal_edit_title', 'en', 'Edit category'),
  ('admin.categories_panel.modal_edit_title', 'fr', 'Modifier la catégorie'),
  ('admin.categories_panel.modal_edit_title', 'de', 'Kategorie bearbeiten'),
  ('admin.categories_panel.modal_edit_title', 'es', 'Editar categoría'),
  ('admin.categories_panel.modal_edit_title', 'pt', 'Editar categoria'),
  ('admin.categories_panel.modal_edit_title', 'ru', 'Изменить категорию')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
