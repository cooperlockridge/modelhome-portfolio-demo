import test from "node:test";
import assert from "node:assert/strict";
import {
  actionSchema,
  freshSession,
  processAction,
  readSession,
  serializeSession,
  sign,
  isSameOrigin,
  type Session,
} from "../src/server/demo";
import { buyers, homes, type Quote } from "../src/domain/demo";
const now = 1800000000000;
const tenantId = "cedar-and-co" as const;
function price(session: Session, overrides = {}): Quote {
  const result = processAction(
    {
      action: "price",
      tenantId,
      homeId: "cedar-101",
      downPaymentPercent: 20,
      lockDays: 30,
      ...overrides,
    },
    session,
    now,
  );
  assert.equal(result.body.ok, true);
  if (!result.body.ok || !result.body.quote) throw Error("missing quote");
  return result.body.quote;
}
const submit = (quote: Quote) => ({
  action: "submit",
  tenantId,
  quoteToken: quote.token,
  buyerId: "alex",
  optionId: "standard",
});
test("runtime request validation rejects arbitrary buyers, unexpected keys and invalid lock periods", () => {
  assert.equal(
    actionSchema.safeParse({
      action: "price",
      tenantId,
      homeId: "cedar-101",
      downPaymentPercent: 20,
      lockDays: 15,
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      action: "start",
      tenantId,
      email: "real@somewhere.test",
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      action: "submit",
      tenantId,
      quoteToken: "x",
      buyerId: "someone",
      optionId: "standard",
    }).success,
    false,
  );
});
test("fixtures contain six fictional homes and only example.com email addresses", () => {
  assert.equal(homes.length, 6);
  assert.ok(buyers.every((buyer) => buyer.email.endsWith("@example.com")));
});
test("session cookie detects tampering, wrong token purpose and expiration", () => {
  const session = freshSession(now);
  const token = serializeSession(session);
  assert.equal(readSession(token, now)?.visitorId, session.visitorId);
  assert.equal(readSession(token + "x", now), null);
  assert.equal(readSession(sign(session, "quote"), now), null);
  assert.equal(readSession(token, now + 3600001), null);
});
test("home access is scoped to builder", () => {
  assert.throws(
    () => price(freshSession(now), { homeId: "form-201" }),
    /builder workspace/,
  );
});
test("mock pricing is deterministic and three options vary rate and upfront cost", () => {
  const quote = price(freshSession(now));
  assert.equal(quote.loanAmount, 340000);
  assert.equal(quote.rate, 6.25);
  assert.equal(quote.options.length, 3);
  assert.ok(
    quote.options[1].monthlyPrincipalInterest <
      quote.options[0].monthlyPrincipalInterest,
  );
  assert.ok(quote.options[1].upfrontCost > quote.options[0].upfrontCost);
});
test("mismatched provider lock is signed but independently rejected at submit", () => {
  const session = freshSession(now);
  const quote = price(session, { simulateMismatch: true });
  assert.equal(quote.mismatch, true);
  assert.notEqual(quote.requestedLockDays, quote.returnedLockDays);
  assert.throws(
    () => processAction(submit(quote), session, now),
    /Lock period mismatch/,
  );
});
test("quote cannot cross visitors or tenants", () => {
  const session = freshSession(now);
  const quote = price(session);
  assert.throws(
    () => processAction(submit(quote), freshSession(now), now),
    /another demo session/,
  );
  assert.throws(
    () =>
      processAction(
        { ...submit(quote), tenantId: "form-and-field" },
        session,
        now,
      ),
    /another builder/,
  );
});
test("quote expiration and tampering prevent referrals", () => {
  const session = freshSession(now);
  const quote = price(session);
  assert.throws(
    () => processAction(submit(quote), session, now + 600001),
    /expired/,
  );
  assert.throws(
    () =>
      processAction(
        { ...submit(quote), quoteToken: quote.token + "x" },
        session,
        now,
      ),
    /Invalid demo token/,
  );
});
test("referrals visible only in active visitor and tenant; accepted quote consumed in current state", () => {
  const session = freshSession(now);
  const quote = price(session);
  const result = processAction(submit(quote), session, now);
  assert.equal(result.session.referrals.length, 1);
  const otherTenant = processAction(
    { action: "activity", tenantId: "form-and-field" },
    result.session,
    now,
  );
  assert.ok(otherTenant.body.ok);
  if (otherTenant.body.ok) assert.equal(otherTenant.body.referrals?.length, 0);
  assert.equal(freshSession(now).referrals.length, 0);
  assert.throws(
    () => processAction(submit(quote), result.session, now),
    /another demo session/,
  );
});
test("reset replaces visitor and prevents prior quote being submitted", () => {
  const session = freshSession(now);
  const quote = price(session);
  const reset = processAction({ action: "reset", tenantId }, session, now);
  assert.notEqual(reset.session.visitorId, session.visitorId);
  assert.equal(reset.session.referrals.length, 0);
  assert.throws(
    () => processAction(submit(quote), reset.session, now),
    /another demo session/,
  );
});
test("eight referrals remain within cookie size and further submissions refused", () => {
  let session = freshSession(now);
  for (let i = 0; i < 8; i++)
    session = processAction(submit(price(session)), session, now).session;
  assert.ok(serializeSession(session).length < 3800);
  assert.throws(
    () => processAction(submit(price(session)), session, now),
    /eight referrals/,
  );
});
test("origin validation rejects cross-site, absent and malformed origins; accepts host-preserving proxy", () => {
  assert.equal(
    isSameOrigin(
      "https://cooperlockridge.com",
      "https://localhost/projects/modelhome/api/demo",
      "cooperlockridge.com",
      "localhost",
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      "https://attacker.test",
      "https://cooperlockridge.com/api/demo",
      null,
      "cooperlockridge.com",
    ),
    false,
  );
  assert.equal(
    isSameOrigin(null, "https://cooperlockridge.com/api/demo", null, null),
    false,
  );
  assert.equal(
    isSameOrigin("null", "https://cooperlockridge.com/api/demo", null, null),
    false,
  );
});
