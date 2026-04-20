import { Request, Response } from "express";
import { ProductMenu } from "../models/productmenu.model.js";

// CREATE
export const createProductMenu = async (req: Request, res: Response) => {
  try {
    const product = await ProductMenu.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Create failed", error: err });
  }
};

// GET ALL
export const getAllProductMenu = async (req: Request, res: Response) => {
  try {
    const products = await ProductMenu.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// GET ONE
export const getSingleProductMenu = async (req: Request, res: Response) => {
  try {
    const product = await ProductMenu.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// UPDATE
export const updateProductMenu = async (req: Request, res: Response) => {
  try {
    const product = await ProductMenu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE
export const deleteProductMenu = async (req: Request, res: Response) => {
  try {
    await ProductMenu.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};