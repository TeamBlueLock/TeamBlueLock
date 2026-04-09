export type UnitCategory = "weight" | "volume" | "count";

export interface UnitDefinition {
  name: string;
  category: UnitCategory;
  toBase: number; // multiplier to convert to base unit
  baseUnit: string;
}

export const UNITS: Record<string, UnitDefinition> = {
  // WEIGHT (base = g)
  g: { name: "g", category: "weight", toBase: 1, baseUnit: "g" },
  kg: { name: "kg", category: "weight", toBase: 1000, baseUnit: "g" },
  oz: { name: "oz", category: "weight", toBase: 28.3495, baseUnit: "g" },
  lb: { name: "lb", category: "weight", toBase: 453.592, baseUnit: "g" },

  // VOLUME (base = ml)
  ml: { name: "ml", category: "volume", toBase: 1, baseUnit: "ml" },
  L: { name: "L", category: "volume", toBase: 1000, baseUnit: "ml" },
  tsp: { name: "tsp", category: "volume", toBase: 4.92892, baseUnit: "ml" },
  tbsp: { name: "tbsp", category: "volume", toBase: 14.7868, baseUnit: "ml" },
  fl_oz: { name: "fl oz", category: "volume", toBase: 29.5735, baseUnit: "ml" },
  cup: { name: "cup", category: "volume", toBase: 236.588, baseUnit: "ml" },
  gal: { name: "gal", category: "volume", toBase: 3785.41, baseUnit: "ml" },

  // COUNT (base = piece)
  //each: { name: "each", category: "count", toBase: 1, baseUnit: "each" },
  piece: { name: "piece", category: "count", toBase: 1, baseUnit: "piece" },
  //can: { name: "can", category: "count", toBase: 1, baseUnit: "each" },
};
