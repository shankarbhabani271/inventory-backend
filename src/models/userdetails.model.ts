import mongoose from "mongoose";

const userDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String, // fixed typo (tyep → type)
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    company: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true } // moved outside properly
);

export default mongoose.model("UserDetails",userDetailsSchema);