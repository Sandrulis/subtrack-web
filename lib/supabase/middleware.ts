import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/family-sharing",
  "/subscribe",
  "/settings",
  "/email-notifications",
  "/change-password",
  "/admin",
] as const;

/** Tikai bez sesijas - ar sesiju vienmēr uz paneļu. */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"] as const;

/** API bez sesijas (cron, dev probe). */
const API_PUBLIC_PREFIXES = ["/api/cron/", "/api/dev-env-check"] as const;

function isApiPath(path: string): boolean {
  return path === "/api" || path.startsWith("/api/");
}

function isPublicApiPath(path: string): boolean {
  return API_PUBLIC_PREFIXES.some(
    (p) => path === p || path.startsWith(p),
  );
}

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

/** Root layout: `body.landing-page` bez klienta inline skripta (hydration). */
function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Atjauno Supabase Auth sesiju un (ja konfigurēts) aizsargā paneļa maršrutus.
 */
export async function updateSession(request: NextRequest) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return nextWithPathname(request);
  }

  let supabaseResponse = nextWithPathname(request);

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = nextWithPathname(request);
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

  if (!user && isApiPath(path) && !isPublicApiPath(path)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

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
