-- Publisko demonstrāciju lapu tulkojumi (/demo/dashboard, /demo/analytics).
-- Palaid pēc `012_site_translations_select_public.sql` (vai ja DB jau satur `site_translations`).

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('meta.title.app.demo.dashboard', 'lv', 'Demonstrācijas panelis'),
  ('meta.title.app.demo.dashboard', 'en', 'Demo dashboard'),
  ('meta.title.app.demo.dashboard', 'fr', 'Démo tableau de bord'),
  ('meta.title.app.demo.dashboard', 'de', 'Demo-Dashboard'),
  ('meta.title.app.demo.dashboard', 'es', 'Panel de demostración'),
  ('meta.title.app.demo.dashboard', 'pt', 'Painel de demonstração'),
  ('meta.title.app.demo.dashboard', 'ru', 'Демо-панель'),
  ('meta.title.app.demo.analytics', 'lv', 'Demonstrācijas analītika'),
  ('meta.title.app.demo.analytics', 'en', 'Demo analytics'),
  ('meta.title.app.demo.analytics', 'fr', 'Démo analyses'),
  ('meta.title.app.demo.analytics', 'de', 'Demo-Analysen'),
  ('meta.title.app.demo.analytics', 'es', 'Demo de analítica'),
  ('meta.title.app.demo.analytics', 'pt', 'Demonstração de análises'),
  ('meta.title.app.demo.analytics', 'ru', 'Демо-аналитика'),
  (
    'demo.banner',
    'lv',
    'Šī ir demonstrācija ar parauga datiem. Lai saglabātu savus abonementus, izveido kontu.'
  ),
  (
    'demo.banner',
    'en',
    'This demo uses sample data only. Create an account to save your own subscriptions.'
  ),
  (
    'demo.banner',
    'fr',
    'Cette démo utilise des données d''exemple. Créez un compte pour enregistrer vos abonnements.'
  ),
  (
    'demo.banner',
    'de',
    'Diese Demo nutzt nur Beispieldaten. Legen Sie ein Konto an, um eigene Abos zu speichern.'
  ),
  (
    'demo.banner',
    'es',
    'Esta demo usa solo datos de muestra. Crea una cuenta para guardar tus suscripciones.'
  ),
  (
    'demo.banner',
    'pt',
    'Esta demonstração usa apenas dados de exemplo. Crie uma conta para guardar as suas subscrições.'
  ),
  (
    'demo.banner',
    'ru',
    'Это демо с примерами данных. Создайте аккаунт, чтобы сохранить свои подписки.'
  ),
  ('demo.nav.badge', 'lv', 'Demo'),
  ('demo.nav.badge', 'en', 'Demo'),
  ('demo.nav.badge', 'fr', 'Démo'),
  ('demo.nav.badge', 'de', 'Demo'),
  ('demo.nav.badge', 'es', 'Demo'),
  ('demo.nav.badge', 'pt', 'Demo'),
  ('demo.nav.badge', 'ru', 'Демо'),
  ('demo.nav.aria', 'lv', 'Demonstrācijas navigācija'),
  ('demo.nav.aria', 'en', 'Demo navigation'),
  ('demo.nav.aria', 'fr', 'Navigation de démonstration'),
  ('demo.nav.aria', 'de', 'Demo-Navigation'),
  ('demo.nav.aria', 'es', 'Navegación de demostración'),
  ('demo.nav.aria', 'pt', 'Navegação da demonstração'),
  ('demo.nav.aria', 'ru', 'Навигация демо'),
  ('demo.action.edit_sample', 'lv', 'Labot'),
  ('demo.action.edit_sample', 'en', 'Edit'),
  ('demo.action.edit_sample', 'fr', 'Modifier'),
  ('demo.action.edit_sample', 'de', 'Bearbeiten'),
  ('demo.action.edit_sample', 'es', 'Editar'),
  ('demo.action.edit_sample', 'pt', 'Editar'),
  ('demo.action.edit_sample', 'ru', 'Изменить'),
  ('demo.edit_hint', 'lv', 'Demonstrācijā izmaiņas netiek saglabātas.'),
  ('demo.edit_hint', 'en', 'Edits are not saved in the demo.'),
  ('demo.edit_hint', 'fr', 'Les modifications ne sont pas enregistrées dans la démo.'),
  ('demo.edit_hint', 'de', 'In der Demo werden Änderungen nicht gespeichert.'),
  ('demo.edit_hint', 'es', 'En la demo no se guardan los cambios.'),
  ('demo.edit_hint', 'pt', 'Na demonstração as alterações não são guardadas.'),
  ('demo.edit_hint', 'ru', 'В демо изменения не сохраняются.'),
  ('demo.chart.trend_title', 'lv', 'Izmaksu tendence un prognoze'),
  ('demo.chart.trend_title', 'en', 'Spend trend and forecast'),
  ('demo.chart.trend_title', 'fr', 'Tendance des dépenses et prévision'),
  ('demo.chart.trend_title', 'de', 'Ausgabentrend und Prognose'),
  ('demo.chart.trend_title', 'es', 'Tendencia de gasto y previsión'),
  ('demo.chart.trend_title', 'pt', 'Tendência de gastos e previsão'),
  ('demo.chart.trend_title', 'ru', 'Тренд расходов и прогноз'),
  (
    'demo.chart.trend_hint',
    'lv',
    'Taisnā līnija: faktiskās summas; pārtraukta līnija: modelēta īstermiņa prognoze.'
  ),
  (
    'demo.chart.trend_hint',
    'en',
    'Solid line: actual amounts; dashed line: a simple short-term projection.'
  ),
  (
    'demo.chart.trend_hint',
    'fr',
    'Trait plein : montants réels ; pointillés : projection simple à court terme.'
  ),
  (
    'demo.chart.trend_hint',
    'de',
    'Durchgezogen: Ist-Werte; gestrichelt: einfache Kurzzeitprognose.'
  ),
  (
    'demo.chart.trend_hint',
    'es',
    'Línea continua: importes reales; discontinua: proyección simple a corto plazo.'
  ),
  (
    'demo.chart.trend_hint',
    'pt',
    'Linha contínua: valores reais; tracejada: projeção simples de curto prazo.'
  ),
  (
    'demo.chart.trend_hint',
    'ru',
    'Сплошная линия: факт; пунктир: простой краткосрочный прогноз.'
  ),
  ('demo.chart.legend_actual', 'lv', 'Faktiski'),
  ('demo.chart.legend_actual', 'en', 'Actual'),
  ('demo.chart.legend_actual', 'fr', 'Réel'),
  ('demo.chart.legend_actual', 'de', 'Ist'),
  ('demo.chart.legend_actual', 'es', 'Real'),
  ('demo.chart.legend_actual', 'pt', 'Real'),
  ('demo.chart.legend_actual', 'ru', 'Факт'),
  ('demo.chart.legend_forecast', 'lv', 'Prognoze'),
  ('demo.chart.legend_forecast', 'en', 'Forecast'),
  ('demo.chart.legend_forecast', 'fr', 'Prévision'),
  ('demo.chart.legend_forecast', 'de', 'Prognose'),
  ('demo.chart.legend_forecast', 'es', 'Previsión'),
  ('demo.chart.legend_forecast', 'pt', 'Previsão'),
  ('demo.chart.legend_forecast', 'ru', 'Прогноз'),
  ('demo.analytics.upcoming_note_sample', 'lv', 'Parauga logs: nākamās 30 dienas'),
  ('demo.analytics.upcoming_note_sample', 'en', 'Sample window: next 30 days'),
  (
    'demo.analytics.upcoming_note_sample',
    'fr',
    'Exemple : fenêtre des 30 prochains jours'
  ),
  ('demo.analytics.upcoming_note_sample', 'de', 'Beispiel: nächste 30 Tage'),
  ('demo.analytics.upcoming_note_sample', 'es', 'Ejemplo: próximos 30 días'),
  ('demo.analytics.upcoming_note_sample', 'pt', 'Exemplo: próximos 30 dias'),
  ('demo.analytics.upcoming_note_sample', 'ru', 'Пример: следующие 30 дней'),
  ('demo.analytics.next_name_sample', 'lv', 'Telefona rēķins'),
  ('demo.analytics.next_name_sample', 'en', 'Phone bill'),
  ('demo.analytics.next_name_sample', 'fr', 'Facture téléphonique'),
  ('demo.analytics.next_name_sample', 'de', 'Handyrechnung'),
  ('demo.analytics.next_name_sample', 'es', 'Factura del móvil'),
  ('demo.analytics.next_name_sample', 'pt', 'Conta do telemóvel'),
  ('demo.analytics.next_name_sample', 'ru', 'Телефонный счёт'),
  ('demo.mobile.aria_home', 'lv', 'Atgriezties sākumlapā'),
  ('demo.mobile.aria_home', 'en', 'Back to home'),
  ('demo.mobile.aria_home', 'fr', 'Retour à l''accueil'),
  ('demo.mobile.aria_home', 'de', 'Zur Startseite'),
  ('demo.mobile.aria_home', 'es', 'Volver al inicio'),
  ('demo.mobile.aria_home', 'pt', 'Voltar ao início'),
  ('demo.mobile.aria_home', 'ru', 'На главную')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
