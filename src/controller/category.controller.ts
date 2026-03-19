import { CategoryModel } from "$/models/category.model.js";
import { NextFunction, Request, Response } from "express";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryModel.create(req.body);

    res.success({
      message: "Category created successfully",
      data: category
    });

  } catch (error) {
    next(error);
  }
};

// GET ALL PRODUCTS
export const getAllCategory = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryModel.find().populate("category");

    res.success({
      message: "category retrieved successfully",
      data: category
    });

  } catch (error) {
    next(error);
  }
};

// GET SINGLE CATEGORY
export const getSinglecategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await CategoryModel.findById(req.params.id).populate("category");

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

// UPDATE CATEGORY
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!category) {
      return res.success({
        message: "Category not found"
      });
    }

    return res.success({

      message: "Category updated successfully",
      data: category
    });

  } catch (error) {
    next(error);
  }
};
// DELETE CATEGORY
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryModel.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.success({
        message: "Category not found"
      });
    }

    return res.success({
      message: "Category deleted successfully",
      data: category
    });

  } catch (error) {
    next(error);
  }
};
