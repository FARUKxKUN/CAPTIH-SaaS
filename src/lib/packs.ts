/**
 * Credit pack catalog — single source of truth for pricing.
 * Prices/minutes locked in CAPTIH-V1-SPEC.md. amount is in TND.
 */
export type PackType = "pack_10" | "pack_30" | "pack_60" | "pack_180";

export type Pack = {
  type: PackType;
  minutes: number;
  amount: number; // TND
  daysValid: number;
  label: string;
};

export const PACKS: Record<PackType, Pack> = {
  pack_10: { type: "pack_10", minutes: 10, amount: 10, daysValid: 365, label: "10 minutes" },
  pack_30: { type: "pack_30", minutes: 30, amount: 22, daysValid: 365, label: "30 minutes" },
  pack_60: { type: "pack_60", minutes: 60, amount: 38, daysValid: 365, label: "60 minutes" },
  pack_180: { type: "pack_180", minutes: 180, amount: 88, daysValid: 365, label: "180 minutes" },
};

export function getPack(type: string): Pack | null {
  return (PACKS as Record<string, Pack>)[type] ?? null;
}
