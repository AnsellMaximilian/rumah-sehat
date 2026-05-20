import { z } from "zod";
import { PRODUCT_FULFILLMENT_MODES } from "./product.types";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
}

function requiredWholeNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }

      return value;
    },
    z
      .coerce.number()
      .int(`${label} must be a whole number`)
      .min(0, `${label} must be 0 or more`),
  );
}

function booleanString(label: string) {
  return z
    .enum(["true", "false"], {
      error: () => ({ message: `${label} is required` }),
    })
    .transform((value) => value === "true");
}

const ProductBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name must be less than 255 characters"),
  productCode: nullableText(32, "Product code"),
  description: nullableText(1000, "Description"),
  supplierId: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
      }

      return value;
    },
    z.union([z.string().uuid("Supplier is invalid"), z.null()]),
  ),
  defaultUnit: nullableText(32, "Default unit"),
  cost: requiredWholeNumber("Cost"),
  price: requiredWholeNumber("Price"),
  defaultFulfillmentMode: z.enum(PRODUCT_FULFILLMENT_MODES, {
    error: () => ({ message: "Default fulfillment mode is required" }),
  }),
  trackStock: booleanString("Track stock"),
  active: booleanString("Active status"),
});

export const CreateProductSchema = ProductBaseSchema;

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductSortBySchema = z.enum([
  "createdAt",
  "productCode",
  "name",
  "defaultUnit",
  "cost",
  "price",
  "defaultFulfillmentMode",
]);
