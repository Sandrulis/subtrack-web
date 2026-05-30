export { UUID_RE, isValidUuid as validUuid } from "@/lib/validation/uuid";

export function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function readFormBool(formData: FormData, key: string): boolean {
  const v = String(formData.get(key) ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

export function normalizeAdminKey(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateAdminLabel(
  raw: string,
  emptyMessage: string,
  maxLen = 160,
): string | null {
  const t = raw.trim();
  if (!t) return emptyMessage;
  if (t.length > maxLen) {
    return `Nosaukums drīkst būt līdz ${maxLen} rakstzīmēm.`;
  }
  return null;
}
