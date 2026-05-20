import webpush from "web-push";
import { configureWebPush } from "@/lib/push/vapid-config";

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendWebPushToSubscription(
  sub: PushSubscriptionRow,
  payload: PushPayload,
): Promise<void> {
  configureWebPush();
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 24 },
  );
}
