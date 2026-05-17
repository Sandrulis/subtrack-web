export {};

declare global {
  interface Window {
    fsBootDashAlerts?: () => void;
    fsBootDashboard?: () => void;
    fsBootAnalytics?: () => void;
  }
}
