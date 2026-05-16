import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const cfg = getSupabasePublicConfig();
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (!cfg) {
    url.pathname = "/login";
    url.searchParams.set(
      "error",
      "Supabase nav konfigurēts. Lokāli: palaid npm run dev mapē, kur līdzās package.json ir .env.local ar NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_ANON_KEY; pārstartē serveri. Deploy: ievadi tās pašas vērtības hostinga env. Saitei jāved uz šo pašu vidi.",
    );
    url.searchParams.delete("code");
    return NextResponse.redirect(url);
  }

  if (!code) {
    url.pathname = "/login";
    url.searchParams.set("error", "kods_trūkst");
    return NextResponse.redirect(url);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Route Handler: set var būt ierobežots; vēlāk sesiju atjauno middleware */
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    url.pathname = "/login";
    url.searchParams.set("error", error.message);
    url.searchParams.delete("code");
    return NextResponse.redirect(url);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.searchParams.delete("code");
  redirectUrl.searchParams.delete("next");
  return NextResponse.redirect(redirectUrl);
}
