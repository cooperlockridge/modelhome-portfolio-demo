import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { actionSchema, tenantSchema } from "../domain/validation";
import { monthlyPayment, priceOptions } from "../domain/pricing";
export { actionSchema } from "../domain/validation";
import {
  buyers,
  homes,
  type DemoResponse,
  type Quote,
  type Referral,
  type TenantId,
} from "../domain/demo";

const referralSchema = z.object({
  id: z.string().uuid(),
  tenantId: tenantSchema,
  homeId: z.string(),
  buyerId: z.string(),
  createdAt: z.string(),
  status: z.literal("Demo submitted"),
  rate: z.number(),
  lockDays: z.number(),
});
const sessionSchema = z.object({
  version: z.literal(1),
  visitorId: z.string().uuid(),
  nonce: z.string().uuid(),
  expires: z.number(),
  referrals: z.array(referralSchema).max(8),
});
export type Session = z.infer<typeof sessionSchema>;
const quoteSchema = z.object({
  kind: z.literal("quote"),
  visitorId: z.string().uuid(),
  nonce: z.string().uuid(),
  tenantId: tenantSchema,
  homeId: z.string(),
  homePrice: z.number(),
  downPaymentPercent: z.number(),
  loanAmount: z.number(),
  lockDays: z.number(),
  providerLockDays: z.number(),
  rate: z.number(),
  monthlyPrincipalInterest: z.number(),
  expires: z.number(),
});
const TTL = 60 * 60 * 1000;
const QUOTE_TTL = 10 * 60 * 1000;
export const COOKIE_NAME = "modelhome_demo_session";
export const COOKIE_PATH = "/projects/modelhome";
function secret(): string {
  const configured = process.env.MODELHOME_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo session configuration is unavailable.");
  return "local-only-modelhome-secret-do-not-use-in-production";
}
function signature(payload: string, purpose: string) {
  return createHmac("sha256", secret())
    .update(`${purpose}:${payload}`)
    .digest("base64url");
}
export function sign(value: unknown, purpose: "session" | "quote"): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${signature(payload, purpose)}`;
}
function verify(token: string, purpose: "session" | "quote"): unknown {
  if (token.length > 3900) throw new DemoError("Invalid demo token.", 400);
  const parts = token.split(".");
  if (parts.length !== 2) throw new DemoError("Invalid demo token.", 400);
  const [payload, received] = parts;
  const expected = signature(payload, purpose);
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    throw new DemoError("Invalid demo token.", 400);
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new DemoError("Invalid demo token.", 400);
  }
}
export class DemoError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function freshSession(now = Date.now()): Session {
  return {
    version: 1,
    visitorId: randomUUID(),
    nonce: randomUUID(),
    expires: now + TTL,
    referrals: [],
  };
}
export function readSession(cookie?: string, now = Date.now()): Session | null {
  if (!cookie) return null;
  try {
    const result = sessionSchema.safeParse(verify(cookie, "session"));
    return result.success && result.data.expires > now ? result.data : null;
  } catch (error) {
    if (error instanceof DemoError) return null;
    throw error;
  }
}
export function serializeSession(session: Session): string {
  const value = sign(session, "session");
  if (value.length > 3800)
    throw new DemoError("Demo session is full. Reset the demo to continue.");
  return value;
}
function tenantHome(tenantId: TenantId, homeId: string) {
  const home = homes.find(
    (home) => home.id === homeId && home.tenantId === tenantId,
  );
  if (!home)
    throw new DemoError(
      "That home is not available in this builder workspace.",
      403,
    );
  return home;
}
export function mockPrice(
  homePrice: number,
  downPaymentPercent: number,
  lockDays: number,
  mismatch = false,
) {
  // Synthetic values, intentionally unrelated to live lending or eligibility.
  const providerLockDays = mismatch ? (lockDays === 30 ? 45 : 30) : lockDays;
  const rate =
    6.25 +
    (providerLockDays === 45 ? 0.125 : providerLockDays === 60 ? 0.25 : 0);
  const loanAmount = Math.round(homePrice * (1 - downPaymentPercent / 100));
  const monthlyPrincipalInterest = monthlyPayment(loanAmount, rate);
  return { rate, loanAmount, monthlyPrincipalInterest, providerLockDays };
}
export function processAction(
  input: unknown,
  existing: Session | null,
  now = Date.now(),
): { body: DemoResponse; session: Session } {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success)
    throw new DemoError(
      "Invalid demo request. Use a listed builder, home, buyer, and lock period.",
    );
  const action = parsed.data;
  let session = existing && existing.expires > now ? existing : null;
  if (action.action === "reset") session = freshSession(now);
  if (action.action === "start" || action.action === "reset") {
    session ??= freshSession(now);
    return {
      body: {
        ok: true,
        visitorId: session.visitorId,
        referrals: session.referrals.filter(
          (item) => item.tenantId === action.tenantId,
        ),
      },
      session,
    };
  }
  if (!session)
    throw new DemoError(
      "Your demo session expired. Start the demo again.",
      401,
    );
  if (action.action === "activity")
    return {
      body: {
        ok: true,
        visitorId: session.visitorId,
        referrals: session.referrals.filter(
          (item) => item.tenantId === action.tenantId,
        ),
      },
      session,
    };
  if (action.action === "price") {
    const home = tenantHome(action.tenantId, action.homeId);
    const result = mockPrice(
      home.price,
      action.downPaymentPercent,
      action.lockDays,
      action.simulateMismatch,
    );

    const payload = {
      kind: "quote" as const,
      visitorId: session.visitorId,
      nonce: session.nonce,
      tenantId: action.tenantId,
      homeId: home.id,
      homePrice: home.price,
      downPaymentPercent: action.downPaymentPercent,
      lockDays: action.lockDays,
      ...result,
      expires: Math.min(now + QUOTE_TTL, session.expires),
    };
    const quote: Quote = {
      token: sign(payload, "quote"),
      homeId: home.id,
      tenantId: action.tenantId,
      homePrice: home.price,
      downPaymentPercent: action.downPaymentPercent,
      loanAmount: result.loanAmount,
      lockDays: action.lockDays,
      rate: result.rate,
      monthlyPrincipalInterest: result.monthlyPrincipalInterest,
      expiresAt: new Date(payload.expires).toISOString(),
      provider: "mock",
      requestedLockDays: action.lockDays,
      returnedLockDays: result.providerLockDays,
      mismatch: action.lockDays !== result.providerLockDays,
      options: priceOptions(result.loanAmount, result.rate),
    };
    return { body: { ok: true, quote }, session };
  }
  const result = quoteSchema.safeParse(verify(action.quoteToken, "quote"));
  if (!result.success)
    throw new DemoError("Invalid demo quote. Price the home again.");
  const quote = result.data;
  if (quote.visitorId !== session.visitorId || quote.nonce !== session.nonce)
    throw new DemoError("This quote belongs to another demo session.", 403);
  if (quote.tenantId !== action.tenantId)
    throw new DemoError(
      "This quote belongs to another builder workspace.",
      403,
    );
  tenantHome(action.tenantId, quote.homeId);
  if (quote.expires <= now)
    throw new DemoError(
      "This demo quote has expired. Price the home again.",
      409,
    );
  if (quote.providerLockDays !== quote.lockDays)
    throw new DemoError("Lock period mismatch. Quote refused.", 409);
  if (!buyers.some((buyer) => buyer.id === action.buyerId))
    throw new DemoError("Choose a preset demo buyer.");
  if (session.referrals.length >= 8)
    throw new DemoError(
      "Your demo has eight referrals. Reset it to begin a fresh session.",
      409,
    );
  const selectedOption = priceOptions(quote.loanAmount, quote.rate).find(
    (option) => option.id === action.optionId,
  )!;
  const referral: Referral = {
    id: randomUUID(),
    tenantId: action.tenantId,
    homeId: quote.homeId,
    buyerId: action.buyerId,
    createdAt: new Date(now).toISOString(),
    status: "Demo submitted",
    rate: selectedOption.rate,
    lockDays: quote.lockDays,
  };
  // Rotate the nonce after submission: a quote is usable once within the current cookie state.
  session = {
    ...session,
    nonce: randomUUID(),
    referrals: [...session.referrals, referral],
  };
  serializeSession(session);
  return {
    body: {
      ok: true,
      visitorId: session.visitorId,
      referrals: session.referrals.filter(
        (item) => item.tenantId === action.tenantId,
      ),
    },
    session,
  };
}

export function isSameOrigin(
  origin: string | null,
  requestUrl: string,
  forwardedHost: string | null,
  host: string | null,
): boolean {
  if (!origin || origin === "null") return false;
  try {
    const source = new URL(origin);
    const destination = new URL(requestUrl);
    if (source.protocol !== "https:" && source.protocol !== "http:")
      return false;
    const expectedHost =
      forwardedHost?.split(",")[0].trim() || host || destination.host;
    return (
      source.host === expectedHost && source.protocol === destination.protocol
    );
  } catch {
    return false;
  }
}
