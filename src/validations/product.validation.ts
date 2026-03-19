import { z } from "zod";
import { CreateZodSchema } from "$/middlewares/createzodschema.js";
// variants,
//       prodDetails
export const createProductSchema = CreateZodSchema(
    {
        body: z.object({
            prodDetails: z.object({
                name: z
                    .string({ message: "Name is required" })
                    .min(3, "Name must be at least 3 characters long")
                    .nonempty("Name is required"),
                description: z
                    .string({ message: "Description is required" })
                    .min(30, "Description must be at least 30 characters long")
                    .nonempty("Description is required"),
                brand: z
                    .string({ message: "Brand is required" })
                    .min(3, "Brand must be at least 3 characters long")
                    .nonempty("Brand is required"),
                category: z
                    .string({ message: "Category is required" })
                    .nonempty("Category is required")
            }),
            variants: z.array(
                z.object({
                    
                    attribute: z
                    .string({ message: "Attribute is required" })
                    .nonempty("Attribute is required"),

                    attributeKey: z
                    .string({ message: "Attribute Key is required" })
                    .nonempty("Attribute Key is required"),

                    price:z.object({
                        salePrice: z
                        .number({ message: "Sale Price is required" })
                        .positive("Sale Price must be a positive number"),

                        mrp: z
                        .number({ message: "MRP is required" })
                        .positive("MRP must be a positive number")
                    }),

                    

                
                })
            )
        })

    }
)