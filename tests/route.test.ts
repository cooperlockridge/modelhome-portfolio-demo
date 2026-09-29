import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/demo/route";

const origin = "https://modelhome.example.com";
const tenantId = "cedar-and-co";
function request(
  body: unknown,
  cookie?: string,
  extra: Record<string, string> = {},
) {
  return new NextRequest(`${origin}/projects/modelhome/api/demo`, {
    method: "POST",
    headers: {
      origin,
      host: "modelhome.example.com",
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...extra,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
async function start() {
  const response = await POST(request({ action: "start", tenantId }));
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return { response, cookie: cookie.split(";")[0] };
}
const scenario = {
  action: "price",
  tenantId,
  homeId: "cedar-101",
  downPaymentPercent: 20,
  lockDays: 30,
};
test("HTTP start creates bounded secure path-scoped HttpOnly cookie and no-cache response", async () => {
  const { response } = await start();
  const cookie = response.headers.get("set-cookie")!;
  assert.match(cookie, /Path=\/projects\/modelhome/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.ok(cookie.length < 4096);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  assert.equal(response.headers.get("vary"), "Cookie");
});
test("HTTP read-only start, activity, and pricing never emit Set-Cookie", async () => {
  const { cookie } = await start();
  for (const input of [
    { action: "start", tenantId },
    { action: "activity", tenantId },
    scenario,
  ]) {
    const response = await POST(request(input, cookie));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});
test("HTTP malformed JSON, invalid schema, media type and origin are rejected without cookie changes", async () => {
  const { cookie } = await start();
  for (const [body, headers, status] of [
    ["{", {}, 400],
    [
      {
        action: "price",
        tenantId,
        homeId: "cedar-101",
        downPaymentPercent: "20",
        lockDays: 30,
      },
      {},
      400,
    ],
    [{ action: "start", tenantId }, { "content-type": "text/plain" }, 415],
    [
      { action: "start", tenantId },
      { origin: "https://foreign.example.com" },
      403,
    ],
    [{ action: "start", tenantId }, { origin: "" }, 403],
  ] as const) {
    const response = await POST(request(body, cookie, headers));
    assert.equal(response.status, status);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.match(response.headers.get("cache-control")!, /no-store/);
  }
});
test("HTTP mismatched lock referral returns 409 and leaves cookie and activity unchanged", async () => {
  const { cookie } = await start();
  const priced = await POST(
    request({ ...scenario, simulateMismatch: true }, cookie),
  );
  const pricedBody = await priced.json();
  assert.equal(pricedBody.quote.mismatch, true);
  const response = await POST(
    request(
      {
        action: "submit",
        tenantId,
        quoteToken: pricedBody.quote.token,
        buyerId: "alex",
        optionId: "standard",
      },
      cookie,
    ),
  );
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("set-cookie"), null);
  const activity = await POST(
    request({ action: "activity", tenantId }, cookie),
  );
  assert.deepEqual((await activity.json()).referrals, []);
});
test("HTTP successful submit and reset emit replacement cookies", async () => {
  const { cookie } = await start();
  const quote = (await (await POST(request(scenario, cookie))).json()).quote;
  const submitted = await POST(
    request(
      {
        action: "submit",
        tenantId,
        quoteToken: quote.token,
        buyerId: "alex",
        optionId: "standard",
      },
      cookie,
    ),
  );
  assert.equal(submitted.status, 200);
  assert.ok(submitted.headers.get("set-cookie"));
  const submittedCookie = submitted.headers.get("set-cookie")!.split(";")[0];
  assert.notEqual(submittedCookie, cookie);
  const reset = await POST(
    request({ action: "reset", tenantId }, submittedCookie),
  );
  assert.equal(reset.status, 200);
  assert.ok(reset.headers.get("set-cookie"));
  assert.deepEqual((await reset.json()).referrals, []);
});
