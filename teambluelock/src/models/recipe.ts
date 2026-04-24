import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Defines the structure of a single ingredient used in a recipe.
 *
 * This interface represents each ingredient entry stored inside a recipe,
 * including its name, quantity, unit, optional supplier reference, and
 * optional history of past ingredient costs.
 */

export interface IIngredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  supplierId?: mongoose.Types.ObjectId;
  costHistory?: {
    cost: number;
    date: Date;
    supplier: string;
  }[];
}

/**
 * Defines the structure of a recipe document stored in the database.
 *
 * This interface represents a recipe created by a user, including general
 * recipe details such as name, description, category, yield, ingredients,
 * preparation instructions, and pricing information used for cost and
 * profit analysis.
 */

export interface IRecipe extends Document {
  userId: string;   
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  yield?: {
    amount: number;
    unit: string;
  };
  ingredients: IIngredient[];
  instructions: string[];
  totalCost: number;
  menuPrice?: number;
  grossMargin?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines the schema for ingredient entries embedded within a recipe.
 *
 * This schema stores ingredient-specific data such as name, quantity, unit,
 * optional supplier reference, and optional cost history records. It is used
 * as a nested schema inside the main recipe schema.
 */

const IngredientSchema: Schema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  cost: { type: Number, required: false },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  costHistory: [{
    cost: Number,
    date: { type: Date, default: Date.now },
    supplier: String
  }]
});

/**
 * Defines the schema for recipe documents.
 *
 * This schema stores all recipe-related data for a user, including recipe
 * metadata, ingredient lists, instructions, and pricing values. It also
 * enables automatic timestamping so that each recipe includes `createdAt`
 * and `updatedAt` fields.
 */

const RecipeSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,         
  },
  name: { type: String, required: true },
  description: String,
  category: String,
  subCategory: String,
  yield: {
    amount: Number,
    unit: String
  },
  ingredients: [IngredientSchema],
  instructions: [String],
  totalCost: { type: Number, required: true },
  menuPrice: Number,
  grossMargin: Number
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

/**
 * Represents the recipe model used to create, query, update, and delete
 * recipe documents in MongoDB.
 *
 * This export reuses the existing model if it has already been compiled,
 * which prevents `OverwriteModelError` during hot reloads in development.
 */

export const Recipe: Model<IRecipe> =
  mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
