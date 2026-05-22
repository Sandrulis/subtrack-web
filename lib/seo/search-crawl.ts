/**
 * Meklētājprogrammu indeksēšanas politika (robots.txt + sitemap.xml).
 * Publiski mārketinga / juridiskie ceļi – sitemap; pārējie – disallow.
 */

/** Ceļi bez sākuma `/`; robots.txt `Disallow` vērtības. */
export const SEARCH_CRAWL_DISALLOW_PATHS = [
  // Lietotāja panelis un konta zona (prasa sesiju)
  "/dashboard",
  "/analytics",
  "/settings",
  "/subscribe",
  "/family-sharing",
  "/change-password",
  // Autentifikācija un OAuth
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
  // Administrācija un API
  "/admin",
  "/api",
  // PWA / tehniski
  "/offline",
] as const;

export type SearchCrawlSitemapEntry = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

/** Indeksējamas publiskās lapas (bez sesijas vai ar vispārīgu saturu). */
export const SEARCH_CRAWL_SITEMAP_ENTRIES: SearchCrawlSitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/demo/dashboard", changeFrequency: "weekly", priority: 0.85 },
  { path: "/demo/analytics", changeFrequency: "weekly", priority: 0.85 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
];
