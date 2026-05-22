import { z } from "zod";
import { STOCK_MOVEMENT_TYPES } from "./stock-movement.types";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
}

function requiredNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }

      return value;
    },
    z.coerce.number({ error: () => ({ message: `${label} is required` }) }),
  );
}

export const CreateStockMovementSchema = z
  .object({
    productId: z.string().uuid("Product is required"),
    quantityDelta: requiredNumber("Quantity delta"),
    movementType: z.enum(STOCK_MOVEMENT_TYPES, {
      error: () => ({ message: "Movement type is required" }),
    }),
    occurredAt: z.preprocess(
      (value) => {
        if (typeof value === "string") {
          return new Date(value);
        }

        return value;
      },
      z
        .date()
        .refine((value) => !Number.isNaN(value.getTime()), "Occurred at is invalid"),
    ),
    notes: nullableText(1000, "Notes"),
  })
  .superRefine((value, ctx) => {
    if (value.quantityDelta === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "Quantity delta must not be 0",
      });
    }

    if (
      ["damage", "personal_draw", "return_to_supplier"].includes(value.movementType) &&
      value.quantityDelta > 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "This movement type must reduce stock, so use a negative quantity",
      });
    }

    if (
      ["opening_balance", "return_in", "found_stock"].includes(value.movementType) &&
      value.quantityDelta < 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "This movement type must add stock, so use a positive quantity",
      });
    }
  });
