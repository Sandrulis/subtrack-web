/** Vienkārša, praktiska stipruma score 0..4 (kā signup formā). */
export function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(s, 4);
}

export type PasswordStrengthTone = "weak" | "medium" | "strong" | "strongest";

export const PASSWORD_STRENGTH_META: {
  label: string;
  tone: PasswordStrengthTone;
}[] = [
  { label: "Ļoti vāja", tone: "weak" },
  { label: "Vāja", tone: "weak" },
  { label: "Vidēja", tone: "medium" },
  { label: "Stipra", tone: "strong" },
  { label: "Ļoti stipra", tone: "strongest" },
];
