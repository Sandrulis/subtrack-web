import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/security/cron-auth";
import { runWinBackEmailsCron } from "@/lib/cron/run-win-back-emails";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return runWinBackEmailsCron(request, 7);
}
