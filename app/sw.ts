/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const apiOnly = new NetworkOnly();
const documentNetworkFirst = new NetworkFirst({
  cacheName: "repazy-pages",
  networkTimeoutSeconds: 8,
  plugins: [],
});

const filteredDefaultCache = defaultCache.filter((entry) => {
  const matcher = entry.matcher;
  if (typeof matcher === "function") {
    return true;
  }
  if (matcher instanceof RegExp) {
    const src = matcher.source;
    if (src.includes("api")) return false;
  }
  return true;
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: apiOnly,
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: documentNetworkFirst,
    },
    ...filteredDefaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  badgeCount?: number;
};

self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json() as PushPayload | undefined;
    } catch {
      return undefined;
    }
  })();

  const title = data?.title?.trim() || "repazy";
  const body = data?.body?.trim() || "";
  const url = data?.url?.trim() || "/dashboard";
  const tag = data?.tag?.trim() || "repazy-payment";

  const badgeCount =
    typeof data?.badgeCount === "number" && Number.isFinite(data.badgeCount)
      ? Math.max(0, Math.floor(data.badgeCount))
      : undefined;

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        tag,
        data: { url },
        icon: "/icon/192",
        badge: "/icon/192",
      });
      if (badgeCount === undefined || !("setAppBadge" in self.navigator)) return;
      try {
        if (badgeCount > 0) {
          await self.navigator.setAppBadge(badgeCount);
        } else if ("clearAppBadge" in self.navigator) {
          await self.navigator.clearAppBadge();
        }
      } catch {
        // Nav atbalsta šajā ierīcē / kontekstā.
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : "/dashboard";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            await client.navigate(url);
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
