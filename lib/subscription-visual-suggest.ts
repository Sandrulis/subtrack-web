import { FA_ICONS_ALL, FS_COLOR_DOTS } from "@/lib/fs-icons";
import {
  getFsIconPickerSearchBootstrap,
  normalizeIconSearchText,
  type FsIconPickerSearchRow,
} from "@/lib/fs-icon-picker-search";

export type SubscriptionBrandVisualRule = Readonly<{
  /** Meklē normalizētajā nosaukumā (mazie burti, bez diakritikas). */
  patterns: readonly string[];
  icon: string;
  color: string;
}>;

/** Zīmoli un tipiski atslēgvārdi → ikona + krāsa (pirms vispārīgās meklēšanas). */
export const SUBSCRIPTION_BRAND_VISUAL_RULES: SubscriptionBrandVisualRule[] = [
  { patterns: ["netflix"], icon: "fa-solid fa-film", color: "#e50914" },
  { patterns: ["disney", "hulu"], icon: "fa-solid fa-clapperboard", color: "#3b82f6" },
  { patterns: ["hbo", "max "], icon: "fa-solid fa-tv", color: "#64748b" },
  { patterns: ["prime video", "amazon prime"], icon: "fa-solid fa-film", color: "#f59e0b" },
  { patterns: ["amazon"], icon: "fa-solid fa-cart-shopping", color: "#f59e0b" },
  { patterns: ["spotify"], icon: "fa-solid fa-music", color: "#1db954" },
  { patterns: ["apple music", "itunes"], icon: "fa-solid fa-music", color: "#ef4444" },
  { patterns: ["youtube"], icon: "fa-solid fa-video", color: "#ef4444" },
  { patterns: ["twitch"], icon: "fa-solid fa-gamepad", color: "#a855f7" },
  { patterns: ["deezer", "tidal", "soundcloud"], icon: "fa-solid fa-headphones-simple", color: "#1db954" },
  { patterns: ["podcast"], icon: "fa-solid fa-podcast", color: "#ea4c89" },
  { patterns: ["google one", "google drive", "google cloud"], icon: "fa-solid fa-cloud", color: "#3b82f6" },
  { patterns: ["google"], icon: "fa-solid fa-globe", color: "#3b82f6" },
  { patterns: ["microsoft", "office 365", "onedrive"], icon: "fa-solid fa-briefcase", color: "#3b82f6" },
  { patterns: ["icloud", "apple tv"], icon: "fa-solid fa-mobile-screen-button", color: "#64748b" },
  { patterns: ["apple"], icon: "fa-solid fa-mobile-screen-button", color: "#64748b" },
  { patterns: ["dropbox"], icon: "fa-solid fa-cloud", color: "#3b82f6" },
  { patterns: ["adobe", "canva", "figma"], icon: "fa-solid fa-palette", color: "#ea4c89" },
  { patterns: ["github", "gitlab"], icon: "fa-solid fa-link", color: "#64748b" },
  { patterns: ["chatgpt", "openai", "claude"], icon: "fa-solid fa-lightbulb", color: "#059669" },
  { patterns: ["playstation", "xbox", "nintendo", "steam", "epic games"], icon: "fa-solid fa-gamepad", color: "#3b82f6" },
  { patterns: ["linkedin"], icon: "fa-solid fa-briefcase", color: "#0ea5e9" },
  { patterns: ["facebook", "meta", "instagram"], icon: "fa-solid fa-users", color: "#3b82f6" },
  { patterns: ["telegram", "whatsapp", "signal"], icon: "fa-solid fa-paper-plane", color: "#0ea5e9" },
  { patterns: ["vpn", "nordvpn", "expressvpn"], icon: "fa-solid fa-shield-halved", color: "#059669" },
  { patterns: ["apdrosinasana", "apdrošināšana", "insurance", "if ", "ergo", "balta", "gjensidige"], icon: "fa-solid fa-shield-halved", color: "#3b82f6" },
  { patterns: ["hipoteka", "hipotēka", "mortgage", "kredits", "kredīts", "aizdevums", "loan", "swedbank", "seb", "luminor", "citadele"], icon: "fa-solid fa-building-columns", color: "#64748b" },
  { patterns: ["bank", "banka"], icon: "fa-solid fa-landmark", color: "#64748b" },
  { patterns: ["latvenergo", "elektr", "elektriba", "elektrība", "utilities"], icon: "fa-solid fa-bolt", color: "#f59e0b" },
  { patterns: ["udens", "ūdens", "water", "gas"], icon: "fa-solid fa-cloud", color: "#0ea5e9" },
  { patterns: ["tele2", "bite", "lmt", "tet", "telefon", "mobile", "telia"], icon: "fa-solid fa-mobile-screen-button", color: "#0d9488" },
  { patterns: ["gym", "fitness", "sport", "sports"], icon: "fa-solid fa-dumbbell", color: "#ef4444" },
  { patterns: ["ire", "īre", "noma", "rent", "maja", "māja", "dzivoklis", "dzīvoklis", "housing"], icon: "fa-solid fa-house", color: "#059669" },
  { patterns: ["auto", "car", "leasing", "lizings", "līzings", "degviela"], icon: "fa-solid fa-car", color: "#64748b" },
  { patterns: ["wolt", "bolt food", "food", "edinasana", "ēdināšana", "restaurant"], icon: "fa-solid fa-utensils", color: "#f59e0b" },
  { patterns: ["kafija", "coffee", "starbucks"], icon: "fa-solid fa-mug-hot", color: "#059669" },
  { patterns: ["aptieka", "pharmacy", "veseliba", "veselība", "medicina", "arsts", "ārsts", "hospital"], icon: "fa-solid fa-hospital", color: "#ef4444" },
  { patterns: ["skola", "izglitiba", "izglītība", "school", "university"], icon: "fa-solid fa-school", color: "#3b82f6" },
  { patterns: ["stripe", "paypal", "klix", "maksa"], icon: "fa-solid fa-credit-card", color: "#0d9488" },
  { patterns: ["rekins", "rēķins", "invoice", "billing"], icon: "fa-solid fa-file-invoice-dollar", color: "#64748b" },
  { patterns: ["avize", "avīze", "newspaper", "press"], icon: "fa-solid fa-newspaper", color: "#64748b" },
  { patterns: ["lidmasina", "lidmašīna", "flight", "ryanair", "airbaltic"], icon: "fa-solid fa-plane", color: "#0ea5e9" },
  { patterns: ["vilciens", "train", "rail"], icon: "fa-solid fa-train", color: "#64748b" },
  { patterns: ["buss", "autobuss"], icon: "fa-solid fa-bus", color: "#3b82f6" },
  { patterns: ["zoo", "pet", "mila draugs"], icon: "fa-solid fa-paw", color: "#f59e0b" },
];

