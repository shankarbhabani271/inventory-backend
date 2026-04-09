import { VariantModel } from "$/models/variants.model.js";
import { NextFunction, Request, Response } from "express";

export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await VariantModel.create(req.body);

    res.success({
      message: "Variant created successfully",
      data: variant
    });

  } catch (error) {
    next(error);
  }
};

// GET ALL VARIANTS
export const getAllVariant = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await VariantModel.find().populate("Product");

    res.success({
      message: "variant retrieved successfully",
      data: variant
    });

  } catch (error) {
    next(error);
  }
};

// GET SINGLE VARIANT
export const getSingleVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await VariantModel.findById(req.params.id).populate("variant");

    if (!product) {
      return res.success({
        message: "Product not found"
      });
    }

    return res.success({
      message: "Product retrieved successfully",
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// UPDATE VARIANT
export const updateVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await VariantModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!variant) {
      return res.success({
        message: "Variant not found"
      });
    }

    return res.success({

      message: "Variant updated successfully",
      data: variant
    });

  } catch (error) {
    next(error);
  }
};
// DELETE VARIANT
export const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await VariantModel.findByIdAndDelete(req.params.id);

    if (!variant) {
      return res.success({
        message: "Variant not found"
      });
    }

    return res.success({
      message: "Variant deleted successfully",
      data: variant
    });

  } catch (error) {
    next(error);
  }
};