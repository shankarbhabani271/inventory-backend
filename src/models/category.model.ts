import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
        trim: true,
    },
    slug:{
        type: String,
        required: true,
        lowercase: true
    },
  },
  {
    timestamps: true,
  }
);

export const CategoryModel = mongoose.model("Category", categorySchema);