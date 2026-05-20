import {
  PWA_DEFAULT_BACKGROUND_COLOR,
  PWA_DEFAULT_SHORT_NAME,
  PWA_DEFAULT_THEME_COLOR,
} from "@/lib/pwa/defaults";

export type PublicPwaSettings = {
  enabled: boolean;
  installBannerEnabled: boolean;
  installSettingsEnabled: boolean;
  cacheRevision: number;
  themeColor: string;
  backgroundColor: string;
  shortName: string;
};

const PWA_DEFAULTS: PublicPwaSettings = {
  enabled: true,
  installBannerEnabled: true,
  installSettingsEnabled: true,
  cacheRevision: 1,
  themeColor: PWA_DEFAULT_THEME_COLOR,
  backgroundColor: PWA_DEFAULT_BACKGROUND_COLOR,
  shortName: PWA_DEFAULT_SHORT_NAME,
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim();
  return HEX_COLOR_RE.test(t) ? t : fallback;
}

export function normalizePwaRow(data: unknown, systemName: string): PublicPwaSettings {
  if (!data || typeof data !== "object") return { ...PWA_DEFAULTS };
  const r = data as Record<string, unknown>;
  const enabled =
    r.pwa_enabled === undefined
      ? PWA_DEFAULTS.enabled
      : r.pwa_enabled === true || r.pwa_enabled === "true" || r.pwa_enabled === 1;
  const installBannerEnabled =
    r.pwa_install_banner_enabled === undefined
      ? PWA_DEFAULTS.installBannerEnabled
      : r.pwa_install_banner_enabled === true ||
        r.pwa_install_banner_enabled === "true" ||
        r.pwa_install_banner_enabled === 1;
  const installSettingsEnabled =
    r.pwa_install_settings_enabled === undefined
      ? PWA_DEFAULTS.installSettingsEnabled
      : r.pwa_install_settings_enabled === true ||
        r.pwa_install_settings_enabled === "true" ||
        r.pwa_install_settings_enabled === 1;
  const revRaw = r.pwa_cache_revision;
  const cacheRevision =
    typeof revRaw === "number" && Number.isFinite(revRaw)
      ? Math.max(1, Math.trunc(revRaw))
      : typeof revRaw === "string"
        ? Math.max(1, Number.parseInt(revRaw, 10) || 1)
        : PWA_DEFAULTS.cacheRevision;
  const shortRaw = typeof r.pwa_short_name === "string" ? r.pwa_short_name.trim() : "";
  const shortName =
    shortRaw.length > 0 ? shortRaw.slice(0, 12) : systemName.slice(0, 12) || PWA_DEFAULT_SHORT_NAME;
  return {
    enabled,
    installBannerEnabled: enabled && installBannerEnabled,
    installSettingsEnabled: enabled && installSettingsEnabled,
    cacheRevision,
    themeColor: normalizeHexColor(r.pwa_theme_color, PWA_DEFAULT_THEME_COLOR),
    backgroundColor: normalizeHexColor(r.pwa_background_color, PWA_DEFAULT_BACKGROUND_COLOR),
    shortName,
  };
}

export function disabledPwaSettings(): PublicPwaSettings {
  return {
    ...PWA_DEFAULTS,
    enabled: false,
    installBannerEnabled: false,
    installSettingsEnabled: false,
  };
}
