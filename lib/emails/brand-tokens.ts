/** SubTrack e-pastu zīmols – atbilst `styles/subtrack.css` :root */
export const EMAIL_BRAND = {
  primary: "#00a38d",
  primaryDark: "#008a78",
  primaryLight: "#d5f5ef",
  danger: "#ef4444",
  dangerLight: "#fef2f2",
  warning: "#f59e0b",
  bg: "#f5f7fb",
  bgWhite: "#ffffff",
  text: "#1e1e2e",
  textMuted: "#64748b",
  border: "#e4e7ef",
  fontFamily:
    "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export type EmailAccent = "primary" | "danger" | "warning";

export function accentColors(accent: EmailAccent) {
  if (accent === "danger") {
    return {
      bar: EMAIL_BRAND.danger,
      button: EMAIL_BRAND.danger,
      buttonText: "#ffffff",
      light: EMAIL_BRAND.dangerLight,
    };
  }
  if (accent === "warning") {
    return {
      bar: EMAIL_BRAND.warning,
      button: EMAIL_BRAND.primary,
      buttonText: "#ffffff",
      light: "#fffbeb",
    };
  }
  return {
    bar: EMAIL_BRAND.primary,
    button: EMAIL_BRAND.primary,
    buttonText: "#ffffff",
    light: EMAIL_BRAND.primaryLight,
  };
}
