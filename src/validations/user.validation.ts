// import { USER_ROLE } from "$/constants/user.constant.js";
import { CreateZodSchema } from "$/functions/CreateZodSchema.js";
import { z } from "zod";

export const signUpSchema = CreateZodSchema({
  body: z.object({
    name: z
      .string({ message: "Name is required" })
      .min(3, "Name must be at least 3 characters long")
      .nonempty("Name is required"),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters long.")
      .refine((password) => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter.",
      })
      .refine((password) => /[a-z]/.test(password), {
        message: "Password must contain at least one lowercase letter.",
      })
      .refine((password) => /\d/.test(password), {
        message: "Password must contain at least one number.",
      }),
    // role: z
    //   .enum(USER_ROLE, {
    //     message: `role must be ${Object.keys(USER_ROLE).join(", ")}`,
    //   })
    //   ?.optional(),
    email: z
      .string({ message: "Email is required" })
      .email({ message: "Invalid email format" }),
    phone: z
      .number({ message: "Phone number must be a number" })
      .positive("Phone number must be a positive number")
      .min(1000000000, "Phone number must be exactly 10 digits")
      .max(9999999999, "Phone number must be exactly 10 digits"),
  }),
});

export const signInSchema = CreateZodSchema({
  body: z.object({
    email: z.string({ message: "Email is required" }).email(),
    password: z.string({ message: "Password is required" }),
  }),
});
export const forgotSchema = CreateZodSchema({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email({ message: "Invalid email format" }),
    password: z.string({ message: "Password is required" }),
    otp: z
      .number({ message: "OTP Must be a number" })
      .min(6, "OTP must be 6 digits"),
  }),
});
export const otpSchema = CreateZodSchema({
  body: z.object({
    email: z.string({ message: "Email is required" }).email(),
  }),
});

export const updateProfileSchema = CreateZodSchema({
  body: z.object({
    name: z
      .string({ message: "Name is required" })
      .min(3, "Name must be at least 3 characters long")
      .optional(),
    phone: z
      .number({ message: "Phone number must be a number" })
      .positive("Phone number must be a positive number")
      .min(1000000000, "Phone number must be exactly 10 digits")
      .max(9999999999, "Phone number must be exactly 10 digits")
      .optional(),
  }),
});