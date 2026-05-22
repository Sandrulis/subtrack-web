import { type NextRequest } from "next/server";
import { authRateLimitedResponse } from "@/lib/security/auth-rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const limited = await authRateLimitedResponse(request);
  if (limited) {
    return limited;
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ietver visas ceļu grupas, izņemot statiku un bildes.
     * Neesam maskā: _next/static, _next/image, favicon, /fs/ (public/fs),
     * lai JS/CSS no public neiet cauri Supabase proxy slānim.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|fs/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
