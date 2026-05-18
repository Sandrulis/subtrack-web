import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { resolveSessionIsAdmin } from "@/lib/auth/is-admin";

/** Paneļa augšējās joslas lietotāja attēlošana (serveris → props). */
export type NavUserDisplay = {
  displayName: string;
  initials: string;
  /** public.users.is_admin > 0; ja nav kolonnas / rindiņas — false */
  isAdmin?: boolean;
  /** public.users.paid_plan_active (apmaksa / checkout) */
  paidPlanActive?: boolean;
  /** public.users.pro_vip; admin dāvināta Pro piekļuve */
  proVip?: boolean;
};

function firstGrapheme(s: string): string {
  const t = s.trim();
  if (!t) return "";
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const { segment } of seg.segment(t)) return segment;
  } catch {
    /* Intl nav pieejams retos vidēs */
  }
  return t[0] ?? "";
}

function graphemeUpper(ch: string): string {
  return ch.toLocaleUpperCase(undefined);
}

/** Pirmajās divās grafēmās (piem. inicialēm vienā vārdā). */
function takeFirstNGraphemesUpper(s: string, n: number): string {
  const t = s.trim();
  if (!t || n <= 0) return "";
  let out = "";
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const { segment } of seg.segment(t)) {
      out += graphemeUpper(segment);
      count++;
      if (count >= n) break;
    }
  } catch {
    out = t.slice(0, n).toLocaleUpperCase(undefined);
  }
  return out;
}

/** Augšējās joslas inicialēm parasti max 2 grafēmas. */
function limitInitialsDisplay(s: string, maxGraphemes: number): string {
  const t = s.trim();
  if (!t) return "";
  let out = "";
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const { segment } of seg.segment(t)) {
      out += segment;
      count++;
      if (count >= maxGraphemes) break;
    }
  } catch {
    out = t.slice(0, maxGraphemes);
  }
  return out;
}

function metaString(u: User | undefined, keys: string[]): string {
  const md = u?.user_metadata as Record<string, unknown> | undefined;
  if (!md) return "";
  for (const k of keys) {
    const v = md[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function navUserDisplayFromParts(
  name: string,
  surname: string,
  email: string,
): NavUserDisplay {
  const nameT = name.trim();
  const surnameT = surname.trim();

  let displayName = [nameT, surnameT].filter(Boolean).join(" ");
  if (!displayName) {
    const local = email.split("@")[0]?.trim();
    displayName = local || "Lietotājs";
  }

  let initials = "";
  if (nameT && surnameT) {
    initials =
      graphemeUpper(firstGrapheme(nameT)) +
      graphemeUpper(firstGrapheme(surnameT));
  } else {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials =
        graphemeUpper(firstGrapheme(parts[0])) +
        graphemeUpper(firstGrapheme(parts[parts.length - 1]));
    } else if (parts.length === 1 && parts[0] !== "Lietotājs") {
      initials = takeFirstNGraphemesUpper(parts[0], 2);
    }
  }

  if (!initials && email) {
    const local = email.split("@")[0] ?? "";
    const cleaned = local.replace(/[.+_-]/g, "");
    initials =
      cleaned.length >= 2
        ? takeFirstNGraphemesUpper(cleaned, 2)
        : cleaned.length === 1
          ? graphemeUpper(cleaned)
          : "";
  }

  if (!initials) initials = "?";

  return {
    displayName,
    initials: limitInitialsDisplay(initials, 2),
  };
}

function profileFromAuthMetadata(user: User): NavUserDisplay {
  const first = metaString(user, ["first_name", "given_name"]);
  const last = metaString(user, ["last_name", "family_name"]);
  return navUserDisplayFromParts(first, last, user.email ?? "");
}

/**
 * Aktīvās sesijas lietotāja vārds / inicialēs paneļa augšējai joslai.
 * Vispirms `public.users`; ja trūkst lauku – Auth `user_metadata`; tad e-pasts.
 */
async function getSessionUserDisplayImpl(): Promise<NavUserDisplay | null> {
  const { supabase, user, authError: authErr } = await loadAuthContext();

  if (authErr || !user) return null;

  const { data: row, error: rowErr } = await supabase
    .from("users")
    .select("name, surname, is_admin, paid_plan_active, pro_vip")
    .eq("id", user.id)
    .maybeSingle();

  const name = typeof row?.name === "string" ? row.name : "";
  const surname = typeof row?.surname === "string" ? row.surname : "";
  const isAdmin = await resolveSessionIsAdmin(supabase, row);
  const paidPlanActive =
    !rowErr &&
    row &&
    typeof (row as { paid_plan_active?: unknown }).paid_plan_active === "boolean"
      ? (row as { paid_plan_active: boolean }).paid_plan_active
      : false;
  const proVip =
    !rowErr &&
    row &&
    typeof (row as { pro_vip?: unknown }).pro_vip === "boolean"
      ? (row as { pro_vip: boolean }).pro_vip
      : false;

  const trimmedName = name.trim();
  const trimmedSurname = surname.trim();

  if (!trimmedName && !trimmedSurname) {
    const fromMeta = profileFromAuthMetadata(user);
    return { ...fromMeta, isAdmin, paidPlanActive, proVip };
  }

  return {
    ...navUserDisplayFromParts(trimmedName, trimmedSurname, user.email ?? ""),
    isAdmin,
    paidPlanActive,
    proVip,
  };
}

/** Viena pilna sesijas profila izvērtešana uz RSC pieprasījumu. */
export const getSessionUserDisplay = cache(getSessionUserDisplayImpl);

/**
 * Droša sesijas lasīšana publiskām lapām (piem. `/`): bez Supabase .env vai citām kļūdām atgriež null.
 */
export async function getSessionUserDisplaySafe(): Promise<NavUserDisplay | null> {
  if (!getSupabasePublicConfig()) return null;
  try {
    return await getSessionUserDisplay();
  } catch {
    return null;
  }
}
