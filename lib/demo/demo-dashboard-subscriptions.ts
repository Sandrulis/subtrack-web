import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";

export type DemoDashboardSubscriptionPhrases = {
  sampleBillName: string;
  mortgageName: string;
  /** Tulkošana: `demo.dashboard.device_watch_zane` (sieviešu vārds pēc lokāles). */
  deviceWatchFemaleLabel: string;
  /** Tulkošana: `demo.dashboard.device_watch_sandris` (vīriešu vārds pēc lokāles). */
  deviceWatchMaleLabel: string;
  mockOdStreaming: string;
  mockOdGym: string;
  mockTodayMeal: string;
  mockWeekBill: string;
};

/**
 * Parauga abonementi `/demo/dashboard` (_FS bootstrap_). Datumi salikti ap **2026-05-18**
 * (kavēti, šodien, tuvākās dienas, vēlāk jūnijā); termiņi ierīcēm aprēķinās pret „šodienu” klientā.
 */
export function buildDemoDashboardSubscriptions(
  p: DemoDashboardSubscriptionPhrases,
): SubscriptionClient[] {
  return [
    {
      id: "demo-fs-od-streaming",
      name: p.mockOdStreaming,
      category: "subscription",
      amount: 12.99,
      period: "monthly",
      date: "2026-05-05",
      icon: "fa-solid fa-clapperboard",
      color: "#7c3aed",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-od-gym",
      name: p.mockOdGym,
      category: "other",
      amount: 39.9,
      period: "monthly",
      date: "2026-05-11",
      icon: "fa-solid fa-dumbbell",
      color: "#ea580c",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-today-meal",
      name: p.mockTodayMeal,
      category: "subscription",
      amount: 8.99,
      period: "monthly",
      date: "2026-05-18",
      icon: "fa-solid fa-utensils",
      color: "#ca8a04",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-week-utilities",
      name: p.mockWeekBill,
      category: "bill",
      amount: 41.5,
      dynamicAmount: true,
      period: "monthly",
      date: "2026-05-22",
      icon: "fa-solid fa-bolt",
      color: "#0891b2",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-netflix",
      name: "Netflix",
      category: "subscription",
      amount: 11.99,
      period: "monthly",
      date: "2026-06-14",
      icon: "fa-solid fa-tv",
      color: "#e50914",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-mortgage",
      name: p.mortgageName,
      category: "credit",
      amount: 578,
      period: "monthly",
      date: "2026-06-17",
      icon: "fa-solid fa-house-chimney",
      color: "#16a34a",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [],
    },
    {
      id: "demo-fs-lmt",
      name: p.sampleBillName,
      category: "bill",
      amount: 50,
      period: "monthly",
      date: "2026-06-21",
      icon: "fa-solid fa-mobile-screen-button",
      color: "#dc2626",
      note: "",
      termStart: "",
      termEnd: "",
      devices: [
        {
          id: 1,
          name: p.deviceWatchFemaleLabel,
          note: "",
          amount: 15,
          termStart: "2024-10-01",
          termEnd: "2026-08-15",
        },
        {
          id: 2,
          name: p.deviceWatchMaleLabel,
          note: "",
          amount: 13,
          termStart: "2026-05-01",
          termEnd: "2028-04-30",
        },
      ],
    },
  ];
}
