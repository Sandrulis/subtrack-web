import {
  EMAIL_SUPPORTED_LOCALES,
  normalizeEmailLocale,
  type EmailPreviewLocale,
  type EmailTemplateCopy,
  type EmailTemplateId,
} from "./template-types";

type LocaleMap = Record<EmailPreviewLocale, EmailTemplateCopy>;

function c(
  subject: string,
  preheader: string,
  headline: string,
  body: string,
  ctaLabel: string,
  footerNote: string,
): EmailTemplateCopy {
  return { subject, preheader, headline, body, ctaLabel, footerNote };
}

const defaults: Record<EmailTemplateId, LocaleMap> = {
  confirm_signup: {
    en: c(
      "Confirm your email – {SYSTEM_NAME}",
      "Finish signing up with one click.",
      "Confirm your email",
      "Thanks for signing up! Click the button below to verify your email and start using {SYSTEM_NAME}.",
      "Confirm email",
      "If you did not sign up, you can ignore this message. The link expires after a limited time.",
    ),
    fr: c(
      "Confirmez votre e-mail – {SYSTEM_NAME}",
      "Terminez l'inscription en un clic.",
      "Confirmez votre e-mail",
      "Merci pour votre inscription ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et commencer à utiliser {SYSTEM_NAME}.",
      "Confirmer l'e-mail",
      "Si vous ne vous êtes pas inscrit, ignorez ce message. Le lien expire après un délai limité.",
    ),
    de: c(
      "E-Mail bestätigen – {SYSTEM_NAME}",
      "Registrierung mit einem Klick abschließen.",
      "E-Mail bestätigen",
      "Danke für Ihre Anmeldung! Klicken Sie auf die Schaltfläche, um Ihre E-Mail zu bestätigen und {SYSTEM_NAME} zu nutzen.",
      "E-Mail bestätigen",
      "Wenn Sie sich nicht registriert haben, ignorieren Sie diese Nachricht. Der Link läuft nach kurzer Zeit ab.",
    ),
    es: c(
      "Confirma tu correo – {SYSTEM_NAME}",
      "Completa el registro con un clic.",
      "Confirma tu correo",
      "¡Gracias por registrarte! Haz clic en el botón para verificar tu correo y empezar a usar {SYSTEM_NAME}.",
      "Confirmar correo",
      "Si no te registraste, ignora este mensaje. El enlace caduca al cabo de un tiempo.",
    ),
    pt: c(
      "Confirme o seu email – {SYSTEM_NAME}",
      "Conclua o registo com um clique.",
      "Confirme o seu email",
      "Obrigado por se registar! Clique no botão para verificar o email e começar a usar o {SYSTEM_NAME}.",
      "Confirmar email",
      "Se não se registou, ignore esta mensagem. A ligação expira ao fim de algum tempo.",
    ),
    lv: c(
      "Apstiprini e-pastu – {SYSTEM_NAME}",
      "Pabeidz reģistrāciju ar vienu klikšķi.",
      "Apstiprini savu e-pastu",
      "Paldies, ka reģistrējies! Noklikšķini uz pogas zemāk, lai apstiprinātu e-pasta adresi un sāktu lietot {SYSTEM_NAME}.",
      "Apstiprināt e-pastu",
      "Ja tu neesi reģistrējies, vari ignorēt šo vēstuli. Saite derīga ierobežotu laiku.",
    ),
    ru: c(
      "Подтвердите email – {SYSTEM_NAME}",
      "Завершите регистрацию одним нажатием.",
      "Подтвердите email",
      "Спасибо за регистрацию! Нажмите кнопку ниже, чтобы подтвердить адрес и начать пользоваться {SYSTEM_NAME}.",
      "Подтвердить email",
      "Если вы не регистрировались, проигнорируйте это письмо. Ссылка действует ограниченное время.",
    ),
  },
  reset_password: {
    en: c(
      "Reset your password – {SYSTEM_NAME}",
      "Link to choose a new password.",
      "Forgot your password?",
      "We received a request to reset your {SYSTEM_NAME} password. Click the button to choose a new one.",
      "Reset password",
      "If you did not request this, ignore this email – your password will stay the same.",
    ),
    fr: c(
      "Réinitialiser le mot de passe – {SYSTEM_NAME}",
      "Lien pour choisir un nouveau mot de passe.",
      "Mot de passe oublié ?",
      "Nous avons reçu une demande de réinitialisation du mot de passe {SYSTEM_NAME}. Cliquez sur le bouton pour en choisir un nouveau.",
      "Réinitialiser",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail – votre mot de passe ne changera pas.",
    ),
    de: c(
      "Passwort zurücksetzen – {SYSTEM_NAME}",
      "Link zur Auswahl eines neuen Passworts.",
      "Passwort vergessen?",
      "Wir haben eine Anfrage zum Zurücksetzen Ihres {SYSTEM_NAME}-Passworts erhalten. Klicken Sie auf die Schaltfläche.",
      "Passwort zurücksetzen",
      "Wenn Sie dies nicht angefordert haben, ignorieren Sie die E-Mail – Ihr Passwort bleibt unverändert.",
    ),
    es: c(
      "Restablecer contraseña – {SYSTEM_NAME}",
      "Enlace para elegir una nueva contraseña.",
      "¿Olvidaste tu contraseña?",
      "Recibimos una solicitud para restablecer tu contraseña de {SYSTEM_NAME}. Haz clic en el botón.",
      "Restablecer",
      "Si no lo solicitaste, ignora este correo; tu contraseña no cambiará.",
    ),
    pt: c(
      "Repor palavra-passe – {SYSTEM_NAME}",
      "Ligação para escolher uma nova palavra-passe.",
      "Esqueceu a palavra-passe?",
      "Recebemos um pedido para repor a palavra-passe do {SYSTEM_NAME}. Clique no botão.",
      "Repor palavra-passe",
      "Se não fez este pedido, ignore o email – a palavra-passe mantém-se.",
    ),
    lv: c(
      "Paroles atjaunošana – {SYSTEM_NAME}",
      "Saite jaunas paroles izvēlei.",
      "Aizmirsi paroli?",
      "Saņēmām pieprasījumu atjaunot tavu {SYSTEM_NAME} konta paroli. Noklikšķini uz pogas, lai izvēlētos jaunu paroli.",
      "Mainīt paroli",
      "Ja tu neesi pieprasījis paroles maiņu, ignorē šo e-pastu – parole paliek nemainīta.",
    ),
    ru: c(
      "Сброс пароля – {SYSTEM_NAME}",
      "Ссылка для нового пароля.",
      "Забыли пароль?",
      "Мы получили запрос на сброс пароля {SYSTEM_NAME}. Нажмите кнопку, чтобы задать новый пароль.",
      "Сбросить пароль",
      "Если вы не запрашивали сброс, проигнорируйте письмо – пароль не изменится.",
    ),
  },
  magic_link: {
    en: c(
      "Your sign-in link – {SYSTEM_NAME}",
      "One-time link to access your account.",
      "Sign in with a link",
      "Click the button to sign in to {SYSTEM_NAME} securely without a password.",
      "Sign in",
      "This link is single-use. If you did not request it, ignore this email.",
    ),
    fr: c(
      "Lien de connexion – {SYSTEM_NAME}",
      "Lien à usage unique pour accéder à votre compte.",
      "Connexion par lien",
      "Cliquez sur le bouton pour vous connecter à {SYSTEM_NAME} en toute sécurité sans mot de passe.",
      "Se connecter",
      "Ce lien est à usage unique. Si vous ne l'avez pas demandé, ignorez cet e-mail.",
    ),
    de: c(
      "Anmeldelink – {SYSTEM_NAME}",
      "Einmaliger Link für den Kontozugang.",
      "Mit Link anmelden",
      "Klicken Sie auf die Schaltfläche, um sich sicher ohne Passwort bei {SYSTEM_NAME} anzumelden.",
      "Anmelden",
      "Dieser Link ist einmalig. Wenn Sie ihn nicht angefordert haben, ignorieren Sie die E-Mail.",
    ),
    es: c(
      "Tu enlace de acceso – {SYSTEM_NAME}",
      "Enlace de un solo uso para tu cuenta.",
      "Entrar con enlace",
      "Haz clic en el botón para iniciar sesión en {SYSTEM_NAME} de forma segura sin contraseña.",
      "Entrar",
      "Este enlace es de un solo uso. Si no lo pediste, ignora este correo.",
    ),
    pt: c(
      "Ligação de entrada – {SYSTEM_NAME}",
      "Ligação de utilização única para a sua conta.",
      "Entrar com ligação",
      "Clique no botão para entrar no {SYSTEM_NAME} em segurança sem palavra-passe.",
      "Entrar",
      "Esta ligação é de utilização única. Se não a pediu, ignore o email.",
    ),
    lv: c(
      "Tava pieteikšanās saite – {SYSTEM_NAME}",
      "Vienreizēja saite ieejai kontā.",
      "Pieslēdzies ar saiti",
      "Noklikšķini uz pogas, lai droši pieslēgtos {SYSTEM_NAME} bez paroles.",
      "Pieslēgties",
      "Saite ir vienreizēja. Ja tu neesi pieprasījis ieeju, ignorē šo vēstuli.",
    ),
    ru: c(
      "Ссылка для входа – {SYSTEM_NAME}",
      "Одноразовая ссылка для входа.",
      "Вход по ссылке",
      "Нажмите кнопку для безопасного входа в {SYSTEM_NAME} без пароля.",
      "Войти",
      "Ссылка одноразовая. Если вы не запрашивали вход, проигнорируйте письмо.",
    ),
  },
  email_change: {
    en: c(
      "Confirm your new email – {SYSTEM_NAME}",
      "Confirmation required to change email.",
      "Confirm email change",
      "You requested to change your {SYSTEM_NAME} account email. Confirm the new address with the button below.",
      "Confirm new email",
      "If you did not start this change, contact support.",
    ),
    fr: c(
      "Confirmez le nouvel e-mail – {SYSTEM_NAME}",
      "Confirmation requise pour changer l'e-mail.",
      "Confirmer le changement",
      "Vous avez demandé à modifier l'e-mail de votre compte {SYSTEM_NAME}. Confirmez la nouvelle adresse.",
      "Confirmer",
      "Si vous n'êtes pas à l'origine de ce changement, contactez le support.",
    ),
    de: c(
      "Neue E-Mail bestätigen – {SYSTEM_NAME}",
      "Bestätigung für die E-Mail-Änderung erforderlich.",
      "E-Mail-Änderung bestätigen",
      "Sie haben eine Änderung der {SYSTEM_NAME}-Konto-E-Mail angefordert. Bestätigen Sie die neue Adresse.",
      "Bestätigen",
      "Wenn Sie diese Änderung nicht veranlasst haben, wenden Sie sich an den Support.",
    ),
    es: c(
      "Confirma tu nuevo correo – {SYSTEM_NAME}",
      "Se requiere confirmación para cambiar el correo.",
      "Confirmar cambio de correo",
      "Solicitaste cambiar el correo de tu cuenta {SYSTEM_NAME}. Confirma la nueva dirección.",
      "Confirmar",
      "Si no iniciaste este cambio, contacta con soporte.",
    ),
    pt: c(
      "Confirme o novo email – {SYSTEM_NAME}",
      "Confirmação necessária para alterar o email.",
      "Confirmar alteração",
      "Pediu para alterar o email da conta {SYSTEM_NAME}. Confirme o novo endereço.",
      "Confirmar",
      "Se não iniciou esta alteração, contacte o suporte.",
    ),
    lv: c(
      "Apstiprini jauno e-pastu – {SYSTEM_NAME}",
      "Nepieciešams apstiprinājums e-pasta maiņai.",
      "Apstiprini e-pasta maiņu",
      "Tu pieprasīji mainīt konta e-pastu {SYSTEM_NAME}. Apstiprini jauno adresi ar pogu zemāk.",
      "Apstiprināt jauno e-pastu",
      "Ja tu neesi iniciējis maiņu, sazinies ar atbalstu.",
    ),
    ru: c(
      "Подтвердите новый email – {SYSTEM_NAME}",
      "Нужно подтверждение смены email.",
      "Подтвердите смену email",
      "Вы запросили смену email в {SYSTEM_NAME}. Подтвердите новый адрес кнопкой ниже.",
      "Подтвердить новый email",
      "Если вы не инициировали смену, свяжитесь с поддержкой.",
    ),
  },
  invite_user: {
    en: c(
      "You're invited – {SYSTEM_NAME}",
      "You have been invited to join.",
      "You've been invited",
      "You have been invited to create an account on {SYSTEM_NAME}. Click below to accept.",
      "Accept invite",
      "If you were not expecting this invite, you can ignore it.",
    ),
    fr: c(
      "Invitation – {SYSTEM_NAME}",
      "Vous avez été invité à rejoindre.",
      "Vous êtes invité",
      "Vous êtes invité à créer un compte sur {SYSTEM_NAME}. Cliquez ci-dessous pour accepter.",
      "Accepter",
      "Si vous n'attendiez pas cette invitation, ignorez-la.",
    ),
    de: c(
      "Einladung – {SYSTEM_NAME}",
      "Sie wurden eingeladen.",
      "Sie sind eingeladen",
      "Sie wurden eingeladen, ein Konto bei {SYSTEM_NAME} zu erstellen. Klicken Sie unten, um anzunehmen.",
      "Einladung annehmen",
      "Wenn Sie diese Einladung nicht erwartet haben, ignorieren Sie sie.",
    ),
    es: c(
      "Invitación – {SYSTEM_NAME}",
      "Te han invitado a unirte.",
      "Has sido invitado",
      "Te han invitado a crear una cuenta en {SYSTEM_NAME}. Haz clic para aceptar.",
      "Aceptar invitación",
      "Si no esperabas esta invitación, puedes ignorarla.",
    ),
    pt: c(
      "Convite – {SYSTEM_NAME}",
      "Foi convidado a aderir.",
      "Foi convidado",
      "Foi convidado a criar uma conta no {SYSTEM_NAME}. Clique abaixo para aceitar.",
      "Aceitar convite",
      "Se não esperava este convite, pode ignorá-lo.",
    ),
    lv: c(
      "Uzaicinājums – {SYSTEM_NAME}",
      "Tevi uzaicināja pievienoties.",
      "Tu esi uzaicināts",
      "Tev ir nosūtīts uzaicinājums izveidot kontu {SYSTEM_NAME}. Noklikšķini, lai pieņemtu uzaicinājumu.",
      "Pieņemt uzaicinājumu",
      "Ja negaidīji šo uzaicinājumu, vari to ignorēt.",
    ),
    ru: c(
      "Приглашение – {SYSTEM_NAME}",
      "Вас пригласили присоединиться.",
      "Вас пригласили",
      "Вам отправили приглашение создать аккаунт в {SYSTEM_NAME}. Нажмите кнопку, чтобы принять.",
      "Принять приглашение",
      "Если вы не ожидали приглашение, проигнорируйте письмо.",
    ),
  },
  reauthentication: {
    en: c(
      "Confirm your action – {SYSTEM_NAME}",
      "Security code or link.",
      "Confirm it's you",
      "To continue a sensitive action in {SYSTEM_NAME}, please confirm your identity.",
      "Confirm",
      "If this wasn't you, change your password and contact support.",
    ),
    fr: c(
      "Confirmez votre action – {SYSTEM_NAME}",
      "Code ou lien de sécurité.",
      "Confirmez votre identité",
      "Pour poursuivre une action sensible sur {SYSTEM_NAME}, confirmez qu'il s'agit bien de vous.",
      "Confirmer",
      "Si ce n'était pas vous, changez votre mot de passe et contactez le support.",
    ),
    de: c(
      "Aktion bestätigen – {SYSTEM_NAME}",
      "Sicherheitscode oder Link.",
      "Identität bestätigen",
      "Um eine sensible Aktion in {SYSTEM_NAME} fortzusetzen, bestätigen Sie bitte Ihre Identität.",
      "Bestätigen",
      "Wenn Sie das nicht waren, ändern Sie Ihr Passwort und kontaktieren Sie den Support.",
    ),
    es: c(
      "Confirma tu acción – {SYSTEM_NAME}",
      "Código o enlace de seguridad.",
      "Confirma que eres tú",
      "Para continuar una acción sensible en {SYSTEM_NAME}, confirma tu identidad.",
      "Confirmar",
      "Si no fuiste tú, cambia tu contraseña y contacta con soporte.",
    ),
    pt: c(
      "Confirme a sua ação – {SYSTEM_NAME}",
      "Código ou ligação de segurança.",
      "Confirme a sua identidade",
      "Para continuar uma ação sensível no {SYSTEM_NAME}, confirme a sua identidade.",
      "Confirmar",
      "Se não foi consigo, altere a palavra-passe e contacte o suporte.",
    ),
    lv: c(
      "Apstiprini darbību – {SYSTEM_NAME}",
      "Drošības kods vai saite.",
      "Apstiprini identitāti",
      "Lai turpinātu sensitīvu darbību {SYSTEM_NAME}, apstiprini, ka tas esi tu.",
      "Apstiprināt",
      "Ja tu neesi mēģinājis veikt šo darbību, maini paroli un sazinies ar atbalstu.",
    ),
    ru: c(
      "Подтвердите действие – {SYSTEM_NAME}",
      "Код или ссылка безопасности.",
      "Подтвердите личность",
      "Чтобы продолжить важное действие в {SYSTEM_NAME}, подтвердите, что это вы.",
      "Подтвердить",
      "Если это не вы, смените пароль и свяжитесь с поддержкой.",
    ),
  },
  overdue_payment: {
    en: c(
      "Overdue payment: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "A payment is overdue – open your dashboard.",
      "Payment overdue",
      'Your payment "{PAYMENT_NAME}" ({AMOUNT}) was due on {DUE_DATE}. It is {OVERDUE_DAYS} day(s) overdue. Open your dashboard to mark it paid or reschedule.',
      "Open dashboard",
      "You received this because you track payments in {SYSTEM_NAME}. We send at most one reminder per payment per day.",
    ),
    fr: c(
      "Paiement en retard : {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Un paiement est en retard – ouvrez votre tableau de bord.",
      "Paiement en retard",
      "Votre paiement « {PAYMENT_NAME} » ({AMOUNT}) était dû le {DUE_DATE}. Il a {OVERDUE_DAYS} jour(s) de retard. Ouvrez le tableau de bord pour le marquer payé ou le replanifier.",
      "Ouvrir le tableau de bord",
      "Vous recevez ce rappel car vous suivez vos paiements dans {SYSTEM_NAME}. Au plus un e-mail par jour et par paiement.",
    ),
    de: c(
      "Überfällige Zahlung: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Eine Zahlung ist überfällig – Dashboard öffnen.",
      "Zahlung überfällig",
      "Ihre Zahlung „{PAYMENT_NAME}“ ({AMOUNT}) war am {DUE_DATE} fällig. Sie ist {OVERDUE_DAYS} Tag(e) überfällig. Öffnen Sie das Dashboard, um sie als bezahlt zu markieren oder zu verschieben.",
      "Dashboard öffnen",
      "Sie erhalten diese Erinnerung, weil Sie Zahlungen in {SYSTEM_NAME} verfolgen. Höchstens eine E-Mail pro Zahlung und Tag.",
    ),
    es: c(
      "Pago vencido: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Un pago está vencido – abre tu panel.",
      "Pago vencido",
      "Tu pago «{PAYMENT_NAME}» ({AMOUNT}) vencía el {DUE_DATE}. Lleva {OVERDUE_DAYS} día(s) de retraso. Abre el panel para marcarlo como pagado o reprogramarlo.",
      "Abrir panel",
      "Recibes este aviso porque sigues pagos en {SYSTEM_NAME}. Como máximo un correo al día por pago.",
    ),
    pt: c(
      "Pagamento em atraso: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Um pagamento está em atraso – abra o painel.",
      "Pagamento em atraso",
      "O seu pagamento «{PAYMENT_NAME}» ({AMOUNT}) venceu em {DUE_DATE}. Está {OVERDUE_DAYS} dia(s) em atraso. Abra o painel para marcar como pago ou reagendar.",
      "Abrir painel",
      "Recebeu este aviso porque regista pagamentos no {SYSTEM_NAME}. No máximo um email por dia por pagamento.",
    ),
    lv: c(
      "Kavēts maksājums: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Maksājums ir kavējies – atver paneli.",
      "Maksājums ir kavējies",
      "Tavs maksājums „{PAYMENT_NAME}” ({AMOUNT}) bija jāveic {DUE_DATE}. Tas ir kavējies {OVERDUE_DAYS} dienu. Atver paneli, lai atzīmētu samaksātu vai pārplānotu.",
      "Atvērt paneli",
      "Tu saņēmi šo atgādinājumu, jo esi ieslēdzis maksājumu uzskaiti {SYSTEM_NAME}. Vairāk nekā vienu reizi dienā par vienu maksājumu netiek sūtīts.",
    ),
    ru: c(
      "Просроченный платёж: {PAYMENT_NAME} – {SYSTEM_NAME}",
      "Платёж просрочен – откройте панель.",
      "Платёж просрочен",
      "Платёж «{PAYMENT_NAME}» ({AMOUNT}) должен был быть оплачен {DUE_DATE}. Просрочка: {OVERDUE_DAYS} дн. Откройте панель, чтобы отметить оплату или перенести.",
      "Открыть панель",
      "Вы получили это, потому что ведёте учёт в {SYSTEM_NAME}. Не более одного письма в день на один платёж.",
    ),
  },
};

