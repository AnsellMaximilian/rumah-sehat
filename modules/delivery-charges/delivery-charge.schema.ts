import { z } from "zod";
import { DELIVERY_CHARGE_TYPES } from "./delivery-charge.types";

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
    z.coerce.number().int(`${label} must be a whole number`),
  );
}

function booleanString(label: string) {
  return z
    .enum(["true", "false"], {
      error: () => ({ message: `${label} is required` }),
    })
    .transform((value) => value === "true");
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

const DeliveryChargeBaseObjectSchema = z.object({
  deliveryId: z.string().uuid("Delivery is required"),
  chargeType: z.enum(DELIVERY_CHARGE_TYPES, {
    error: () => ({ message: "Charge type is required" }),
  }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(255, "Description must be less than 255 characters"),
  amount: requiredWholeNumber("Amount"),
  billToCustomer: booleanString("Bill to customer"),
  accountId: nullableUuid("Account"),
  notes: nullableText(1000, "Notes"),
});

export const CreateDeliveryChargeSchema =
  DeliveryChargeBaseObjectSchema.superRefine((value, ctx) => {
    if (value.amount === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount must not be 0",
      });
    }

    if (value.amount < 0 && value.chargeType !== "adjustment") {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Only adjustment charges can use a negative amount",
      });
    }
  });

export const UpdateDeliveryChargeSchema = z.object({
  deliveryId: DeliveryChargeBaseObjectSchema.shape.deliveryId.optional(),
  chargeType: DeliveryChargeBaseObjectSchema.shape.chargeType.optional(),
  description: DeliveryChargeBaseObjectSchema.shape.description.optional(),
  amount: DeliveryChargeBaseObjectSchema.shape.amount.optional(),
  billToCustomer: DeliveryChargeBaseObjectSchema.shape.billToCustomer.optional(),
  accountId: DeliveryChargeBaseObjectSchema.shape.accountId.optional(),
  notes: DeliveryChargeBaseObjectSchema.shape.notes.optional(),
});

export const DeliveryChargeSortBySchema = z.enum([
  "createdAt",
  "deliveryRecordedAt",
  "customerName",
  "chargeType",
  "amount",
]);
