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

    // User-defined columns
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true } // createdAt + updatedAt (Last Updated)
);

export const InventoryItem =
  models.InventoryItem || model("InventoryItem", InventorySchema);