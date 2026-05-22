import type { Metadata } from "next";
import { AdminCronJobsIntro } from "@/components/admin/admin-intros";
import { AdminCronJobsPanel } from "@/components/admin/admin-cron-jobs-panel";
import { isTransactionalEmailConfigured } from "@/lib/emails/send-transactional";
import { isWebPushConfigured } from "@/lib/push/vapid-config";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.cron_jobs"),
  };
}

export default function AdminCronJobsPage() {
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());

  return (
    <div className="admin-page">
      <AdminCronJobsIntro />
      <AdminCronJobsPanel
        cronSecretConfigured={cronSecretConfigured}
        resendConfigured={isTransactionalEmailConfigured()}
        vapidConfigured={isWebPushConfigured()}
      />
    </div>
  );
}
