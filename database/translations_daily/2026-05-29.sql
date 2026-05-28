-- Admin: maksājumu kategorijas (lv, en, ru). Pilns komplekts (visas valodas): database/supabase/132_site_translations_admin_categories.sql

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.nav.categories', 'lv', 'Kategorijas'),
  ('admin.nav.categories', 'en', 'Categories'),
  ('admin.nav.categories', 'ru', 'Категории'),
  ('meta.title.admin.categories', 'lv', 'Kategorijas'),
  ('meta.title.admin.categories', 'en', 'Categories'),
  ('meta.title.admin.categories', 'ru', 'Категории'),
  ('admin.categories.heading', 'lv', 'Maksājumu kategorijas'),
  ('admin.categories.heading', 'en', 'Payment categories'),
  ('admin.categories.heading', 'ru', 'Категории платежей'),
  (
    'admin.categories.lead',
    'lv',
    'Katalogs panelī un API. Tehniskā atslēga (category_key) glabājas maksājumu ierakstos.'
  ),
  (
    'admin.categories.lead',
    'en',
    'Catalog for the dashboard and API. The technical key (category_key) is stored on payments.'
  ),
  (
    'admin.categories.lead',
    'ru',
    'Каталог для панели и API. Технический ключ (category_key) хранится в платежах.'
  ),
  ('admin.categories_panel.new_title', 'lv', 'Jauna kategorija'),
  ('admin.categories_panel.new_title', 'en', 'New category'),
  ('admin.categories_panel.new_title', 'ru', 'Новая категория'),
  ('admin.categories_panel.add_btn', 'lv', 'Pievienot'),
  ('admin.categories_panel.add_btn', 'en', 'Add'),
  ('admin.categories_panel.add_btn', 'ru', 'Добавить'),
  (
    'admin.categories_panel.confirm_delete',
    'lv',
    'Dzēst kategoriju „{label}” (atslēga {key})?'
  ),
  (
    'admin.categories_panel.confirm_delete',
    'en',
    'Delete category „{label}” (key {key})?'
  ),
  (
    'admin.categories_panel.confirm_delete',
    'ru',
    'Удалить категорию „{label}” (ключ {key})?'
  ),
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
    'ru',
    'Перетащите строки для порядка по умолчанию. По мере выбора категорий список в панели сортируется по популярности (число использований).'
  ),
  ('admin.categories_panel.drag_handle_aria', 'lv', 'Velc, lai pārkārtotu'),
  ('admin.categories_panel.drag_handle_aria', 'en', 'Drag to reorder'),
  ('admin.categories_panel.drag_handle_aria', 'ru', 'Перетащить для сортировки'),
  ('admin.categories_panel.toast_reordered', 'lv', 'Kārtība saglabāta'),
  ('admin.categories_panel.toast_reordered', 'en', 'Order saved'),
  ('admin.categories_panel.toast_reordered', 'ru', 'Порядок сохранён'),
  ('admin.categories_panel.usage_count_abbr', 'lv', 'lietojumi'),
  ('admin.categories_panel.usage_count_abbr', 'en', 'uses'),
  ('admin.categories_panel.usage_count_abbr', 'ru', 'исп.'),
  (
    'admin.categories_panel.translations_section_title',
    'lv',
    'Tulkojumi'
  ),
  (
    'admin.categories_panel.translations_section_title',
    'en',
    'Translations'
  ),
  (
    'admin.categories_panel.translations_section_title',
    'ru',
    'Переводы'
  ),
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
    'ru',
    'Обязательно хотя бы на языке по умолчанию ({code}). Пустое поле удаляет перевод.'
  ),
  ('admin.categories_panel.modal_edit_title', 'lv', 'Labot kategoriju'),
  ('admin.categories_panel.modal_edit_title', 'en', 'Edit category'),
  ('admin.categories_panel.modal_edit_title', 'ru', 'Изменить категорию')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Panelis: budžeta progress bar aria (2026-05-29)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.stat_budget_progress_aria', 'lv', 'Izlietots no budžeta'),
  ('fs.dashboard.stat_budget_progress_aria', 'en', 'Budget used'),
  ('fs.dashboard.stat_budget_progress_aria', 'fr', 'Budget utilisé'),
  ('fs.dashboard.stat_budget_progress_aria', 'de', 'Budget verbraucht'),
  ('fs.dashboard.stat_budget_progress_aria', 'es', 'Presupuesto usado'),
  ('fs.dashboard.stat_budget_progress_aria', 'pt', 'Orçamento usado'),
  ('fs.dashboard.stat_budget_progress_aria', 'ru', 'Использовано бюджета')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Kategorijas: sports, education, utilities, auto, food, health (2026-05-29)

