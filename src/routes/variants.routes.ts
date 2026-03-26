import { Router } from "express";
import { createVariant, getAllVariant, getSingleVariant, updateVariant, deleteVariant } from "$/controller/variants.controller.js";
import { validateRequest } from "$/middlewares/validate.middleware.js";
import { createVariantSchema } from "$/validations/variants.validation.js";

const variantsRoutes = Router();

variantsRoutes.post("/variants", validateRequest(createVariantSchema), createVariant);
variantsRoutes.get("/variants", getAllVariant);
variantsRoutes.get("/variants/:id", getSingleVariant);
variantsRoutes.put("/variants/:id", updateVariant);
variantsRoutes.delete("/variants/:id", deleteVariant);


export default variantsRoutes;