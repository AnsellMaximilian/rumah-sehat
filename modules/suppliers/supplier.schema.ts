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

const SupplierBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Supplier name is required")
    .max(255, "Supplier name must be less than 255 characters"),
  supplierCode: nullableText(32, "Supplier code"),
  contactInfo: nullableText(1000, "Contact info"),
  bankName: nullableText(255, "Bank name"),
  bankAccountName: nullableText(255, "Bank account name"),
  bankAccountNumber: nullableText(64, "Bank account number"),
  notes: nullableText(1000, "Notes"),
  active: booleanString("Active status"),
});

export const CreateSupplierSchema = SupplierBaseSchema;

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export const SupplierSortBySchema = z.enum([
  "createdAt",
  "supplierCode",
  "name",
  "bankName",
]);
