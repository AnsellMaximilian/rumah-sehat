import { z } from "zod";

const BaseAuthSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  rememberMe: z.boolean().optional(),
  callbackURL: z.string().optional(),
});

export const SignInSchema = BaseAuthSchema;

export const SignUpSchema = BaseAuthSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
