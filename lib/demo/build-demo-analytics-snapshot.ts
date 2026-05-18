import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";

const PIE_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#3b82f6",
  "#64748b",
  "#e11d48",
  "#8b5cf6",
  "#059669",
  "#d97706",
] as const;

const VALID_CATS = new Set([
  "subscription",
  "bill",
  "credit",
  "leasing",
  "insurance",
  "other",
]);

function normalizeCategory(key: string): string {
  const k = String(key || "subscription").toLowerCase();
  return VALID_CATS.has(k) ? k : "subscription";
}

function categoryPhraseKey(cat: string): string {
  return `subscription.category.${normalizeCategory(cat)}`;
}

function monthlyEquivalent(s: SubscriptionClient): number {
  let base = Number(s.amount) || 0;
  if (s.period === "yearly") base = base / 12;
  else if (s.period === "weekly") base = base * 4.33;
  const dev = (s.devices ?? []).reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );
  return base + dev;
}

export type DemoAnalyticsPieRow = {
  categoryPhraseKey: string;
  amount: number;
  color: string;
};

export type DemoAnalyticsSnapshot = {
  monthlyTotal: number;
  yearlyEstimate: number;
  upcomingWindowTotal: number;
  upcomingCount: number;
  pieRows: DemoAnalyticsPieRow[];
  nextPayment: {
    dateLabel: string;
    name: string;
    amount: number;
  } | null;
};

/**
 * Agregāti analītikas demo kartēm no tiem pašiem `SubscriptionClient`, ko izmanto panelis.
 */
export function buildDemoAnalyticsSnapshot(
  subs: SubscriptionClient[],
  formatMonthDay: (isoDate: string) => string,
): DemoAnalyticsSnapshot {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);

  const monthlyTotal = subs.reduce((s, x) => s + monthlyEquivalent(x), 0);

  const byCat: Record<string, number> = {};
  for (const s of subs) {
    const k = normalizeCategory(s.category);
    byCat[k] = (byCat[k] ?? 0) + monthlyEquivalent(s);
  }
  const pieKeys = Object.keys(byCat).sort(
    (a, b) => (byCat[b] ?? 0) - (byCat[a] ?? 0),
  );
  const pieRows: DemoAnalyticsPieRow[] = pieKeys.map((k, i) => ({
    categoryPhraseKey: categoryPhraseKey(k),
    amount: byCat[k] ?? 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const upcoming = subs.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date + "T00:00:00");
    return !Number.isNaN(d.getTime()) && d >= today && d <= horizon;
  });
  const upcomingTotal = upcoming.reduce(
    (s, x) => s + monthlyEquivalent(x),
    0,
  );

  const future = subs
    .filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date + "T00:00:00");
      return !Number.isNaN(d.getTime()) && d >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.date + "T00:00:00").getTime() -
        new Date(b.date + "T00:00:00").getTime(),
    );
  const nx = future[0];
  const nextPayment = nx
    ? {
        dateLabel: formatMonthDay(nx.date),
        name: nx.name,
        amount: monthlyEquivalent(nx),
      }
    : null;

  return {
    monthlyTotal,
    yearlyEstimate: monthlyTotal * 12,
    upcomingWindowTotal: upcomingTotal,
    upcomingCount: upcoming.length,
    pieRows,
    nextPayment,
  };
}
