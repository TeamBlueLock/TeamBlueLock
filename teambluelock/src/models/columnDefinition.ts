import { Schema, model, models } from "mongoose";

/**
 * Defines the schema for user-specific column configurations.
 *
 * This schema represents customizable columns that users can create
 * for inventory items. Each column definition controls how additional
 * fields appear in the user interface, including their label, data type,
 * visibility, and display order.
 *
 * The `key` field corresponds directly to keys stored in the
 * `customFields` object of inventory items.
 */
const ColumnDefinitionSchema = new Schema(
  {
    /**
     * Unique identifier for the user who owns this column configuration.
     */
    userId: { type: String, required: true, index: true },

    /**
     * Unique key used to identify the column.
     * This must match the corresponding key in inventory `customFields`.
     */
    key: { type: String, required: true },

    /**
     * Display label shown in the UI for this column.
     */
    label: { type: String, required: true },

    /**
     * Data type of the column, used to control rendering and validation.
     */
    type: {
      type: String,
      enum: ["text", "number", "boolean", "date"],
      default: "text",
    },

    /**
     * Determines whether the column is visible in the UI.
     */
    visible: { type: Boolean, default: true },

    /**
     * Defines the display order of the column in the UI.
     */
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * Ensures that each user cannot have duplicate column keys.
 *
 * This creates a compound unique index on (userId, key),
 * preventing duplicate custom columns for the same user.
 */
ColumnDefinitionSchema.index({ userId: 1, key: 1 }, { unique: true });

/**
 * Represents the column definition model used to manage
 * user-defined columns in the database.
 *
 * This model is used to create, retrieve, update, and delete
 * column definitions. It reuses an existing model instance
 * if available to prevent `OverwriteModelError` during development.
 */
export const ColumnDefinition =
  models.ColumnDefinition ||
  model("ColumnDefinition", ColumnDefinitionSchema);
