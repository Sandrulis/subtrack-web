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

function isoTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Šonedēļas maksājums (ne šodien): rīt vai +3 d., bet ne vēlāk par nedēļas beigām (pirmd.–svētd.). */
function demoDueLaterThisWeekIso(today: string): string {
  const ref = new Date(`${today}T12:00:00`);
  const dow = ref.getDay();
  const daysToSunday = dow === 0 ? 0 : 7 - dow;
  const weekEnd = addDaysIso(today, daysToSunday);
  const candidate = addDaysIso(today, dow === 0 ? 1 : Math.min(3, daysToSunday || 1));
  if (candidate <= today) return addDaysIso(today, 1);
  return candidate > weekEnd ? weekEnd : candidate;
}

/** Nākamnedēļas maksājums: otrdiena pēc šīs nedēļas svētdienas. */
function demoDueNextWeekIso(today: string): string {
  const ref = new Date(`${today}T12:00:00`);
  const dow = ref.getDay();
  const daysToSunday = dow === 0 ? 0 : 7 - dow;
  const nextMonday = addDaysIso(today, daysToSunday + 1);
  return addDaysIso(nextMonday, 1);
}

/**
 * Parauga abonementi `/demo/dashboard` un `/demo/analytics`.
 * Maksājumu datumi tiek salikti pret **šodienu** (SSR brīdī): 1× nokavēts, 1× šodien,
 * 1× vēlāk šonedēļ, 1× nākamnedēļ, pārējie tālāk kalendārā.
 */
export function buildDemoDashboardSubscriptions(
  p: DemoDashboardSubscriptionPhrases,
): SubscriptionClient[] {
  const today = isoTodayLocal();

  return [
    {
      id: "demo-fs-od-streaming",
      name: p.mockOdStreaming,
      category: "subscription",
      amount: 12.99,
      period: "monthly",
      date: addDaysIso(today, -12),
      icon: "fa-solid fa-clapperboard",
      color: "#7c3aed",
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
      date: today,
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
      date: demoDueLaterThisWeekIso(today),
      icon: "fa-solid fa-bolt",
      color: "#0891b2",
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
      date: demoDueNextWeekIso(today),
      icon: "fa-solid fa-dumbbell",
      color: "#ea580c",
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
      date: addDaysIso(today, 26),
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
      date: addDaysIso(today, 40),
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
      date: addDaysIso(today, 54),
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
          termStart: addDaysIso(today, -580),
          termEnd: addDaysIso(today, 75),
        },
        {
          id: 2,
          name: p.deviceWatchMaleLabel,
          note: "",
          amount: 13,
          termStart: addDaysIso(today, -28),
          termEnd: addDaysIso(today, 730),
        },
      ],
    },
  ];
}
