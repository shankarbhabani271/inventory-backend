import { CreateZodSchema } from "$/middlewares/createzodschema.js";
import { z } from "zod";

export const createCategorySchema = CreateZodSchema(
    {
    body: z.object({
        name: z
            .string({ message: "Name is required" })
            .min(3, "Name must be at least 3 characters long")
            .nonempty("Name is required"),
        description: z
            .string({ message: "Description is required" })
            .min(30, "Description must be at least 30 characters long")
            .nonempty("Description is required"),
    })
});
