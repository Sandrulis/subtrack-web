import webpush from "web-push";

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function isWebPushConfigured(): boolean {
  const pub = getVapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  return Boolean(pub && priv && subject);
}

export function configureWebPush(): void {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID atslēgas nav konfigurētas.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
