export {};

declare global {
  interface Window {
    fsBootDashAlerts?: () => void;
  }
}
