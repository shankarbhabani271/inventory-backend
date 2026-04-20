// controllers/product.controller.js
const Product = require("../models/product.model");
const validateProduct = require("../validators/product.validator");

// ➤ GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// ➤ CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { errors, isValid } = validateProduct(req.body);

    if (!isValid) return res.status(400).json(errors);

    const product = new Product(req.body);
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// ➤ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { errors, isValid } = validateProduct(req.body);

    if (!isValid) return res.status(400).json(errors);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// ➤ DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json(err.message);
  }
};