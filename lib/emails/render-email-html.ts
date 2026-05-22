import { accentColors, EMAIL_BRAND } from "./brand-tokens";
import type { EmailRenderContext, EmailTemplateCopy } from "./template-types";

function escHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Vienkārša rinda tekstā -> <br> (e-pastiem droši) */
function bodyToHtml(body: string): string {
  return escHtml(body).replaceAll("\n", "<br />");
}

export function renderEmailHtml(
  copy: EmailTemplateCopy,
  ctx: EmailRenderContext,
): string {
  const accent = accentColors(ctx.accent);
  const preheader = escHtml(copy.preheader);
  const headline = escHtml(copy.headline);
  const body = bodyToHtml(copy.body);
  const cta = escHtml(copy.ctaLabel);
  const footer = escHtml(copy.footerNote);
  const systemName = escHtml(ctx.systemName);
  const actionUrl = escHtml(ctx.actionUrl);

  return `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:${EMAIL_BRAND.fontFamily};color:${EMAIL_BRAND.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${EMAIL_BRAND.bgWhite};border-radius:20px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.07);">
          <tr>
            <td style="height:6px;background:${accent.bar};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">${systemName}</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;line-height:1.35;color:${EMAIL_BRAND.text};">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 24px;">
              <p style="margin:0;font-size:15px;line-height:1.65;color:${EMAIL_BRAND.text};">${body}</p>
              ${ctx.extraSectionsHtml ? `<div style="margin-top:20px;">${ctx.extraSectionsHtml}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;" align="left">
              <a href="${actionUrl}" style="display:inline-block;padding:14px 28px;background:${accent.button};color:${accent.buttonText};font-size:15px;font-weight:600;text-decoration:none;border-radius:14px;">${cta}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:${accent.light};border-top:1px solid ${EMAIL_BRAND.border};">
              <p style="margin:0;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.textMuted};">${footer}</p>
            </td>
          </tr>
        </table>
        ${ctx.secondaryFooterHtml ? `<p style="margin:12px 0 0;font-size:12px;color:${EMAIL_BRAND.textMuted};text-align:center;">${ctx.secondaryFooterHtml}</p>` : ""}
        <p style="margin:20px 0 0;font-size:12px;color:${EMAIL_BRAND.textMuted};text-align:center;">
          &copy; ${new Date().getFullYear()} ${systemName}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
