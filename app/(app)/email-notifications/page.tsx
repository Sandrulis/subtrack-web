import { redirect } from "next/navigation";

export default async function EmailNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ disable?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.disable) qs.set("disable", sp.disable);
  const tail = qs.toString();
  redirect(tail ? `/settings?${tail}` : "/settings");
}
