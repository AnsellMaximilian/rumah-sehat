import { z } from "zod";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
}

function booleanString(label: string) {
  return z
    .enum(["true", "false"], {
      error: () => ({ message: `${label} is required` }),
    })
    .transform((value) => value === "true");
}

const ProductCategoryBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(255, "Category name must be less than 255 characters"),
  description: nullableText(1000, "Description"),
  active: booleanString("Active status"),
});

export const CreateProductCategorySchema = ProductCategoryBaseSchema;

export const UpdateProductCategorySchema = CreateProductCategorySchema.partial();

export const ProductCategorySortBySchema = z.enum([
  "createdAt",
  "name",
]);
