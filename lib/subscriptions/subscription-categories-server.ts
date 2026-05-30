import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import {
  getUiPhraseForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";

/** Noklusējums, ja migrācija vēl nav palaista. */
export const LEGACY_SUBSCRIPTION_CATEGORY_KEYS = [
  "subscription",
  "bill",
  "credit",
  "leasing",
  "insurance",
  "other",
] as const;

export type SubscriptionCategoryCatalogRow = {
  id: string;
  category_key: string;
  label: string;
  sort_order: number;
  usage_count: number;
  enabled: boolean;
  updated_at: string;
};

export type SubscriptionCategoryUiOption = {
  key: string;
  label: string;
  /** Globālā lietojuma skaita atsauce (modāļa kārtošanai). */
  usage_count?: number;
  /** Admin fallback secība, ja skaiti vienādi. */
  sort_order?: number;
};

type CategoryRowRaw = {
  category_key: string;
  label: string;
  sort_order: number;
  usage_count?: number | null;
  enabled?: boolean | null;
};

function phraseKeyForCategory(key: string): string {
  return `subscription.category.${key}`;
}

/** Admin: pārrēķina usage_count no visiem maksājumiem (RPC tikai service_role, skat. 158_*). */
export async function refreshSubscriptionCategoryUsageCounts(): Promise<void> {
  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return;
  }
  const { error } = await svc.rpc("refresh_subscription_category_usage_counts");
  if (error && !/function .* does not exist/i.test(error.message)) {
    console.warn("[categories] refresh usage_count:", error.message);
  }
}

export async function fetchSubscriptionCategoryCatalogRows(): Promise<{
  rows: SubscriptionCategoryCatalogRow[];
  loadError: string | null;
}> {
  await refreshSubscriptionCategoryUsageCounts();

  const supabase = await createServerSupabaseClient();
  const primary = await supabase
    .from("subscription_categories")
    .select("id, category_key, label, sort_order, usage_count, enabled, updated_at")
    .order("sort_order", { ascending: true })
    .order("category_key", { ascending: true });

  let rawRows: Record<string, unknown>[] | null =
    (primary.data as Record<string, unknown>[] | null) ?? null;
  let error = primary.error;

  if (error && /usage_count|column/i.test(error.message)) {
    const fallback = await supabase
      .from("subscription_categories")
      .select("id, category_key, label, sort_order, enabled, updated_at")
      .order("sort_order", { ascending: true })
      .order("category_key", { ascending: true });
    rawRows = (fallback.data as Record<string, unknown>[] | null) ?? null;
    error = fallback.error;
  }

  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return { rows: [], loadError: error.message };
    }
    return { rows: [], loadError: error.message };
  }

  const rows = (rawRows ?? [])
    .filter((r) => r?.id != null && r?.category_key)
    .map((r) => {
      const usageRaw = r.usage_count;
      const usage_count =
        typeof usageRaw === "number" && Number.isFinite(usageRaw) ? usageRaw : 0;
      return {
        id: String(r.id),
        category_key: String(r.category_key),
        label: String(r.label ?? ""),
        sort_order: Number(r.sort_order) || 0,
        usage_count,
        enabled: r.enabled === true,
        updated_at: String(r.updated_at ?? ""),
      } satisfies SubscriptionCategoryCatalogRow;
    });
  return { rows, loadError: null };
}

export async function fetchAllowedSubscriptionCategoryKeys(opts?: {
  /** Ja true, iekļauj arī atslēgas, kas admin panelī ir izslēgtas (esošiem ierakstiem). */
  includeDisabled?: boolean;
}): Promise<Set<string>> {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("subscription_categories").select("category_key, enabled");

  if (!opts?.includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return new Set(LEGACY_SUBSCRIPTION_CATEGORY_KEYS);
  }

  const keys = (data as CategoryRowRaw[])
    .map((r) => String(r.category_key ?? "").trim())
    .filter(Boolean);
  if (!keys.length) {
    return new Set(LEGACY_SUBSCRIPTION_CATEGORY_KEYS);
  }
  return new Set(keys);
}

function countCategoriesFromSubscriptions(
  subscriptionCategories?: Iterable<string | null | undefined>,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!subscriptionCategories) return counts;
  for (const raw of subscriptionCategories) {
    const k = String(raw ?? "").trim().toLowerCase();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Panelim un demo: ieslēgtās kategorijas; kārtība: lietotāja lietojums, globālā popularitāte, admin secība. */
export async function fetchEnabledSubscriptionCategoryOptions(
  subscriptionCategories?: Iterable<string | null | undefined>,
): Promise<SubscriptionCategoryUiOption[]> {
  const supabase = await createServerSupabaseClient();
  const { locale } = await resolveRequestUiLocales();
  const userCounts = countCategoriesFromSubscriptions(subscriptionCategories);

  const primary = await supabase
    .from("subscription_categories")
    .select("category_key, label, sort_order, usage_count")
    .eq("enabled", true);

  let rawRows: Record<string, unknown>[] | null =
    (primary.data as Record<string, unknown>[] | null) ?? null;
  let error = primary.error;

  if (error && /usage_count|column/i.test(error.message)) {
    const fallback = await supabase
      .from("subscription_categories")
      .select("category_key, label, sort_order")
      .eq("enabled", true);
    rawRows = (fallback.data as Record<string, unknown>[] | null) ?? null;
    error = fallback.error;
  }

  if (error || !rawRows?.length) {
    return legacyCategoryOptions(locale);
  }

  const rows = rawRows as CategoryRowRaw[];
  type RankedOption = SubscriptionCategoryUiOption & {
    userCount: number;
    usage_count: number;
    sort_order: number;
  };
  const ranked: RankedOption[] = [];
  for (const row of rows) {
    const key = String(row.category_key ?? "").trim().toLowerCase();
    if (!key) continue;
    const phrase = await getUiPhraseForRequest(phraseKeyForCategory(key));
    const label =
      phrase && phrase !== phraseKeyForCategory(key)
        ? phrase
        : String(row.label ?? "").trim() || key;
    ranked.push({
      key,
      label,
      userCount: userCounts.get(key) ?? 0,
      usage_count:
        typeof row.usage_count === "number" && Number.isFinite(row.usage_count)
          ? row.usage_count
          : 0,
      sort_order: Number(row.sort_order) || 0,
    });
  }

  ranked.sort((a, b) => {
    if (b.userCount !== a.userCount) return b.userCount - a.userCount;
    if (b.usage_count !== a.usage_count) return b.usage_count - a.usage_count;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.key.localeCompare(b.key, locale, { sensitivity: "base" });
  });

  const options = ranked.map(({ key, label, usage_count, sort_order }) => ({
    key,
    label,
    usage_count,
    sort_order,
  }));

  if (!options.length) {
    return legacyCategoryOptions(locale);
  }
  return options;
}

async function legacyCategoryOptions(
  _locale: string,
): Promise<SubscriptionCategoryUiOption[]> {
  const options: SubscriptionCategoryUiOption[] = [];
  for (const key of LEGACY_SUBSCRIPTION_CATEGORY_KEYS) {
    const phrase = await getUiPhraseForRequest(phraseKeyForCategory(key));
    options.push({
      key,
      label:
        phrase && phrase !== phraseKeyForCategory(key) ? phrase : key,
    });
  }
  return options;
}