export function getDefaultEmailCopy(
  templateId: EmailTemplateId,
  locale: string,
): EmailTemplateCopy {
  const loc = normalizeEmailLocale(locale);
  const map = defaults[templateId];
  const copy = map[loc] ?? map.en ?? map.lv;
  return { ...copy };
}

export function applySystemNameToCopy(
  copy: EmailTemplateCopy,
  systemName: string,
): EmailTemplateCopy {
  const rep = (s: string) => s.replaceAll("{SYSTEM_NAME}", systemName);
  return {
    subject: rep(copy.subject),
    preheader: rep(copy.preheader),
    headline: rep(copy.headline),
    body: rep(copy.body),
    ctaLabel: rep(copy.ctaLabel),
    footerNote: rep(copy.footerNote),
  };
}

export function applyOverduePlaceholders(
  copy: EmailTemplateCopy,
  ctx: {
    systemName: string;
    paymentName: string;
    amountFormatted: string;
    dueDateFormatted: string;
    overdueDays: number;
  },
): EmailTemplateCopy {
  const rep = (s: string) =>
    s
      .replaceAll("{SYSTEM_NAME}", ctx.systemName)
      .replaceAll("{PAYMENT_NAME}", ctx.paymentName)
      .replaceAll("{AMOUNT}", ctx.amountFormatted)
      .replaceAll("{DUE_DATE}", ctx.dueDateFormatted)
      .replaceAll("{OVERDUE_DAYS}", String(ctx.overdueDays));
  return {
    subject: rep(copy.subject),
    preheader: rep(copy.preheader),
    headline: rep(copy.headline),
    body: rep(copy.body),
    ctaLabel: rep(copy.ctaLabel),
    footerNote: rep(copy.footerNote),
  };
}

/** Visas noklusējuma valodas šablonam (admin pārbaudei) */
export function listDefaultLocalesForTemplate(
  templateId: EmailTemplateId,
): EmailPreviewLocale[] {
  return [...EMAIL_SUPPORTED_LOCALES].filter((loc) => defaults[templateId][loc]);
}
