import { z } from "zod";
import { DELIVERY_STATUSES } from "./delivery.types";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
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

const DeliveryItemSchema = z.object({
  salesLineId: z.string().uuid("Sales line is required"),
  notes: nullableText(500, "Item notes"),
});

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
  status: z.enum(DELIVERY_STATUSES, {
    error: () => ({ message: "Status is required" }),
  }),
  notes: nullableText(1000, "Notes"),
  items: z
    .array(DeliveryItemSchema)
    .min(1, "At least one delivery item is required")
    .refine(
      (items) => new Set(items.map((item) => item.salesLineId)).size === items.length,
      "Each sales line can only appear once in a delivery",
    ),
});

export const CreateDeliverySchema = DeliveryBaseSchema;

export const UpdateDeliverySchema = z.object({
  customerId: DeliveryBaseSchema.shape.customerId.optional(),
  deliveredAt: DeliveryBaseSchema.shape.deliveredAt.optional(),
  recordedAt: DeliveryBaseSchema.shape.recordedAt.optional(),
  deliveredBy: DeliveryBaseSchema.shape.deliveredBy.optional(),
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
