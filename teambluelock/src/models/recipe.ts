import mongoose, { Schema, Document, Model } from 'mongoose';

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

export interface IRecipe extends Document {
  userId: string;   
  name: string;
  description?: string;
  category?: string;
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

const RecipeSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,         
  },
  name: { type: String, required: true },
  description: String,
  category: String,
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

// Check if model already exists to prevent OverwriteModelError
export const Recipe: Model<IRecipe> =
  mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
