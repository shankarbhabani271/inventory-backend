import mongoose, { HydratedDocument, InferSchemaType, Schema } from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    attributes: [
      {
        key:String,
        value:String,
      }
    ],

    attributesKey: {
      type: String,
      required: true
    },

    sku: {
      type: String,
      required: true,
      unique: true
    },

    price: {
      salePrice: {
        type: Number,
        required: true
      },
      mrp: {
        type: Number,
        required: true
      }
    },
  },
  { timestamps: true }
);

export const VariantModel = mongoose.model("Variant", variantSchema);

export type TVariant = InferSchemaType<typeof variantSchema> & {
  _id: Schema.Types.ObjectId;
}


export type CreateVariantInput = Omit<TVariant, "_id">;
export type VariantDocument = HydratedDocument<TVariant>;