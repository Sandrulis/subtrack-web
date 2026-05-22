-- Pro izmēģinājums: admin, panelis, kalendārs, analītika
-- Palaid pēc 107_pro_trial.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.forms.pro_trial_enable', 'lv', 'Pro izmēģinājums jaunajiem lietotājiem'),
  ('admin.forms.pro_trial_enable', 'en', 'Pro trial for new users'),
  ('admin.forms.pro_trial_enable', 'fr', 'Essai Pro pour les nouveaux utilisateurs'),
  ('admin.forms.pro_trial_enable', 'de', 'Pro-Test für neue Nutzer'),
  ('admin.forms.pro_trial_enable', 'es', 'Prueba Pro para usuarios nuevos'),
  ('admin.forms.pro_trial_enable', 'pt', 'Teste Pro para novos utilizadores'),
  ('admin.forms.pro_trial_enable', 'ru', 'Пробный Pro для новых пользователей'),

  ('admin.forms.label_pro_trial_days', 'lv', 'Izmēģinājuma dienas'),
  ('admin.forms.label_pro_trial_days', 'en', 'Trial days'),
  ('admin.forms.label_pro_trial_days', 'fr', 'Jours d''essai'),
  ('admin.forms.label_pro_trial_days', 'de', 'Testtage'),
  ('admin.forms.label_pro_trial_days', 'es', 'Días de prueba'),
  ('admin.forms.label_pro_trial_days', 'pt', 'Dias de teste'),
  ('admin.forms.label_pro_trial_days', 'ru', 'Дней пробного периода'),

  ('admin.forms.pro_trial_hint', 'lv', 'Tikai ja ieslēgts maksas plāns. Katram kontam vienu reizi no reģistrācijas; pēc termiņa Pro atgūstams tikai ar apmaksu.'),
  ('admin.forms.pro_trial_hint', 'en', 'Only when the paid plan is on. Once per account from signup; after it ends, Pro is available only via purchase.'),
  ('admin.forms.pro_trial_hint', 'fr', 'Uniquement si le plan payant est activé. Une fois par compte à l''inscription ; ensuite Pro uniquement par achat.'),
  ('admin.forms.pro_trial_hint', 'de', 'Nur wenn der kostenpflichtige Plan aktiv ist. Einmal pro Konto ab Registrierung; danach Pro nur per Kauf.'),
  ('admin.forms.pro_trial_hint', 'es', 'Solo con el plan de pago activado. Una vez por cuenta al registrarse; después Pro solo con compra.'),
  ('admin.forms.pro_trial_hint', 'pt', 'Apenas com o plano pago ativo. Uma vez por conta no registo; depois Pro só com compra.'),
  ('admin.forms.pro_trial_hint', 'ru', 'Только при включённом платном плане. Один раз на аккаунт при регистрации; после — Pro только по покупке.'),

  ('admin.forms.err_pro_trial_days', 'lv', 'Norādi derīgu dienu skaitu (1–365).'),
  ('admin.forms.err_pro_trial_days', 'en', 'Enter a valid number of days (1–365).'),
  ('admin.forms.err_pro_trial_days', 'fr', 'Indiquez un nombre de jours valide (1–365).'),
  ('admin.forms.err_pro_trial_days', 'de', 'Gültige Tagesanzahl eingeben (1–365).'),
  ('admin.forms.err_pro_trial_days', 'es', 'Indica un número de días válido (1–365).'),
  ('admin.forms.err_pro_trial_days', 'pt', 'Indique um número de dias válido (1–365).'),
  ('admin.forms.err_pro_trial_days', 'ru', 'Укажите число дней (1–365).'),

  ('nav.trial_demo_badge', 'lv', 'Demo'),
  ('nav.trial_demo_badge', 'en', 'Demo'),
  ('nav.trial_demo_badge', 'fr', 'Démo'),
  ('nav.trial_demo_badge', 'de', 'Demo'),
  ('nav.trial_demo_badge', 'es', 'Demo'),
  ('nav.trial_demo_badge', 'pt', 'Demo'),
  ('nav.trial_demo_badge', 'ru', 'Демо'),

  ('trial.progress_label', 'lv', 'Pro izmēģinājums: atlikušas {remaining} no {total} dienām'),
  ('trial.progress_label', 'en', 'Pro trial: {remaining} of {total} days left'),
  ('trial.progress_label', 'fr', 'Essai Pro : {remaining} sur {total} jours restants'),
  ('trial.progress_label', 'de', 'Pro-Test: noch {remaining} von {total} Tagen'),
  ('trial.progress_label', 'es', 'Prueba Pro: quedan {remaining} de {total} días'),
  ('trial.progress_label', 'pt', 'Teste Pro: faltam {remaining} de {total} dias'),
  ('trial.progress_label', 'ru', 'Пробный Pro: осталось {remaining} из {total} дн.'),

  ('trial.badge_aria', 'lv', 'Pro funkcijas izmēģinājuma režīmā'),
  ('trial.badge_aria', 'en', 'Pro features in trial mode'),
  ('trial.badge_aria', 'fr', 'Fonctions Pro en mode essai'),
  ('trial.badge_aria', 'de', 'Pro-Funktionen im Testmodus'),
  ('trial.badge_aria', 'es', 'Funciones Pro en modo de prueba'),
  ('trial.badge_aria', 'pt', 'Funcionalidades Pro em modo de teste'),
  ('trial.badge_aria', 'ru', 'Функции Pro в пробном режиме')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();
