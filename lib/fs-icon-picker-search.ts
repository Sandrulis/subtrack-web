/**
 * Ikonu atlases meklēšana (FS paneļa modālis): kopīgas atslēgas vārdi + FA slug dabas vārdi.
 * Salīdzināšanas laikā teksts tiek normalize (mazie burti, noņemtas diaktriķas) – "māja" == "maja".
 */
import { FA_ICONS_ALL } from "@/lib/fs-icons";

/** Vienotas normalizācijas UI un servera pusē bootstrap ģenerēšanai. */
export function normalizeIconSearchText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Mark}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Piedāvājamie piesaucieni slug vārda daļām; pārējās meklē pēc FA angļu nosaukumiem + normalizācijas.
 */
const SLUG_ALIAS: Record<string, string[]> = {
  film: ["kino", "movie", "movies", "streaming", "serial"],
  music: ["mūzika", "muzika", "audio"],
  headphones: ["austiņas", "austinas", "headset"],
  tv: ["televizija", "television"],
  cloud: ["makons"],
  briefcase: ["darbs", "work", "business", "bizness"],
  newspaper: ["laikraksts", "zinas", "news", "subscription"],
  book: ["gramata"],
  gamepad: ["speļ", "gaming"],
  gift: ["davana", "present"],
  lock: ["atslega", "drosiba"],
  envelope: ["epasts", "email", "mail"],
  plane: ["lidmasina", "aviation"],
  lightbulb: ["ideja"],
  bolt: ["elektr", "utilities"],
  dumbbell: ["sports", "fitness"],
  wrench: ["remonts", "tool"],
  house: ["home", "maja", "dzivoklis", "housing", "dom"],
  building: ["eka", "buve"],
  columns: ["bank", "banka", "banking", "hipoteka", "mortgage", "loan", "kredits"],
  store: ["veikals", "shop"],
  car: ["auto", "masina"],
  bus: ["autobuss", "tramvajs"],
  train: ["vilciens"],
  ship: ["kugis"],
  bicycle: ["velosipeds", "ritenis"],
  mug: ["kafija", "tea", "coffee"],
  utensils: ["ediens", "food"],
  burger: ["est", "fast"],
  pizza: ["pic"],
  credit: ["kredits", "aizdevums", "loan"],
  card: ["karte", "maksa", "visa", "mastercard"],
  mobile: ["telefon", "tel"],
};

/** Pilnas klases – papildslānis pie slug vārdiem. */
const PER_CLASS_ALIAS: Partial<Record<string, string[]>> = {
  "fa-solid fa-landmark": ["likums", "valsts", "government"],
  "fa-solid fa-hospital": ["veseliba", "medicina", "arsts"],
  "fa-solid fa-school": ["izglitiba", "skola"],
  "fa-solid fa-file-invoice-dollar": ["rekins", "billing", "invoice"],
  "fa-solid fa-receipt": ["ceks", "kvits"],
  "fa-solid fa-newspaper": ["abonement", "subscriptions"],
  "fa-solid fa-credit-card": ["norekinu"],
  "fa-solid fa-money-bill-wave": ["nauda", "alga", "maks"],
  "fa-solid fa-coins": ["monetas"],
  "fa-solid fa-chart-line": ["ienemum", "diagram"],
  "fa-solid fa-chart-pie": ["analitika"],
  "fa-solid fa-podcast": ["podcastu"],
};

function slugPartsFromCls(cls: string): string[] {
  const m = /^fa-solid fa-([\s\S]+)$/.exec(cls);
  if (!m) return [];
  return m[1].split("-").filter(Boolean);
}

function tokensForClass(cls: string): string[] {
  const parts = slugPartsFromCls(cls);
  const raw: string[] = [];
  raw.push(...(PER_CLASS_ALIAS[cls] ?? []));
  raw.push(...parts);
  if (parts.length > 1) {
    raw.push(parts.join(""));
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    raw.push(p);
    const aliases = SLUG_ALIAS[p];
    if (aliases && aliases.length) {
      raw.push(...aliases);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = normalizeIconSearchText(String(raw[i]));
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function haystackNormalizedForFaIcon(cls: string): string {
  return normalizeIconSearchText(tokensForClass(cls).join(" "));
}

export type FsIconPickerSearchRow = Readonly<{ cls: string; h: string }>;

/** Kārtība kā `FA_ICONS_ALL` – vienāda kā pilnam režģim un hintu kārtībai bez filtra. */
export function getFsIconPickerSearchBootstrap(): FsIconPickerSearchRow[] {
  return FA_ICONS_ALL.map((cls) => ({
    cls,
    h: haystackNormalizedForFaIcon(cls),
  }));
}
