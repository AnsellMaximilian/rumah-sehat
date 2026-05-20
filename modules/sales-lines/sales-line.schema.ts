import { z } from "zod";
import {
  SALES_LINE_SOURCE_MODES,
  SALES_LINE_STATUSES,
} from "./sales-line.types";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
}

function nullableUuid(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
      }

      return value;
    },
    z.union([z.string().uuid(`${label} is invalid`), z.null()]),
  );
}

function nullableWholeNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }

      return value;
    },
    z.union([
      z
        .coerce.number()
        .int(`${label} must be a whole number`)
        .min(0, `${label} must be 0 or more`),
      z.null(),
    ]),
  );
}

const SalesLineBaseObjectSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  productId: z.string().uuid("Product is required"),
  quantity: z
    .coerce.number()
    .positive("Quantity must be greater than 0"),
  unitSellPrice: nullableWholeNumber("Sell price"),
  sourceMode: z.enum(SALES_LINE_SOURCE_MODES, {
    error: () => ({ message: "Source mode is required" }),
  }),
  supplierId: nullableUuid("Supplier"),
  status: z.enum(SALES_LINE_STATUSES, {
    error: () => ({ message: "Status is required" }),
  }),
  notes: nullableText(1000, "Notes"),
});

const SalesLineBaseSchema = SalesLineBaseObjectSchema.superRefine((value, ctx) => {
    const needsSupplier =
      value.sourceMode === "supplier_direct" ||
      value.sourceMode === "supplier_prepacked";

    if (needsSupplier && !value.supplierId) {
      ctx.addIssue({
        code: "custom",
        path: ["supplierId"],
        message: "Supplier is required for this source mode",
      });
    }
  });

export const CreateSalesLineSchema = SalesLineBaseSchema;

export const UpdateSalesLineSchema = SalesLineBaseObjectSchema.partial();

export const SalesLineSortBySchema = z.enum([
  "createdAt",
  "customerName",
  "productName",
  "quantity",
  "unitSellPrice",
  "sourceMode",
  "status",
]);
