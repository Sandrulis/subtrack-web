/**
 * Tulkošanas atslēgas demo paneļa abonementu nosaukumiem (`buildDemoDashboardSubscriptions`).
 * Kopīgas `/demo/dashboard` un `/demo/analytics` (vienoti parauga dati).
 */
export const DEMO_DASHBOARD_PHRASE_KEYS = [
  "landing.mock.sample_bill_name",
  "demo.dashboard.sub_mortgage",
  "demo.dashboard.device_watch_zane",
  "demo.dashboard.device_watch_sandris",
  "demo.dashboard.mock_od_streaming",
  "demo.dashboard.mock_od_gym",
  "demo.dashboard.mock_today_meal",
  "demo.dashboard.mock_week_bill",
] as const;

export type DemoDashboardPhraseKey = (typeof DEMO_DASHBOARD_PHRASE_KEYS)[number];
