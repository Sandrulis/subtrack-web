"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export function isPushSupportedInBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function subscribeToPaymentPush(): Promise<
  { ok: true } | { ok: false; reason: "denied" | "unsupported" | "vapid" | "error"; message?: string }
> {
  if (!isPushSupportedInBrowser()) {
    return { ok: false, reason: "unsupported" };
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidPublic) {
    return { ok: false, reason: "vapid" };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      });
    }

    const json = sub.toJSON();
    const endpoint = json.endpoint;
    const keys = json.keys;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return { ok: false, reason: "error", message: "Invalid push subscription" };
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }),
    });
    const data = (await res.json()) as { success?: boolean; message?: string };
    if (!res.ok || !data.success) {
      return { ok: false, reason: "error", message: data.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Subscribe failed";
    return { ok: false, reason: "error", message };
  }
}

export async function unsubscribeFromPaymentPush(): Promise<boolean> {
  if (!isPushSupportedInBrowser()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    const endpoint = sub?.endpoint;
    if (sub) await sub.unsubscribe();
    if (endpoint) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushSupportedInBrowser()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub?.endpoint);
  } catch {
    return false;
  }
}
