import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

function safeNextPath(nextParam: string | null): string {
  const next = (nextParam ?? "/dashboard").trim();
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

function appendRecoveryFlag(url: URL, nextPath: string): void {
  if (nextPath === "/change-password" || nextPath.startsWith("/change-password?")) {
    url.searchParams.set("recovery", "1");
  }
}

export async function GET(request: NextRequest) {
  const cfg = getSupabasePublicConfig();
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (!cfg) {
    url.pathname = "/login";
    url.searchParams.set(
      "error",
      "Supabase nav konfigurēts. Lokāli: palaid npm run dev mapē, kur līdzās package.json ir .env.local ar NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_ANON_KEY; pārstartē serveri. Deploy: ievadi tās pašas vērtības hostinga env. Saitei jāved uz šo pašu vidi.",
    );
    url.searchParams.delete("code");
    url.searchParams.delete("token_hash");
    url.searchParams.delete("type");
    return NextResponse.redirect(url);
  }

  if (!code && !(tokenHash && otpType)) {
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
          /* Route Handler: set var būt ierobežots; vēlāk sesiju atjauno proxy */
        }
      },
    },
  });

  let errorMessage: string | null = null;

  if (tokenHash && otpType) {
    const allowed: EmailOtpType[] = [
      "signup",
      "recovery",
      "invite",
      "magiclink",
      "email_change",
    ];
    const type = allowed.includes(otpType as EmailOtpType)
      ? (otpType as EmailOtpType)
      : null;
    if (!type) {
      url.pathname = "/login";
      url.searchParams.set("error", "nederigs_saites_tips");
      return NextResponse.redirect(url);
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) errorMessage = error.message;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) errorMessage = error.message;
  }

  if (errorMessage) {
    url.pathname = "/login";
    url.searchParams.set("error", errorMessage);
    url.searchParams.delete("code");
    url.searchParams.delete("token_hash");
    url.searchParams.delete("type");
    return NextResponse.redirect(url);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = nextPath.split("?")[0] ?? nextPath;
  redirectUrl.search = "";
  appendRecoveryFlag(redirectUrl, nextPath);
  redirectUrl.searchParams.delete("code");
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("next");
  return NextResponse.redirect(redirectUrl);
}
