import { z } from "zod";
import { ACCOUNT_ENTRY_TYPES, ACCOUNT_TYPES } from "./account.types";

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

const AccountBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(255, "Account name must be less than 255 characters"),
  type: z.enum(ACCOUNT_TYPES, {
    error: () => ({ message: "Account type is required" }),
  }),
  ownerType: nullableText(32, "Owner type"),
  ownerId: nullableUuid("Owner"),
  active: booleanString("Active status"),
  notes: nullableText(1000, "Notes"),
});

const AccountEntryBaseSchema = z.object({
  accountId: z.string().uuid("Account is required"),
  amountDelta: requiredWholeNumber("Amount"),
  entryType: z.enum(ACCOUNT_ENTRY_TYPES, {
    error: () => ({ message: "Entry type is required" }),
  }),
  sourceType: nullableText(64, "Source type"),
  sourceId: nullableUuid("Source"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(255, "Description must be less than 255 characters"),
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
});

export const CreateAccountSchema = AccountBaseSchema;
export const UpdateAccountSchema = CreateAccountSchema.partial();
export const CreateAccountEntrySchema = AccountEntryBaseSchema;

export const AccountSortBySchema = z.enum([
  "createdAt",
  "name",
  "type",
  "currentBalance",
]);

export const AccountEntrySortBySchema = z.enum([
  "occurredAt",
  "createdAt",
  "amountDelta",
]);
