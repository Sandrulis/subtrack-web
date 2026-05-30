import { createAuthorizedCronGetRoute } from "@/lib/cron/email-reminder-send";
import { runWinBackEmailsCron } from "@/lib/cron/run-win-back-emails";

export const GET = createAuthorizedCronGetRoute("win-back-30d-emails", (request) =>
  runWinBackEmailsCron(request, 30),
);