function haystackMatches(hayNorm: string, queryNorm: string): boolean {
  if (!queryNorm) return true;
  const parts = queryNorm.split(/\s+/).filter(Boolean);
  return parts.every((p) => hayNorm.includes(p));
}

function hintSortKey(row: FsIconPickerSearchRow, queryNorm: string): number {
  if (!queryNorm) return 1e10;
  const parts = queryNorm.split(/\s+/).filter(Boolean);
  if (!parts.length) return 1e10;
  const ix = row.h.indexOf(parts[0]);
  return ix === -1 ? 1e10 + (row.h.charCodeAt(0) || 0) : ix;
}

export function matchBrandVisualFromName(
  rawName: string,
  rules: readonly SubscriptionBrandVisualRule[] = SUBSCRIPTION_BRAND_VISUAL_RULES,
): { icon: string; color: string } | null {
  const norm = normalizeIconSearchText(rawName);
  if (!norm) return null;
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const p = normalizeIconSearchText(pattern);
      if (p && norm.includes(p)) {
        return { icon: rule.icon, color: rule.color };
      }
    }
  }
  return null;
}

export function suggestIconFromNameSearch(
  rawName: string,
  rows: readonly FsIconPickerSearchRow[],
): string | null {
  const norm = normalizeIconSearchText(rawName);
  if (!norm) return null;
  const matched = rows.filter((r) => haystackMatches(r.h, norm));
  if (!matched.length) return null;
  matched.sort((a, b) => {
    const ka = hintSortKey(a, norm);
    const kb = hintSortKey(b, norm);
    if (ka !== kb) return ka - kb;
    return a.cls.localeCompare(b.cls);
  });
  return matched[0].cls;
}

export function pickRandomFromList<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** FS paneļa bootstrap: zīmoli + pilns ikonu/krāsu katalogs meklēšanai. */
export function getSubscriptionVisualSuggestBootstrap(): {
  icons: string[];
  colors: string[];
  brandRules: SubscriptionBrandVisualRule[];
  iconSearch: FsIconPickerSearchRow[];
} {
  return {
    icons: [...FA_ICONS_ALL],
    colors: [...FS_COLOR_DOTS],
    brandRules: SUBSCRIPTION_BRAND_VISUAL_RULES,
    iconSearch: getFsIconPickerSearchBootstrap(),
  };
}
