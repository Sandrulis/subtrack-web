import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { isSentryEnabled } from "@/lib/sentry/is-sentry-enabled";

/** Lokāla Sentry pārbaude tikai ar `SENTRY_ENABLED=1` .env.local. Produkcijā 404. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  if (!isSentryEnabled()) {
    return NextResponse.json({
      ok: false,
      message:
        "Sentry lokāli izslēgts (kvota). Pievieno .env.local: SENTRY_ENABLED=1, pārstartē npm run dev.",
    });
  }

  const err = new Error("Sentry API test — delete me");
  const eventId = Sentry.captureException(err);
  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    eventId: eventId ?? null,
    hint: "Skatīt Sentry Issues pēc ~30 s.",
  });
}