INSERT INTO public.subscription_categories (category_key, label, sort_order, enabled)
SELECT v.category_key, v.label, v.sort_order, true
FROM (
  VALUES
    ('sports', 'Sportss', 70),
    ('education', 'Izglītība', 80),
    ('utilities', 'Komunālie maksājumi', 90),
    ('auto', 'Auto', 100),
    ('food', 'Ēdiens', 110),
    ('health', 'Veselība', 120)
) AS v(category_key, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_categories c
  WHERE lower(c.category_key) = lower(v.category_key)
);

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('subscription.category.sports', 'lv', 'Sportss'),
  ('subscription.category.sports', 'en', 'Sports'),
  ('subscription.category.sports', 'fr', 'Sport'),
  ('subscription.category.sports', 'de', 'Sport'),
  ('subscription.category.sports', 'es', 'Deporte'),
  ('subscription.category.sports', 'pt', 'Desporto'),
  ('subscription.category.sports', 'ru', 'Спорт'),
  ('subscription.category.education', 'lv', 'Izglītība'),
  ('subscription.category.education', 'en', 'Education'),
  ('subscription.category.education', 'fr', 'Éducation'),
  ('subscription.category.education', 'de', 'Bildung'),
  ('subscription.category.education', 'es', 'Educación'),
  ('subscription.category.education', 'pt', 'Educação'),
  ('subscription.category.education', 'ru', 'Образование'),
  ('subscription.category.utilities', 'lv', 'Komunālie maksājumi'),
  ('subscription.category.utilities', 'en', 'Utilities'),
  ('subscription.category.utilities', 'fr', 'Charges locatives'),
  ('subscription.category.utilities', 'de', 'Nebenkosten'),
  ('subscription.category.utilities', 'es', 'Servicios'),
  ('subscription.category.utilities', 'pt', 'Utilidades'),
  ('subscription.category.utilities', 'ru', 'Коммунальные платежи'),
  ('subscription.category.auto', 'lv', 'Auto'),
  ('subscription.category.auto', 'en', 'Car'),
  ('subscription.category.auto', 'fr', 'Automobile'),
  ('subscription.category.auto', 'de', 'Auto'),
  ('subscription.category.auto', 'es', 'Automóvil'),
  ('subscription.category.auto', 'pt', 'Automóvel'),
  ('subscription.category.auto', 'ru', 'Автомобиль'),
  ('subscription.category.food', 'lv', 'Ēdiens'),
  ('subscription.category.food', 'en', 'Food'),
  ('subscription.category.food', 'fr', 'Alimentation'),
  ('subscription.category.food', 'de', 'Lebensmittel'),
  ('subscription.category.food', 'es', 'Alimentación'),
  ('subscription.category.food', 'pt', 'Alimentação'),
  ('subscription.category.food', 'ru', 'Питание'),
  ('subscription.category.health', 'lv', 'Veselība'),
  ('subscription.category.health', 'en', 'Health'),
  ('subscription.category.health', 'fr', 'Santé'),
  ('subscription.category.health', 'de', 'Gesundheit'),
  ('subscription.category.health', 'es', 'Salud'),
  ('subscription.category.health', 'pt', 'Saúde'),
  ('subscription.category.health', 'ru', 'Здоровье'),
  ('app.page_loading', 'lv', 'Ielādē…'),
  ('app.page_loading', 'en', 'Loading…'),
  ('app.page_loading', 'fr', 'Chargement…'),
  ('app.page_loading', 'de', 'Wird geladen…'),
  ('app.page_loading', 'es', 'Cargando…'),
  ('app.page_loading', 'pt', 'A carregar…'),
  ('app.page_loading', 'ru', 'Загрузка…'),
  ('family_sharing.err_email_not_configured', 'lv', 'E-pasta uzaicinājumus nevar nosūtīt: nav iestatīts RESEND vai EMAIL_FROM.'),
  ('family_sharing.err_email_not_configured', 'en', 'Cannot send invite emails: RESEND or EMAIL_FROM is not configured.'),
  ('family_sharing.err_email_not_configured', 'fr', 'Impossible d''envoyer l''e-mail d''invitation : RESEND ou EMAIL_FROM manquant.'),
  ('family_sharing.err_email_not_configured', 'de', 'Einladungs-E-Mails können nicht gesendet werden: RESEND oder EMAIL_FROM fehlt.'),
  ('family_sharing.err_email_not_configured', 'es', 'No se pueden enviar invitaciones por correo: falta RESEND o EMAIL_FROM.'),
  ('family_sharing.err_email_not_configured', 'pt', 'Não é possível enviar convites por e-mail: RESEND ou EMAIL_FROM em falta.'),
  ('family_sharing.err_email_not_configured', 'ru', 'Нельзя отправить приглашение по почте: не настроены RESEND или EMAIL_FROM.'),
  ('landing.features.cards.family_sharing.title', 'lv', 'Ģimenes dalīšana'),
  ('landing.features.cards.family_sharing.title', 'en', 'Family sharing'),
  ('landing.features.cards.family_sharing.title', 'fr', 'Partage familial'),
  ('landing.features.cards.family_sharing.title', 'de', 'Familienfreigabe'),
  ('landing.features.cards.family_sharing.title', 'es', 'Uso familiar compartido'),
  ('landing.features.cards.family_sharing.title', 'pt', 'Partilha familiar'),
  ('landing.features.cards.family_sharing.title', 'ru', 'Семейный доступ'),
  ('landing.trust.family_sharing_hint', 'lv', 'Saskaiti kopā ar saviem vai rādi tikai sarakstā un kalendārā.'),
  ('landing.trust.family_sharing_hint', 'en', 'Include in your totals or show only in your list and calendar.'),
  ('landing.trust.family_sharing_hint', 'fr', 'Inclure dans vos totaux ou afficher seulement dans la liste et le calendrier.'),
  ('landing.trust.family_sharing_hint', 'de', 'In Ihre Summen einbeziehen oder nur in Liste und Kalender anzeigen.'),
  ('landing.trust.family_sharing_hint', 'es', 'Súmalos a tus totales o muéstralos solo en la lista y el calendario.'),
  ('landing.trust.family_sharing_hint', 'pt', 'Incluir nos seus totais ou mostrar só na lista e no calendário.'),
  ('landing.trust.family_sharing_hint', 'ru', 'Учитывайте в итогах или показывайте только в списке и календаре.'),
  ('landing.features.cards.family_sharing.text', 'lv', 'Uzaicini tuvinieku: kopīgie izdevumi parādās sarakstā un kalendārā; pēc izvēles saskaiti tos kopā ar saviem kopsummās panelī.'),
  ('landing.features.cards.family_sharing.text', 'en', 'Invite someone close: shared expenses appear in your list and calendar; optionally include them in your dashboard totals.'),
  ('landing.features.cards.family_sharing.text', 'fr', 'Invitez un proche : ses dépenses partagées apparaissent dans la liste et le calendrier ; incluez-les dans vos totaux si vous le souhaitez.'),
  ('landing.features.cards.family_sharing.text', 'de', 'Laden Sie eine nahestehende Person ein: gemeinsame Ausgaben in Liste und Kalender; optional in Ihre Dashboard-Summen einbeziehen.'),
  ('landing.features.cards.family_sharing.text', 'es', 'Invita a un familiar: sus gastos compartidos en la lista y el calendario; opcionalmente súmalos a tus totales del panel.'),
  ('landing.features.cards.family_sharing.text', 'pt', 'Convide um familiar: despesas partilhadas na lista e no calendário; opcionalmente inclua-as nos totais do painel.'),
  ('landing.features.cards.family_sharing.text', 'ru', 'Пригласите близкого: общие расходы в списке и календаре; по желанию учитывайте их в итогах на панели.'),
  ('landing.trust.label', 'lv', 'Īsumā'),
  ('landing.trust.label', 'en', 'At a glance'),
  ('landing.trust.label', 'fr', 'En bref'),
  ('landing.trust.label', 'de', 'Auf einen Blick'),
  ('landing.trust.label', 'es', 'De un vistazo'),
  ('landing.trust.label', 'pt', 'Em resumo'),
  ('landing.trust.label', 'ru', 'Кратко'),
  ('landing.trust.payment_categories', 'lv', 'Maksājumu kategorijas'),
  ('landing.trust.payment_categories', 'en', 'Payment categories'),
  ('landing.trust.payment_categories', 'fr', 'Catégories de paiements'),
  ('landing.trust.payment_categories', 'de', 'Zahlungskategorien'),
  ('landing.trust.payment_categories', 'es', 'Categorías de pago'),
  ('landing.trust.payment_categories', 'pt', 'Categorias de pagamento'),
  ('landing.trust.payment_categories', 'ru', 'Категории платежей'),
  ('landing.trust.categories_hint', 'lv', 'Abonementi, rēķini, apdrošināšana un citi.'),
  ('landing.trust.categories_hint', 'en', 'Subscriptions, bills, insurance, and more.'),
  ('landing.trust.categories_hint', 'fr', 'Abonnements, factures, assurances et plus.'),
  ('landing.trust.categories_hint', 'de', 'Abos, Rechnungen, Versicherungen und mehr.'),
  ('landing.trust.categories_hint', 'es', 'Suscripciones, facturas, seguros y más.'),
  ('landing.trust.categories_hint', 'pt', 'Subscrições, faturas, seguros e mais.'),
  ('landing.trust.categories_hint', 'ru', 'Подписки, счета, страховки и другое.'),
  ('landing.trust.email_reminders_hint', 'lv', 'Pirms termiņa un par nokavētiem maksājumiem.'),
  ('landing.trust.email_reminders_hint', 'en', 'Before due dates and for overdue payments.'),
  ('landing.trust.email_reminders_hint', 'fr', 'Avant l''échéance et pour les paiements en retard.'),
  ('landing.trust.email_reminders_hint', 'de', 'Vor Fälligkeit und bei überfälligen Zahlungen.'),
  ('landing.trust.email_reminders_hint', 'es', 'Antes del vencimiento y por pagos atrasados.'),
  ('landing.trust.email_reminders_hint', 'pt', 'Antes do vencimento e por pagamentos em atraso.'),
  ('landing.trust.email_reminders_hint', 'ru', 'До срока и о просроченных платежах.'),
  ('admin.users.last_seen', 'lv', 'Pēdējoreiz'),
  ('admin.users.last_seen', 'en', 'Last seen'),
  ('admin.users.last_seen', 'ru', 'Последний визит'),
  ('admin.users.last_seen_ago_today', 'lv', 'pirms {minutes} min {seconds} s'),
  ('admin.users.last_seen_ago_today', 'en', '{minutes} min {seconds} s ago'),
  ('admin.users.last_seen_ago_today', 'ru', '{minutes} мин {seconds} с назад'),
  ('admin.users.last_seen_one_day', 'lv', 'nav redzēts 1 dienu'),
  ('admin.users.last_seen_one_day', 'en', 'not seen for 1 day'),
  ('admin.users.last_seen_one_day', 'ru', 'не был(а) 1 день'),
  ('admin.users.last_seen_days', 'lv', 'nav redzēts {days} dienas'),
  ('admin.users.last_seen_days', 'en', 'not seen for {days} days'),
  ('admin.users.last_seen_days', 'ru', 'не был(а) {days} дн.'),
  ('landing.explore.pro_in_app_badge', 'lv', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'en', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'fr', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'de', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'es', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'pt', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'ru', 'Pro')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
