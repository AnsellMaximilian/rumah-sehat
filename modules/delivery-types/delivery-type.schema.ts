import { z } from "zod";
import { DELIVERY_CHARGE_TYPES } from "@/modules/delivery-charges/delivery-charge.types";

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

function booleanString(label: string) {
  return z
    .enum(["true", "false"], {
      error: () => ({ message: `${label} is required` }),
    })
    .transform((value) => value === "true");
}

const DeliveryTypeBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Delivery type name is required")
    .max(255, "Delivery type name must be less than 255 characters"),
  defaultChargeType: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
      }

      return value;
    },
    z.union([
      z.enum(DELIVERY_CHARGE_TYPES, {
        error: () => ({ message: "Default charge type is invalid" }),
      }),
      z.null(),
    ]),
  ),
  defaultBillToCustomer: booleanString("Default bill to customer"),
  defaultAccountId: nullableUuid("Default account"),
  requiresManualAmount: booleanString("Requires manual amount"),
  active: booleanString("Active status"),
  notes: nullableText(1000, "Notes"),
});

export const CreateDeliveryTypeSchema = DeliveryTypeBaseSchema;
export const UpdateDeliveryTypeSchema = CreateDeliveryTypeSchema.partial();

export const DeliveryTypeSortBySchema = z.enum([
  "name",
  "defaultChargeType",
  "active",
]);
