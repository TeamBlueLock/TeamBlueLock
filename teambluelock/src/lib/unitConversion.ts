import { UNITS } from "./units";

export function convertToBase(
  amount: number,
  unitName: string
): { baseAmount: number; baseUnit: string } {
  const unit = UNITS[unitName];

  if (!unit) {
    throw new Error(`Unknown unit: ${unitName}`);
  }

  return {
    baseAmount: amount * unit.toBase,
    baseUnit: unit.baseUnit,
  };
}

export function getUnitCategory(unit: string) {
  if (["g", "kg", "lb", "oz"].includes(unit)) return "mass";
  if (["ml", "L", "tsp", "tbsp", "fl_oz", "cup", "gal"].includes(unit)) return "volume";
  if (["count", "piece", "each"].includes(unit)) return "count";
  return null;
}