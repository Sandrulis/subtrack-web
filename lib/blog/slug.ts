const SLUG_MAX_LEN = 120;

/** Virsraksts -> URL segments: atstarpes un "_" par "-", tikai [a-z0-9-]. */
export function titleToBlogSlug(title: string): string {
  let s = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!s) s = "post";
  if (s.length > SLUG_MAX_LEN) {
    s = s.slice(0, SLUG_MAX_LEN).replace(/-+$/, "");
  }
  return s || "post";
}

export function isValidBlogSlug(slug: string): boolean {
  const t = slug.trim();
  return (
    t.length >= 2 &&
    t.length <= SLUG_MAX_LEN &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t)
  );
}

/** Ja slug aizņemts, pievieno -2, -3, ... */
export async function ensureUniqueBlogSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>,
  excludeId?: string | null,
): Promise<string> {
  const root = titleToBlogSlug(baseSlug);
  if (!(await isSlugTaken(root, isTaken, excludeId))) return root;

  for (let n = 2; n < 500; n++) {
    const suffix = `-${n}`;
    const trimmed = root.slice(0, Math.max(2, SLUG_MAX_LEN - suffix.length));
    const candidate = `${trimmed.replace(/-+$/, "")}${suffix}`;
    if (!(await isSlugTaken(candidate, isTaken, excludeId))) return candidate;
  }
  return `${root.slice(0, 100)}-${Date.now()}`;
}

async function isSlugTaken(
  slug: string,
  isTaken: (slug: string) => Promise<boolean>,
  excludeId?: string | null,
): Promise<boolean> {
  void excludeId;
  return isTaken(slug);
}
