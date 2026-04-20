import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    requester: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
    },
    productDetails: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Low",
    },

    // ✅ ONLY THIS STATUS (FINAL)
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);