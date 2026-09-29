import type { PriceOption } from "./demo";

/** Illustrative fixed 30-year principal and interest only; excludes all fees and escrows. */
export function monthlyPayment(loanAmount: number, annualRate: number): number {
  const monthlyRate = annualRate / 1200;
  const payment =
    monthlyRate === 0
      ? loanAmount / 360
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -360));
  return Math.round(payment * 100) / 100;
}

export function priceOptions(
  loanAmount: number,
  baseRate: number,
): PriceOption[] {
  const specs = [
    {
      id: "standard" as const,
      label: "Balanced",
      rate: baseRate,
      upfrontCost: 1800,
    },
    {
      id: "lower-rate" as const,
      label: "Lower monthly",
      rate: baseRate - 0.375,
      upfrontCost: 5800,
    },
    {
      id: "lower-upfront" as const,
      label: "Lower upfront",
      rate: baseRate + 0.25,
      upfrontCost: 0,
    },
  ];
  return specs.map((option) => {
    return {
      ...option,
      monthlyPrincipalInterest: monthlyPayment(loanAmount, option.rate),
    };
  });
}
