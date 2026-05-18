-- Sākumlapas FAQ: produkcijas teksti (bez demo/Supabase/prototipa atsaucēm).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.faq.q_saved', 'lv', 'Vai mans konts saglabā datus?'),
  ('landing.faq.q_saved', 'en', 'Does my account save my data?'),
  ('landing.faq.q_saved', 'fr', 'Mon compte enregistre-t-il mes données?'),
  ('landing.faq.q_saved', 'de', 'Speichert mein Konto meine Daten?'),
  ('landing.faq.q_saved', 'es', '¿Mi cuenta guarda mis datos?'),
  ('landing.faq.q_saved', 'pt', 'A minha conta guarda os meus dados?'),
  ('landing.faq.q_saved', 'ru', 'Сохраняет ли моя учётная запись мои данные?'),

  (
    'landing.faq.a_saved',
    'lv',
    'Jā. Pēc reģistrācijas un pieslēgšanās tavi maksājumi un abonementi tiek saglabāti droši tavā kontā mākonī. Pie datiem piekļūsti tikai tu. Demonstrācijas lapās redzami tikai paraugi - tur nekas netiek saglabāts.'
  ),
  (
    'landing.faq.a_saved',
    'en',
    'Yes. After you sign up and log in, your payments and subscriptions are stored securely in your cloud account. Only you can access your data. Demo pages show samples only and nothing is saved there.'
  ),
  (
    'landing.faq.a_saved',
    'fr',
    'Oui. Après inscription et connexion, vos paiements et abonnements sont enregistrés en toute sécurité sur votre compte. Vous seul y accédez. Les pages démo affichent des exemples sans enregistrement.'
  ),
  (
    'landing.faq.a_saved',
    'de',
    'Ja. Nach Registrierung und Anmeldung werden Ihre Zahlungen und Abos sicher in Ihrem Cloud-Konto gespeichert. Nur Sie haben Zugriff. Demoseiten zeigen nur Beispiele ohne Speicherung.'
  ),
  (
    'landing.faq.a_saved',
    'es',
    'Sí. Tras registrarte e iniciar sesión, tus pagos y suscripciones se guardan de forma segura en tu cuenta en la nube. Solo tú accedes a tus datos. Las páginas demo muestran ejemplos y no guardan nada.'
  ),
  (
    'landing.faq.a_saved',
    'pt',
    'Sim. Após registo e início de sessão, os seus pagamentos e subscrições ficam guardados com segurança na sua conta na nuvem. Só você acede aos seus dados. As páginas de demonstração mostram exemplos sem guardar alterações.'
  ),
  (
    'landing.faq.a_saved',
    'ru',
    'Да. После регистрации и входа ваши платежи и подписки надёжно хранятся в облачном аккаунте. Доступ только у вас. На демо-страницах показываются примеры без сохранения.'
  ),

  ('landing.faq.a_mobile', 'lv', 'Jā. Saskarne ir pielāgota telefoniem un planšetēm: ērta navigācija, kalendārs un maksājumu saraksts arī mazā ekrānā.'),
  ('landing.faq.a_mobile', 'en', 'Yes. The interface is tailored for phones and tablets: easy navigation, calendar, and payment list work well on small screens.'),
  (
    'landing.faq.a_mobile',
    'fr',
    'Oui. L''interface est adaptée aux téléphones et tablettes : navigation, calendrier et liste des paiements restent pratiques sur petit écran.'
  ),
  (
    'landing.faq.a_mobile',
    'de',
    'Ja. Die Oberfläche ist für Smartphones und Tablets ausgelegt: Navigation, Kalender und Zahlungsliste funktionieren auch auf kleinen Bildschirmen.'
  ),
  (
    'landing.faq.a_mobile',
    'es',
    'Sí. La interfaz está pensada para móviles y tabletas: navegación, calendario y lista de pagos cómodos en pantallas pequeñas.'
  ),
  (
    'landing.faq.a_mobile',
    'pt',
    'Sim. A interface está adaptada a telemóveis e tablets: navegação, calendário e lista de pagamentos funcionam bem em ecrãs pequenos.'
  ),
  (
    'landing.faq.a_mobile',
    'ru',
    'Да. Интерфейс адаптирован для телефонов и планшетов: навигация, календарь и список платежей удобны на маленьком экране.'
  ),

  ('landing.faq.q_install', 'lv', 'Vai jāinstalē lietotne?'),
  ('landing.faq.q_install', 'en', 'Do I need to install an app?'),
  ('landing.faq.q_install', 'fr', 'Faut-il installer une application?'),
  ('landing.faq.q_install', 'de', 'Muss ich eine App installieren?'),
  ('landing.faq.q_install', 'es', '¿Hay que instalar una aplicación?'),
  ('landing.faq.q_install', 'pt', 'Preciso de instalar uma aplicação?'),
  ('landing.faq.q_install', 'ru', 'Нужно ли устанавливать приложение?'),

  ('landing.faq.a_install', 'lv', 'Nē. Pietiek ar mūsdienīgu pārlūkprogrammu - atver vietni un pieslēdzies. Nav jālejupielādē atsevišķa lietotne.'),
  ('landing.faq.a_install', 'en', 'No. A modern web browser is enough - open the site and sign in. No separate app download is required.'),
  ('landing.faq.a_install', 'fr', 'Non. Un navigateur récent suffit : ouvrez le site et connectez-vous. Aucune application à télécharger.'),
  ('landing.faq.a_install', 'de', 'Nein. Ein aktueller Webbrowser genügt - Website öffnen und anmelden. Keine separate App nötig.'),
  ('landing.faq.a_install', 'es', 'No. Basta un navegador moderno: abre el sitio e inicia sesión. No hace falta descargar otra app.'),
  ('landing.faq.a_install', 'pt', 'Não. Basta um navegador moderno: abra o site e inicie sessão. Não é preciso instalar outra aplicação.'),
  ('landing.faq.a_install', 'ru', 'Нет. Достаточно современного браузера: откройте сайт и войдите. Отдельное приложение устанавливать не нужно.'),

  ('landing.faq.q_demo', 'lv', 'Kāda ir atšķirība starp demonstrāciju un kontu?'),
  ('landing.faq.q_demo', 'en', 'What is the difference between the demo and an account?'),
  ('landing.faq.q_demo', 'fr', 'Quelle différence entre la démo et un compte?'),
  ('landing.faq.q_demo', 'de', 'Was ist der Unterschied zwischen Demo und Konto?'),
  ('landing.faq.q_demo', 'es', '¿Qué diferencia hay entre la demo y una cuenta?'),
  ('landing.faq.q_demo', 'pt', 'Qual a diferença entre a demonstração e uma conta?'),
  ('landing.faq.q_demo', 'ru', 'Чем отличается демо от учётной записи?'),

  (
    'landing.faq.a_demo',
    'lv',
    'Demonstrācijā redzams parauga panelis bez reģistrācijas - izmaiņas netiek saglabātas. Ar bezmaksas kontu pievieno savus maksājumus, saņem atgādinājumus un pārvaldi datus no jebkuras ierīces.'
  ),
  (
    'landing.faq.a_demo',
    'en',
    'The demo shows a sample dashboard without signing up - changes are not saved. With a free account you add your own payments, get reminders, and manage your data from any device.'
  ),
  (
    'landing.faq.a_demo',
    'fr',
    'La démo affiche un tableau d''exemple sans inscription - rien n''est enregistré. Avec un compte gratuit, ajoutez vos paiements, recevez des rappels et gérez vos données depuis n''importe quel appareil.'
  ),
  (
    'landing.faq.a_demo',
    'de',
    'Die Demo zeigt ein Beispiel-Dashboard ohne Anmeldung - Änderungen werden nicht gespeichert. Mit einem kostenlosen Konto erfassen Sie eigene Zahlungen, erhalten Erinnerungen und verwalten Daten von jedem Gerät.'
  ),
  (
    'landing.faq.a_demo',
    'es',
    'La demo muestra un panel de ejemplo sin registrarte: los cambios no se guardan. Con una cuenta gratuita añades tus pagos, recibes recordatorios y gestionas tus datos desde cualquier dispositivo.'
  ),
  (
    'landing.faq.a_demo',
    'pt',
    'A demonstração mostra um painel de exemplo sem registo - as alterações não são guardadas. Com conta gratuita adiciona os seus pagamentos, recebe lembretes e gere dados em qualquer dispositivo.'
  ),
  (
    'landing.faq.a_demo',
    'ru',
    'Демо показывает пример панели без регистрации - изменения не сохраняются. С бесплатным аккаунтом вы добавляете свои платежи, получаете напоминания и управляете данными с любого устройства.'
  )
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

DELETE FROM public.site_translations
WHERE translation_key IN ('landing.faq.q_ready', 'landing.faq.a_ready');
