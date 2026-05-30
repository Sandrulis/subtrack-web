import { getPublicSystemSettings } from "@/lib/system-settings-public";

export type NavBrandSnapshot = {
  label: string;
  logoTopbar: string | null;
};

export async function loadNavBrandSnapshot(): Promise<NavBrandSnapshot> {
  const { systemName, brandLogo } = await getPublicSystemSettings();
  return {
    label: systemName,
    logoTopbar: brandLogo?.topbar ?? null,
  };
}
