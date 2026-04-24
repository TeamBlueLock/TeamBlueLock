import { Schema, model, models } from "mongoose";

/**
 * Defines the schema for inventory items stored in the database.
 *
 * This schema represents all inventory items owned by a user, including
 * core item details such as name, unit, cost, and stock levels. It also
 * stores normalized unit data (base unit and cost per base unit) to
 * support consistent calculations across different measurement types.
 *
 * The schema additionally supports user-defined custom fields and
 * optional conversion helpers that allow transformations between
 * count, mass, and volume units (used in profit analysis calculations).
 */
const InventorySchema = new Schema(
  {
    /**
     * Unique identifier for the user who owns the inventory item.
     */
    userId: { type: String, required: true, index: true },

    /**
     * Name of the inventory item (e.g., "Flour", "Milk").
     */
    name: { type: String, required: true },

    /**
     * Original unit of measurement for the item (e.g., "kg", "cups").
     */
    unit: { type: String, required: true },

    /**
     * Cost per unit as entered by the user.
     */
    unitCost: { type: Number, default: 0 },

    /**
     * Current quantity of the item in stock.
     */
    inStock: { type: Number, default: 0 },

    /**
     * Threshold at which the item should be reordered.
     */
    reorderPoint: { type: Number, default: 0 },

    /**
     * Normalized base unit used for internal calculations (e.g., "g", "ml").
     */
    baseUnit: {
      type: String,
      required: true,
    },

    /**
     * Cost per normalized base unit, used for consistent cost calculations.
     */
    costPerBaseUnit: {
      type: Number,
      required: true,
    },

    /**
     * Stores user-defined custom fields for each inventory item.
     * These fields are dynamic and can vary depending on user configuration.
     */
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    /**
     * Conversion helper: grams per single item (used for count → mass conversions).
     */
    gramsPerPiece: { type: Number },

    /**
     * Conversion helper: grams per milliliter (used for volume ↔ mass conversions).
     */
    gramsPerMl: { type: Number },

    /**
     * Conversion helper: milliliters per piece (used for count ↔ volume conversions).
     */
    mlPerPiece: { type: Number },
  },
  {
    timestamps: true,
  }
);

/**
 * Represents the inventory item model used to interact with inventory data.
 *
 * This model is used to create, read, update, and delete inventory items
 * in MongoDB. It reuses an existing model instance if available to prevent
 * `OverwriteModelError` during development with hot reloading.
 */
export const InventoryItem =
  models.InventoryItem || model("InventoryItem", InventorySchema);