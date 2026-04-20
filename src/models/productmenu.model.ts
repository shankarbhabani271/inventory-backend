import mongoose, { Schema, Document } from "mongoose";

export interface IProductMenu extends Document {
  name: string;
  optionalName?: string;
  details: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  discount: number;
  sizes: string[];
  colors: string[];
  image?: string;
  description?: string;
}

const productMenuSchema = new Schema<IProductMenu>(
  {
    name: { type: String, required: true },
    optionalName: { type: String },
    details: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    stock:{
      type: Number,
      default: 0,
    },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    image: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const ProductMenu = mongoose.model<IProductMenu>(
  "ProductMenu",
  productMenuSchema
);