import { CreateZodSchema } from "$/middlewares/createzodschema.js";
import { z } from "zod";


export const createVariantSchema = CreateZodSchema(
    {
        body: z.object({
            product: z
                .string({ message: "Product ID is required" })
                .nonempty("Product ID is required"),
            attribute: z
                .record(z.string(), z.any())
                .refine((record) => Object.keys(record).length > 0, {
                    message: "At least one attribute is required",
                }),
            attributekey: z
                .string({ message: "Attribute Key is required" })
                .nonempty("Attribute Key is required"),
            price: z.object({
                salePrice: z
                    .number({ message: "Price must be a number" })
                    .positive("Price must be a positive number"),
                mrp: z
                    .string({ message: "SKU is required" })
                    .nonempty("SKU is required")
            }),
        })
    }
)