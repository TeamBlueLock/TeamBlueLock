import { Schema, model, models } from "mongoose";

const InventorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    // Core
    name: { type: String, required: true },
    unit: { type: String, required: true },
    unitCost: { type: Number, default: 0 },
    inStock: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 0 },

    baseUnit: {
      type: String,
      required: true,
    },

    costPerBaseUnit: {
      type: Number,
      required: true,
    },

    // User-defined columns
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    gramsPerPiece: { type: Number },
    gramsPerMl: { type: Number },
    mlPerPiece: { type: Number },
  },
  { timestamps: true } // createdAt + updatedAt (Last Updated)
);

export const InventoryItem =
  models.InventoryItem || model("InventoryItem", InventorySchema);