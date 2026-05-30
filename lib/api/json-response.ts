import { NextResponse } from "next/server";

export function apiJsonError(
  status: number,
  message: string,
): NextResponse<{ success: false; message: string }> {
  return NextResponse.json({ success: false, message }, { status });
}

export function apiJsonOk<T extends Record<string, unknown>>(
  payload: T = {} as T,
): NextResponse<{ success: true } & T> {
  return NextResponse.json({ success: true, ...payload });
}
