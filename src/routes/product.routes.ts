import { Router } from "express";
import { createProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct } from "$/controller/product.controller.js";
import { validateRequest } from "$/middlewares/validate.middleware.js";
import { createProductSchema } from "$/validations/product.validation.js";



const productRoutes = Router();

productRoutes.post("/", validateRequest(createProductSchema), createProduct);
productRoutes.get("/", getAllProducts);
productRoutes.get("/:id", getSingleProduct);
productRoutes.put("/:id", updateProduct);
productRoutes.delete("/:id", deleteProduct);



export default productRoutes;

