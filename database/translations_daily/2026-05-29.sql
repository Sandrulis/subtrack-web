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

-- Atbalsta poga + admin e-pasts (lv, en, ru)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('support.trigger_label', 'lv', 'Palīdzība'),
  ('support.trigger_label', 'en', 'Help'),
  ('support.trigger_label', 'ru', 'Помощь'),
  ('support.trigger_aria', 'lv', 'Atvērt atbalsta ziņojumu'),
  ('support.trigger_aria', 'en', 'Open support message'),
  ('support.trigger_aria', 'ru', 'Открыть сообщение в поддержку'),
  ('support.modal_title', 'lv', 'Atbalsts'),
  ('support.modal_title', 'en', 'Support'),
  ('support.modal_title', 'ru', 'Поддержка'),
  ('support.modal_lead', 'lv', 'Apraksti jautājumu vai problēmu. Atbildi saņemsi uz savu konta e-pastu.'),
  ('support.modal_lead', 'en', 'Describe your question or issue. You will get a reply at your account email.'),
  ('support.modal_lead', 'ru', 'Опишите вопрос или проблему. Ответ придёт на e-mail вашего аккаунта.'),
  ('support.label_message', 'lv', 'Ziņojums'),
  ('support.label_message', 'en', 'Message'),
  ('support.label_message', 'ru', 'Сообщение'),
  ('support.placeholder_message', 'lv', 'Piemēram: nevaru pievienot abonementu…'),
  ('support.placeholder_message', 'en', 'For example: I cannot add a subscription…'),
  ('support.placeholder_message', 'ru', 'Например: не получается добавить подписку…'),
  ('support.btn_send', 'lv', 'Nosūtīt'),
  ('support.btn_send', 'en', 'Send'),
  ('support.btn_send', 'ru', 'Отправить'),
  ('support.modal_success', 'lv', 'Paldies! Ziņojums nosūtīts. Atbildi saņemsi uz savu e-pastu.'),
  ('support.modal_success', 'en', 'Thanks! Your message was sent. You will get a reply at your email.'),
  ('support.modal_success', 'ru', 'Спасибо! Сообщение отправлено. Ответ придёт на ваш e-mail.'),
  ('support.err_not_configured', 'lv', 'Atbalsts vēl nav konfigurēts. Sazinies ar administratoru.'),
  ('support.err_not_configured', 'en', 'Support is not configured yet. Contact the administrator.'),
  ('support.err_not_configured', 'ru', 'Поддержка ещё не настроена. Обратитесь к администратору.'),
  ('support.err_email_provider', 'lv', 'E-pasta sūtīšana nav konfigurēta (Resend).'),
  ('support.err_email_provider', 'en', 'Email sending is not configured (Resend).'),
  ('support.err_email_provider', 'ru', 'Отправка e-mail не настроена (Resend).'),
  ('admin.forms.section_support', 'lv', 'Atbalsts'),
  ('admin.forms.section_support', 'en', 'Support'),
  ('admin.forms.section_support', 'ru', 'Поддержка'),
  ('admin.forms.label_support_contact_email', 'lv', 'Atbalsta e-pasts'),
  ('admin.forms.label_support_contact_email', 'en', 'Support email'),
  ('admin.forms.label_support_contact_email', 'ru', 'E-mail поддержки'),
  (
    'admin.forms.hint_support_contact_email',
    'lv',
    'Uz šo adresi nonāk ielogotu lietotāju ziņojumi no pogas „Palīdzība”. Atbilde manuāli (Reply-To = lietotāja e-pasts). Tukšs lauks izslēdz atbalstu. Nepieciešams Resend.'
  ),
  (
    'admin.forms.hint_support_contact_email',
    'en',
    'Logged-in users'' messages from Help go here. Reply manually (Reply-To = user email). Empty disables support. Requires Resend.'
  ),
  (
    'admin.forms.hint_support_contact_email',
    'ru',
    'Сюда приходят сообщения из «Помощь». Ответ вручную (Reply-To = e-mail пользователя). Пусто = поддержка выкл. Нужен Resend.'
  )
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Ieteikumi / balsošana (lv, en, ru)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('suggestions.trigger_label', 'lv', 'Ieteikumi'),
  ('suggestions.trigger_label', 'en', 'Suggestions'),
  ('suggestions.trigger_label', 'ru', 'Предложения'),
  ('suggestions.modal_title', 'lv', 'Ieteikumi un pieprasījumi'),
  ('suggestions.modal_title', 'en', 'Suggestions and requests'),
  ('suggestions.modal_title', 'ru', 'Предложения и запросы'),
  ('suggestions.modal_lead', 'lv', 'Pievieno ideju vai balso par citu lietotāju ieteikumiem. Populārākie augšā.'),
  ('suggestions.modal_lead', 'en', 'Add an idea or vote on others'' suggestions. Most voted appear first.'),
  ('suggestions.modal_lead', 'ru', 'Добавьте идею или голосуйте. Сверху — с большим числом голосов.'),
  ('suggestions.btn_add', 'lv', 'Jauns ieteikums'),
  ('suggestions.btn_add', 'en', 'New suggestion'),
  ('suggestions.btn_add', 'ru', 'Новое предложение'),
  ('suggestions.empty', 'lv', 'Vēl nav ieteikumu'),
  ('suggestions.empty', 'en', 'No suggestions yet'),
  ('suggestions.empty', 'ru', 'Пока нет предложений'),
  ('suggestions.empty_hint', 'lv', 'Pastāsti, ko vēlies redzēt lietotnē – citi varēs balsot par tavu ideju.'),
  ('suggestions.empty_hint', 'en', 'Share what you would like in the app – others can vote for your idea.'),
  ('suggestions.empty_hint', 'ru', 'Расскажите, чего не хватает в приложении – другие смогут проголосовать.'),
  ('suggestions.form_intro', 'lv', 'Īss virsraksts un apraksts – pēc publicēšanas citi varēs balsot.'),
  ('suggestions.form_intro', 'en', 'A short title and description – after publishing, others can vote.'),
  ('suggestions.form_intro', 'ru', 'Краткий заголовок и описание – после публикации другие смогут голосовать.'),
  ('suggestions.toast_created', 'lv', 'Ieteikums publicēts'),
  ('suggestions.toast_created', 'en', 'Suggestion published'),
  ('suggestions.toast_created', 'ru', 'Предложение опубликовано')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Atsauksmes ar zvaigžņu vērtējumu (lv, en, ru)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('feedback.trigger_label', 'lv', 'Atsauksmes'),
  ('feedback.trigger_label', 'en', 'Feedback'),
  ('feedback.trigger_label', 'ru', 'Отзывы'),
  ('feedback.modal_title', 'lv', 'Atsauksmes'),
  ('feedback.modal_title', 'en', 'Feedback'),
  ('feedback.modal_title', 'ru', 'Отзывы'),
  ('feedback.modal_lead', 'lv', 'Novērtē ar zvaigznēm (1–5) un īsi apraksti pieredzi.'),
  ('feedback.modal_lead', 'en', 'Rate with stars (1–5) and briefly describe your experience.'),
  ('feedback.modal_lead', 'ru', 'Оцените звёздами (1–5) и кратко опишите опыт.'),
  ('feedback.form_intro_edit', 'lv', 'Tava saglabātā atsauksme – vari mainīt vērtējumu un tekstu.'),
  ('feedback.form_intro_edit', 'en', 'Your saved review – you can change the rating and text.'),
  ('feedback.form_intro_edit', 'ru', 'Ваш сохранённый отзыв – можно изменить оценку и текст.'),
  ('feedback.label_rating', 'lv', 'Vērtējums'),
  ('feedback.label_rating', 'en', 'Rating'),
  ('feedback.label_rating', 'ru', 'Оценка'),
  ('feedback.rating_hint', 'lv', 'Izvēlies 1–5 zvaigznes (obligāti).'),
  ('feedback.rating_hint', 'en', 'Choose 1–5 stars (required).'),
  ('feedback.rating_hint', 'ru', 'Выберите 1–5 звёзд (обязательно).'),
  ('feedback.stars_aria_value', 'lv', 'Vērtējums: {n} no 5'),
  ('feedback.stars_aria_value', 'en', 'Rating: {n} out of 5'),
  ('feedback.stars_aria_value', 'ru', 'Оценка: {n} из 5'),
  ('feedback.stars_aria_set', 'lv', 'Iestatīt {n} zvaigznes'),
  ('feedback.stars_aria_set', 'en', 'Set {n} stars'),
  ('feedback.stars_aria_set', 'ru', 'Установить {n} звёзд'),
  ('feedback.stars_clear', 'lv', 'Notīrīt'),
  ('feedback.stars_clear', 'en', 'Clear'),
  ('feedback.stars_clear', 'ru', 'Сбросить'),
  ('feedback.btn_edit_mine', 'lv', 'Labot manu atsauksmi'),
  ('feedback.btn_edit_mine', 'en', 'Edit my review'),
  ('feedback.btn_edit_mine', 'ru', 'Изменить мой отзыв'),
  ('feedback.toast_updated', 'lv', 'Atsauksme saglabāta'),
  ('feedback.toast_updated', 'en', 'Review saved'),
  ('feedback.toast_updated', 'ru', 'Отзыв сохранён'),
  ('feedback.err_rating_required', 'lv', 'Izvēlies vismaz vienu zvaigzni (1–5).'),
  ('feedback.err_rating_required', 'en', 'Choose at least one star (1–5).'),
  ('feedback.err_rating_required', 'ru', 'Выберите хотя бы одну звезду (1–5).'),
  ('feedback.err_rating_invalid', 'lv', 'Nederīgs vērtējums (jābūt 0–5).'),
  ('feedback.err_rating_invalid', 'en', 'Invalid rating (must be 0–5).'),
  ('feedback.err_rating_invalid', 'ru', 'Недопустимая оценка (0–5).'),
  ('feedback.empty_hint', 'lv', 'Novērtē ar zvaigznēm un īsi apraksti pieredzi – viena atsauksme katram kontam.'),
  ('feedback.empty_hint', 'en', 'Rate with stars and briefly describe your experience – one review per account.'),
  ('feedback.empty_hint', 'ru', 'Оцените звёздами и кратко опишите опыт – один отзыв на аккаунт.'),
  ('feedback.form_intro', 'lv', 'Viena atsauksme katram kontam. Pēc saglabāšanas vari atvērt vēlreiz un labot.'),
  ('feedback.form_intro', 'en', 'One review per account. You can open this again later to edit.'),
  ('feedback.form_intro', 'ru', 'Один отзыв на аккаунт. После сохранения можно открыть снова и изменить.'),
  ('feedback.btn_add', 'lv', 'Jauna atsauksme'),
  ('feedback.btn_add', 'en', 'New feedback'),
  ('feedback.btn_add', 'ru', 'Новый отзыв'),
  ('feedback.empty', 'lv', 'Vēl nav atsauksmju'),
  ('feedback.empty', 'en', 'No feedback yet'),
  ('feedback.empty', 'ru', 'Пока нет отзывов'),
  ('feedback.toast_created', 'lv', 'Atsauksme publicēta'),
  ('feedback.toast_created', 'en', 'Feedback published'),
  ('feedback.toast_created', 'ru', 'Отзыв опубликован'),
  ('feedback.badge_landing', 'lv', 'Sākumlapā'),
  ('feedback.badge_landing', 'en', 'On landing page'),
  ('feedback.badge_landing', 'ru', 'На главной')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Footer: ieteikumi, atsauksmes, palīdzība (lv, en, ru)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('footer.authed_nav_aria', 'lv', 'Ieteikumi, atsauksmes un palīdzība'),
  ('footer.authed_nav_aria', 'en', 'Suggestions, feedback and help'),
  ('footer.authed_nav_aria', 'ru', 'Предложения, отзывы и помощь')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Blogs: admin, publiskās lapas, footer (lv, en, ru)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('legal.footer.blog', 'lv', 'Blogs'),
  ('legal.footer.blog', 'en', 'Blog'),
  ('legal.footer.blog', 'ru', 'Блог'),
  ('admin.nav.blog', 'lv', 'Blogs'),
  ('admin.nav.blog', 'en', 'Blog'),
  ('admin.nav.blog', 'ru', 'Блог'),
  ('meta.title.admin.blog', 'lv', 'Blogs'),
  ('meta.title.admin.blog', 'en', 'Blog'),
  ('meta.title.admin.blog', 'ru', 'Блог'),
  ('meta.title.blog.index', 'lv', 'Blogs'),
  ('meta.title.blog.index', 'en', 'Blog'),
  ('meta.title.blog.index', 'ru', 'Блог'),
  ('admin.blog.heading', 'lv', 'Blogs'),
  ('admin.blog.heading', 'en', 'Blog'),
  ('admin.blog.heading', 'ru', 'Блог'),
  ('admin.blog.lead', 'lv', 'Publicē rakstus ar BBCode: attēli, saites, YouTube. URL: /blog/virsraksts-ar-defisi.'),
  ('admin.blog.lead', 'en', 'Publish posts with BBCode: images, links, YouTube. URLs: /blog/title-with-dashes.'),
  ('admin.blog.lead', 'ru', 'Публикуйте записи в BBCode: изображения, ссылки, YouTube. URL: /blog/zagolovok-cherez-defis.'),
  ('admin.blog.btn_add', 'lv', 'Jauns ieraksts'),
  ('admin.blog.btn_add', 'en', 'New post'),
  ('admin.blog.btn_add', 'ru', 'Новая запись'),
  ('blog.index.title', 'lv', 'Blogs'),
  ('blog.index.title', 'en', 'Blog'),
  ('blog.index.title', 'ru', 'Блог'),
  ('blog.index.lead', 'lv', 'Jaunumi un padomi par abonementu pārvaldību.'),
  ('blog.index.lead', 'en', 'News and tips on managing subscriptions.'),
  ('blog.index.lead', 'ru', 'Новости и советы по управлению подписками.'),
  ('blog.index.meta_description', 'lv', 'SubTrack blogs - raksti par periodiskajiem maksājumiem un abonementiem.'),
  ('blog.index.meta_description', 'en', 'SubTrack blog - articles on recurring payments and subscriptions.'),
  ('blog.index.meta_description', 'ru', 'Блог SubTrack - статьи о периодических платежах и подписках.'),
  ('blog.read_more', 'lv', 'Lasīt vairāk'),
  ('blog.read_more', 'en', 'Read more'),
  ('blog.read_more', 'ru', 'Читать далее'),
  ('blog.back_to_index', 'lv', 'Atpakaļ uz blogu'),
  ('blog.back_to_index', 'en', 'Back to blog'),
  ('blog.back_to_index', 'ru', 'Назад к блогу'),
  ('admin.blog.field.url_preview', 'lv', 'Adrese:'),
  ('admin.blog.field.url_preview', 'en', 'URL:'),
  ('admin.blog.field.url_preview', 'ru', 'Адрес:'),
  ('admin.blog.field.slug_hint', 'lv', 'URL tiks izveidots no virsraksta (/blog/…, atstarpes → "-").'),
  ('admin.blog.field.slug_hint', 'en', 'The URL is generated from the title (/blog/…, spaces → "-").'),
  ('admin.blog.field.slug_hint', 'ru', 'URL создаётся из заголовка (/blog/…, пробелы → "-").')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
