import { z } from "zod";
import {
  SUPPLIER_PURCHASE_DESTINATION_TYPES,
  SUPPLIER_PURCHASE_STATUSES,
} from "./supplier-purchase.types";

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

const SupplierPurchaseItemSchema = z
  .object({
    productId: z.string().uuid("Product is required"),
    quantity: z
      .coerce.number()
      .positive("Quantity must be greater than 0"),
    unitCost: nullableWholeNumber("Unit cost"),
    destinationType: z.enum(SUPPLIER_PURCHASE_DESTINATION_TYPES, {
      error: () => ({ message: "Destination type is required" }),
    }),
    customerId: nullableUuid("Customer"),
    notes: nullableText(500, "Item notes"),
  })
  .superRefine((value, ctx) => {
    const needsCustomer =
      value.destinationType === "customer_direct" ||
      value.destinationType === "customer_prepacked";

    if (needsCustomer && !value.customerId) {
      ctx.addIssue({
        code: "custom",
        path: ["customerId"],
        message: "Customer is required for this destination",
      });
    }
  });

const SupplierPurchaseBaseSchema = z.object({
  supplierId: z.string().uuid("Supplier is required"),
  purchaseDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Purchase date is required"),
  referenceNumber: nullableText(64, "Reference number"),
  status: z.enum(SUPPLIER_PURCHASE_STATUSES, {
    error: () => ({ message: "Status is required" }),
  }),
  notes: nullableText(1000, "Notes"),
  items: z
    .array(SupplierPurchaseItemSchema)
    .min(1, "At least one purchase item is required"),
});

export const CreateSupplierPurchaseSchema = SupplierPurchaseBaseSchema;

export const UpdateSupplierPurchaseSchema = CreateSupplierPurchaseSchema.partial();

export const SupplierPurchaseSortBySchema = z.enum([
  "createdAt",
  "purchaseDate",
  "referenceNumber",
  "status",
]);
