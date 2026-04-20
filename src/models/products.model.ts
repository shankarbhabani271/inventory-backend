import mongoose from "mongoose";

const productsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    optionalName: String,
    details: String,
    category: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    stock:{
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: Number,
    size: String,
    color: String,
    description: String,

    // ✅ ADD THIS
    image: {
      url: String,
      filename: String,
    },

  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Products", productsSchema);