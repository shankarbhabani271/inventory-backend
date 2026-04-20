//import { ProductModel } from "../models/products.model.js";
import { NextFunction, Request, Response } from "express";
import { CreateVariantInput, VariantModel } from "$/models/variants.model.js";
import { CreateProductInput } from "$/models/products.model.js";

// CREATE PRODUCT
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      variants = [],
      prodDetails
    }: {
      variants: CreateVariantInput[],
      prodDetails: CreateProductInput
    } = req.body;

    // ✅ Create Product
    const product = await ProductModel.create({ ...prodDetails });

    // ✅ Prepare variants
    const preparedVariants = variants.map((item) => {
      const sku = `${prodDetails.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      return {
        ...item,
        sku,
        product: product._id
      };
    });

    // ✅ FIX: wait for all variants
    await Promise.all(
      preparedVariants.map((variant) => VariantModel.create(variant))
    );

    res.success({
      message: "Product created successfully",
      data: product
    });

  } catch (error) {
    next(error);
  }
};


// GET ALL PRODUCTS
export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await ProductModel.find().lean();

    const productIds = products.map(p => p._id);

    const variants = await VariantModel.find({
      product: { $in: productIds }
    }).lean();

    const result = products.map(product => ({
      product,
      variants: variants.filter(v => v.product.toString() === product._id.toString())
    }));

    res.success({
      message: "Products retrieved successfully",
      data: result
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET SINGLE PRODUCT
export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel
      .findById(req.params.id)
      .populate("variants")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// UPDATE PRODUCT
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // ✅ FIX: proper variant update
    if (req.body.variants) {
      await VariantModel.deleteMany({ product: req.params.id });

      const newVariants = req.body.variants.map((v: any) => ({
        ...v,
        product: req.params.id
      }));

      await VariantModel.insertMany(newVariants);
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE PRODUCT
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await VariantModel.deleteMany({ product: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};