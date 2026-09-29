import { z } from "zod";

export const tenantSchema = z.enum(["cedar-and-co", "form-and-field"]);
export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), tenantId: tenantSchema }).strict(),
  z.object({ action: z.literal("activity"), tenantId: tenantSchema }).strict(),
  z.object({ action: z.literal("reset"), tenantId: tenantSchema }).strict(),
  z
    .object({
      action: z.literal("price"),
      tenantId: tenantSchema,
      homeId: z.string().min(1).max(60),
      downPaymentPercent: z.number().min(5).max(50),
      lockDays: z.union([z.literal(30), z.literal(45), z.literal(60)]),
      simulateMismatch: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("submit"),
      tenantId: tenantSchema,
      quoteToken: z.string().min(1).max(2000),
      buyerId: z.enum(["alex", "jordan", "sam"]),
      optionId: z.enum(["standard", "lower-rate", "lower-upfront"]),
    })
    .strict(),
]);
