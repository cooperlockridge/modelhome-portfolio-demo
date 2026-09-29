import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  COOKIE_PATH,
  DemoError,
  isSameOrigin,
  processAction,
  readSession,
  serializeSession,
} from "../../../server/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};
export async function POST(request: NextRequest) {
  try {
    if (
      !isSameOrigin(
        request.headers.get("origin"),
        request.url,
        request.headers.get("x-forwarded-host"),
        request.headers.get("host"),
      )
    )
      throw new DemoError(
        "This demo request must come from the same site.",
        403,
      );
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    )
      throw new DemoError("Send an application/json request.", 415);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 8000) throw new DemoError("Demo request is too large.", 413);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 8000)
      throw new DemoError("Demo request is too large.", 413);
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new DemoError("Invalid JSON request.");
    }
    const existing = readSession(request.cookies.get(COOKIE_NAME)?.value);
    const result = processAction(input, existing);
    const response = NextResponse.json(result.body, { headers });
    // Read-only responses must never restore an older cookie after a concurrent reset.
    if (result.session !== existing)
      response.cookies.set(COOKIE_NAME, serializeSession(result.session), {
        httpOnly: true,
        secure: new URL(request.url).protocol === "https:",
        sameSite: "strict",
        path: COOKIE_PATH,
        maxAge: Math.max(
          0,
          Math.floor((result.session.expires - Date.now()) / 1000),
        ),
      });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof DemoError
            ? error.message
            : "The demo is temporarily unavailable. Please try again.",
      },
      { status: error instanceof DemoError ? error.status : 503, headers },
    );
  }
}
