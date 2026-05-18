import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/subscribe",
  "/settings",
  "/change-password",
  "/admin",
] as const;

/** Tikai bez sesijas - ar sesiju vienmēr uz paneļu. */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"] as const;

function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

function isGuestOnlyPath(path: string): boolean {
  return (GUEST_ONLY_PATHS as readonly string[]).includes(path);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) {
    to.cookies.set(c.name, c.value, {
      path: c.path ?? "/",
      domain: c.domain,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite as "lax" | "strict" | "none" | undefined,
      maxAge: c.maxAge,
    });
  }
}

/**
 * Atjauno Supabase Auth sesiju un (ja konfigurēts) aizsargā paneļa maršrutus.
 */
export async function updateSession(request: NextRequest) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && isProtectedPath(path)) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    const redirectRes = NextResponse.redirect(home);
    copyCookies(supabaseResponse, redirectRes);
    return redirectRes;
  }

  if (user && isGuestOnlyPath(path)) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/dashboard";
    dash.search = "";
    const redirectRes = NextResponse.redirect(dash);
    copyCookies(supabaseResponse, redirectRes);
    return redirectRes;
  }

  return supabaseResponse;
}
