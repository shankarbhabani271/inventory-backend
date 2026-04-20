import Vendor from "../models/vendor.model.js";

// CREATE
export const createVendor = async (req, res) => {
  try {
    const { name, phone, secondphone, email, primaryaddress } = req.body;

    const existingVendor = await Vendor.findOne({ email });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor already exists with this email",
      });
    }

    const vendor = await Vendor.create({
      name,
      phone,
      secondphone,
      email,
      primaryaddress,
    });

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });

  } catch (error) {
    console.log("CREATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Error creating vendor",
      error: error.message,
    });
  }
};

// GET
export const getVendor = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });

    res.status(200).json(vendors);
  } catch (error) {
    console.log("GET ERROR:", error);

    res.status(500).json({
      message: "Error fetching vendors",
    });
  }
};