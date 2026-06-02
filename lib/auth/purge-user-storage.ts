import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** Bucketi, kuros faili var būt mapēti pēc lietotāja ID (ja bucket eksistē). */
const USER_OWNED_STORAGE_BUCKETS = ["avatars", "user-avatars", "profiles"] as const;

const REMOVE_BATCH = 100;

function parseObjectPathFromSupabaseStorageUrl(
  url: string,
  projectBaseUrl: string,
): { bucket: string; path: string } | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return null;

  const base = projectBaseUrl.replace(/\/$/, "");
  const prefixes = [
    `${base}/storage/v1/object/public/`,
    `${base}/storage/v1/object/authenticated/`,
    `${base}/storage/v1/object/sign/`,
  ];

  for (const prefix of prefixes) {
    if (!trimmed.startsWith(prefix)) continue;
    const rest = trimmed.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) continue;
    const bucket = rest.slice(0, slash);
    const path = decodeURIComponent(rest.slice(slash + 1).split("?")[0] ?? "");
    if (bucket && path) return { bucket, path };
  }

  return null;
}

async function listStoragePathsUnderPrefix(
  service: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const folder = prefix.replace(/\/$/, "");
  const { data, error } = await service.storage.from(bucket).list(folder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data?.length) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const name = entry.name?.trim();
    if (!name) continue;
    const full = folder ? `${folder}/${name}` : name;

    if (entry.id == null) {
      const nested = await listStoragePathsUnderPrefix(service, bucket, full);
      paths.push(...nested);
    } else {
      paths.push(full);
    }
  }
  return paths;
}

async function removeStoragePaths(
  service: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  if (!paths.length) return;
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const batch = paths.slice(i, i + REMOVE_BATCH);
    await service.storage.from(bucket).remove(batch);
  }
}

/**
 * Dzēš Storage objektus, kas saistīti ar lietotāju (prefix `{userId}/`, avatar URL).
 * Bucketi, kas neeksistē, tiek ignorēti.
 */
export async function purgeUserStorageFiles(
  service: SupabaseClient,
  userId: string,
  avatarUrl?: string | null,
): Promise<void> {
  const toRemove = new Map<string, Set<string>>();

  function addPath(bucket: string, path: string): void {
    const b = bucket.trim();
    const p = path.trim().replace(/^\/+/, "");
    if (!b || !p) return;
    if (!toRemove.has(b)) toRemove.set(b, new Set());
    toRemove.get(b)!.add(p);
  }

  const cfg = getSupabasePublicConfig();
  if (cfg && avatarUrl?.trim()) {
    const parsed = parseObjectPathFromSupabaseStorageUrl(avatarUrl.trim(), cfg.url);
    if (parsed) addPath(parsed.bucket, parsed.path);
  }

  const prefix = userId.trim();
  if (!prefix) return;

  for (const bucket of USER_OWNED_STORAGE_BUCKETS) {
    try {
      const paths = await listStoragePathsUnderPrefix(service, bucket, prefix);
      for (const p of paths) addPath(bucket, p);
    } catch {
      /* bucket var neeksistēt */
    }
  }

  for (const [bucket, paths] of toRemove) {
    await removeStoragePaths(service, bucket, [...paths]);
  }
}
