import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct {
  ingredient: string;
  currentCost: number;
  unit: string;
  minOrder?: number;
  leadTime?: number; // in days
  costHistory: {
    cost: number;
    effectiveDate: Date;
  }[];
}

export interface ISupplier extends Document {
  name: string;
  contact: {
    phone?: string;
    email?: string;
    repName?: string;
  };
  products: IProduct[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  ingredient: { type: String, required: true },
  currentCost: { type: Number, required: true },
  unit: { type: String, required: true },
  minOrder: Number,
  leadTime: Number,
  costHistory: [{
    cost: Number,
    effectiveDate: { type: Date, default: Date.now }
  }]
});

const SupplierSchema: Schema = new Schema({
  name: { type: String, required: true },
  contact: {
    phone: String,
    email: String,
    repName: String
  },
  products: [ProductSchema]
}, {
  timestamps: true
});

export const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);