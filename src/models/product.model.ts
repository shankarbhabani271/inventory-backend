import mongoose, { HydratedDocument, InferSchemaType, Schema } from "mongoose";

const productSchema = new Schema(
  {
    
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    variants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant"
    }
  ],
    
    // image:
    // {
    //   url: String,
    //   publicId: String,
    // },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = mongoose.model("Product", productSchema);

export type TProduct = InferSchemaType<typeof productSchema> & {
  _id: Schema.Types.ObjectId;
}


export type CreateProductInput = Omit<TProduct, "_id">;
export type ProductDocument = HydratedDocument<TProduct>;