import { ProductModel } from "../models/product.model.js";
import { NextFunction, Request, Response } from "express";

import { CreateVariantInput, VariantModel } from "$/models/variants.model.js";
import { CreateProductInput } from "$/models/product.model.js";

// CREATE PRODUCT variant creation is handled by the pre hook in the product model
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const {
      variants,
      prodDetails
    }: {
      variants: CreateVariantInput[],
      prodDetails: CreateProductInput
    } = req.body


    const product = await ProductModel.create({ ...prodDetails });
    const rex = variants.map((item) => {
      const sku = `${prodDetails.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      return {
        ...item,
        sku
      }
    })

    rex.forEach(async (variant) => {
      await VariantModel.create({
        ...variant,
        product: product._id
      });

    });

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

    const products = await ProductModel.find();

    const PopulatedProd = await Promise.all(
      products.map(async (product) => {
        const variants = await VariantModel.find({ product: product._id });

        return {
          product,
          variants
        };
      })
    );

    res.success({
      message: "Products retrieved successfully",
      data: PopulatedProd
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE PRODUCT variant retrieval is handled by the pre hook in the product model
export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate("category").populate("variants");

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

// UPDATE PRODUCT variant update is handled by the pre hook in the product model
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true });


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    if (req.body.variants) {
      await VariantModel.updateMany(
        { product: req.params.id },
        { $set: req.body.variants }
      );
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

// DELETE PRODUCT variant deletion is handled by the pre hook in the product model
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    if (req.params.id) {
      await VariantModel.deleteMany({ product: req.params.id });
    }

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


