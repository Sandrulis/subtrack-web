import {
  isTransactionalEmailConfigured,
  sendRawTransactionalEmail,
  type SendEmailResult,
} from "@/lib/emails/send-transactional";
import { escapeHtmlForEmail } from "@/lib/support/escape-html";

export async function sendSupportRequestEmail(input: {
  to: string;
  replyTo: string;
  systemName: string;
  userEmail: string;
  userDisplayName: string;
  userId: string;
  message: string;
}): Promise<SendEmailResult> {
  if (!isTransactionalEmailConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "RESEND_API_KEY vai EMAIL_FROM nav iestatīts.",
    };
  }

  const subject = `[${input.systemName}] Atbalsts: ${input.userEmail}`;
  const html = `<!DOCTYPE html>
<html lang="lv">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
  <p><strong>Jauns atbalsta ziņojums</strong> (${escapeHtmlForEmail(input.systemName)})</p>
  <p>
    <strong>Lietotājs:</strong> ${escapeHtmlForEmail(input.userDisplayName)}<br>
    <strong>E-pasts:</strong> ${escapeHtmlForEmail(input.userEmail)}<br>
    <strong>Konta ID:</strong> <code>${escapeHtmlForEmail(input.userId)}</code>
  </p>
  <p><strong>Ziņojums:</strong></p>
  <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px;">${escapeHtmlForEmail(input.message)}</pre>
  <p style="color:#64748b;font-size:13px;">Atbildi tieši uz šo e-pastu – atbilde nonāks lietotāja pastkastē.</p>
</body>
</html>`;

  return sendRawTransactionalEmail({
    to: input.to,
    replyTo: input.replyTo,
    subject,
    html,
  });
}
