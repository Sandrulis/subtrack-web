/** Klienta IP no reverse proxy / CDN galvenēm (kā rate limit). */
export function clientIpFromHeaders(headerStore: Headers): string {
  const xff = headerStore.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headerStore.get("x-real-ip")?.trim();
  if (real) return real;
  return headerStore.get("cf-connecting-ip")?.trim() ?? "unknown";
}

export function isPrivateOrUnknownIp(ip: string): boolean {
  const t = ip.trim().toLowerCase();
  if (!t || t === "unknown") return true;
  if (t === "::1" || t.startsWith("127.")) return true;
  if (t.startsWith("10.")) return true;
  if (t.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(t)) return true;
  return false;
}
