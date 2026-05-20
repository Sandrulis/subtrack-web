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
