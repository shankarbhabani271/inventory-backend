import { Router } from "express";
import { createCategory, getAllCategory, getSinglecategory, updateCategory, deleteCategory } from "$/controller/category.controller.js";
import { validateRequest } from "$/middlewares/validate.middleware.js";
import { createCategorySchema } from "$/validations/category.validation.js";



const categoryRoutes = Router();

categoryRoutes.post("/categories", validateRequest(createCategorySchema), createCategory);
categoryRoutes.get("/categories", getAllCategory);
categoryRoutes.get("/categories/:id", getSinglecategory);
categoryRoutes.put("/categories/:id",validateRequest(createCategorySchema), updateCategory);
categoryRoutes.delete("/categories/:id", deleteCategory);

export default categoryRoutes;
