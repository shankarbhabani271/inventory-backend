import { Router } from "express";
import {
  createProductMenu,
  getAllProductMenu,
  getSingleProductMenu,
  updateProductMenu,
  deleteProductMenu,
} from "../controller/productmenu.controller.js";

const router = Router();

router.post("/", createProductMenu);
router.get("/", getAllProductMenu);
router.get("/:id", getSingleProductMenu);
router.put("/:id", updateProductMenu);
router.delete("/:id", deleteProductMenu);

export default router;