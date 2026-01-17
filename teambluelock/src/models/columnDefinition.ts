import { Schema, model, models } from "mongoose";

const ColumnDefinitionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    key: { type: String, required: true },   // matches customFields key
    label: { type: String, required: true }, // UI label
    type: {
      type: String,
      enum: ["text", "number", "boolean", "date"],
      default: "text",
    },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ColumnDefinitionSchema.index({ userId: 1, key: 1 }, { unique: true });

export const ColumnDefinition =
  models.ColumnDefinition ||
  model("ColumnDefinition", ColumnDefinitionSchema);
