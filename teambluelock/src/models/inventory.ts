// src/models/inventory.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryItem extends Document {
  userId: string;
  name: string;          // "Beef Patty"
  unit: string;          // "piece", "kg", etc.
  unitCost: number;      // cost per unit
  inStock?: number;      // optional, for later
  reorderPoint?: number; // optional, for later
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name:   { type: String, required: true },
    unit:   { type: String, required: true },
    unitCost: { type: Number, required: true, default: 0 },
    inStock: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InventoryItem: Model<IInventoryItem> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>("InventoryItem", InventorySchema);
