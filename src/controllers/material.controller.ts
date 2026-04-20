import Material from "../models/material.model.js";

// ======================
// CREATE MATERIAL
// ======================
export const createMaterial = async (req, res) => {
  try {
    const {
      referenceId,
      date,
      requester,
      department,
      productDetails,
      quantity,
      priority,
    } = req.body;

    // ✅ validation
    if (!referenceId || !date || !requester || !department || !productDetails || !quantity) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid number",
      });
    }

    // ✅ duplicate check
    const existing = await Material.findOne({ referenceId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Reference ID already exists",
      });
    }

    // ✅ create
    const material = new Material({
      referenceId,
      date,
      requester,
      department,
      productDetails,
      quantity: qty,
      priority: priority || "Medium",
      status: "Pending",
    });

    const saved = await material.save();

    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      data: saved,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET ALL MATERIALS
// ======================
export const getMaterials = async (req, res) => {
  try {
    const { status, search } = req.query;

    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { referenceId: { $regex: search, $options: "i" } },
        { requester: { $regex: search, $options: "i" } },
      ];
    }

    const materials = await Material.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET SINGLE MATERIAL
// ======================
// ✅ APPROVE
export const approveMaterial = async (req, res) => {
  try {
    const updated = await Material.findByIdAndUpdate(
      req.params.id,
      { status: "Approved" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Material Approved",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ REJECT
export const rejectMaterial = async (req, res) => {
  try {
    const updated = await Material.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Material Rejected",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};