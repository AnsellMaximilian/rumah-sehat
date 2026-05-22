import { z } from "zod";
import { DELIVERY_DIRECT_SOURCE_MODES, DELIVERY_STATUSES } from "./delivery.types";

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

function nullableDateTime(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized ? new Date(normalized) : null;
      }

      return value;
    },
    z.union([z.date(), z.null()]).refine(
      (value) => value === null || !Number.isNaN(value.getTime()),
      `${label} is invalid`,
    ),
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
      z.coerce.number().int(`${label} must be a whole number`),
      z.null(),
    ]),
  );
}

const ExistingDeliveryItemSchema = z.object({
  itemMode: z.literal("existing"),
  salesLineId: z.string().uuid("Sales line is required"),
  productId: z.string().optional(),
  quantity: z.string().optional(),
  unitSellPrice: z.string().optional(),
  sourceMode: z.string().optional(),
  notes: nullableText(500, "Item notes"),
});

const DirectDeliveryItemSchema = z.object({
  itemMode: z.literal("direct"),
  salesLineId: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
      }

      return value;
    },
    z.union([z.string().uuid("Sales line is invalid"), z.null()]),
  ),
  productId: z.string().uuid("Product is required"),
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
  quantity: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }

      return value;
    },
    z.coerce.number().positive("Quantity must be greater than 0"),
  ),
  unitSellPrice: nullableWholeNumber("Sell price"),
  sourceMode: z.enum(DELIVERY_DIRECT_SOURCE_MODES, {
    error: () => ({ message: "Source mode is required" }),
  }),
  notes: nullableText(500, "Item notes"),
}).superRefine((value, ctx) => {
  if (
    (value.sourceMode === "supplier_direct" ||
      value.sourceMode === "supplier_prepacked") &&
    !value.supplierId
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["supplierId"],
      message: "Supplier is required for supplier delivery items",
    });
  }
});

const DeliveryItemSchema = z.discriminatedUnion("itemMode", [
  ExistingDeliveryItemSchema,
  DirectDeliveryItemSchema,
]);

const DeliveryBaseSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  deliveredAt: nullableDateTime("Delivered at"),
  recordedAt: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        return new Date(value);
      }

      return value;
    },
    z
      .date()
      .refine((value) => !Number.isNaN(value.getTime()), "Recorded at is invalid"),
  ),
  deliveredBy: nullableText(255, "Delivered by"),
  deliveryTypeId: nullableUuid("Delivery type"),
  status: z.enum(DELIVERY_STATUSES, {
    error: () => ({ message: "Status is required" }),
  }),
  notes: nullableText(1000, "Notes"),
  items: z
    .array(DeliveryItemSchema)
    .min(1, "At least one delivery item is required")
    .refine(
      (items) =>
        new Set(
          items
            .filter((item) => item.itemMode === "existing")
            .map((item) => item.salesLineId),
        ).size === items.filter((item) => item.itemMode === "existing").length,
      "Each sales line can only appear once in a delivery",
    ),
});

export const CreateDeliverySchema = DeliveryBaseSchema;

export const UpdateDeliverySchema = z.object({
  customerId: DeliveryBaseSchema.shape.customerId.optional(),
  deliveredAt: DeliveryBaseSchema.shape.deliveredAt.optional(),
  recordedAt: DeliveryBaseSchema.shape.recordedAt.optional(),
  deliveredBy: DeliveryBaseSchema.shape.deliveredBy.optional(),
  deliveryTypeId: DeliveryBaseSchema.shape.deliveryTypeId.optional(),
  status: DeliveryBaseSchema.shape.status.optional(),
  notes: DeliveryBaseSchema.shape.notes.optional(),
  items: z.array(DeliveryItemSchema).optional(),
});

export const DeliverySortBySchema = z.enum([
  "createdAt",
  "recordedAt",
  "deliveredAt",
  "customerName",
  "status",
]);
