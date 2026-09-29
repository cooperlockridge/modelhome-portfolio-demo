/** Entirely fictional, deterministic public demo fixtures. */
export const builders = [
  {
    id: "cedar-and-co",
    name: "Cedar & Co.",
    description: "Thoughtfully built homes in welcoming communities.",
    tagline: "Room to grow, thoughtfully built.",
    color: "#63745b",
  },
  {
    id: "form-and-field",
    name: "Form & Field",
    description: "Modern homes made for everyday living.",
    tagline: "A fresh perspective on home.",
    color: "#a37152",
  },
] as const;
export type TenantId = (typeof builders)[number]["id"];
export const communities = [
  {
    id: "juniper-grove",
    tenantId: "cedar-and-co",
    name: "Juniper Grove",
    description: "Quiet streets and room for what comes next.",
    location: "Meadow County · fictional location",
  },
  {
    id: "willow-trace",
    tenantId: "cedar-and-co",
    name: "Willow Trace",
    description: "Quiet streets and room for what comes next.",
    location: "Meadow County · fictional location",
  },
  {
    id: "solstice-park",
    tenantId: "form-and-field",
    name: "Solstice Park",
    description: "Fresh architecture around a shared green.",
    location: "Haven County · fictional location",
  },
] as const;
export const homes = [
  {
    id: "cedar-101",
    variant: 0,
    tenantId: "cedar-and-co",
    communityId: "juniper-grove",
    name: "The Alder",
    address: "101 Juniper Lane",
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 1840,
    status: "Move-in ready",
  },
  {
    id: "cedar-102",
    variant: 1,
    tenantId: "cedar-and-co",
    communityId: "juniper-grove",
    name: "The Fern",
    address: "108 Juniper Lane",
    price: 469000,
    beds: 4,
    baths: 2.5,
    sqft: 2180,
    status: "Move-in ready",
  },
  {
    id: "cedar-103",
    variant: 2,
    tenantId: "cedar-and-co",
    communityId: "willow-trace",
    name: "The Rowan",
    address: "24 Willow Walk",
    price: 515000,
    beds: 4,
    baths: 3,
    sqft: 2480,
    status: "Coming soon",
  },
  {
    id: "form-200",
    variant: 3,
    tenantId: "form-and-field",
    communityId: "solstice-park",
    name: "The Linden",
    address: "3 Solstice Way",
    price: 449000,
    beds: 3,
    baths: 2.5,
    sqft: 2060,
    status: "Move-in ready",
  },
  {
    id: "form-201",
    variant: 4,
    tenantId: "form-and-field",
    communityId: "solstice-park",
    name: "The Arc",
    address: "7 Solstice Way",
    price: 555000,
    beds: 4,
    baths: 3,
    sqft: 2620,
    status: "Move-in ready",
  },
  {
    id: "form-202",
    variant: 5,
    tenantId: "form-and-field",
    communityId: "solstice-park",
    name: "The Horizon",
    address: "15 Solstice Way",
    price: 609000,
    beds: 4,
    baths: 3.5,
    sqft: 2910,
    status: "Coming soon",
  },
] as const;
export type Home = (typeof homes)[number];
export const buyers = [
  { id: "alex", name: "Alex Morgan", email: "alex.morgan@example.com" },
  { id: "jordan", name: "Jordan Ellis", email: "jordan.ellis@example.com" },
  { id: "sam", name: "Sam Rivera", email: "sam.rivera@example.com" },
] as const;
export type Referral = {
  id: string;
  tenantId: TenantId;
  homeId: string;
  buyerId: string;
  createdAt: string;
  status: "Demo submitted";
  rate: number;
  lockDays: number;
};
export type PriceOption = {
  id: "standard" | "lower-rate" | "lower-upfront";
  label: string;
  rate: number;
  monthlyPrincipalInterest: number;
  upfrontCost: number;
};
export type Quote = {
  token: string;
  homeId: string;
  tenantId: TenantId;
  homePrice: number;
  downPaymentPercent: number;
  loanAmount: number;
  lockDays: number;
  rate: number;
  monthlyPrincipalInterest: number;
  expiresAt: string;
  provider: "mock";
  requestedLockDays: number;
  returnedLockDays: number;
  mismatch: boolean;
  options: PriceOption[];
};
export type DemoAction =
  | { action: "start" | "activity" | "reset"; tenantId: TenantId }
  | {
      action: "price";
      tenantId: TenantId;
      homeId: string;
      downPaymentPercent: number;
      lockDays: number;
      simulateMismatch?: boolean;
    }
  | {
      action: "submit";
      tenantId: TenantId;
      quoteToken: string;
      buyerId: string;
      optionId: PriceOption["id"];
    };
export type DemoResponse =
  | { ok: true; visitorId?: string; referrals?: Referral[]; quote?: Quote }
  | { ok: false; error: string };
