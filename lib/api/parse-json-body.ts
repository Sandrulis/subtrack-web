import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";

export type ParseJsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse };

export async function parseJsonBody(
  request: Request,
  invalidMessage = "Invalid JSON",
): Promise<ParseJsonBodyResult> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: apiJsonError(400, invalidMessage) };
  }
}

export function asJsonRecord(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : {};
}
