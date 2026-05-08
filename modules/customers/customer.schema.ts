
import { z } from "zod";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
}

const CustomerBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(255, "First name must be less than 255 characters"),
  customerCode: z
    .string()
    .trim()
    .min(1, "Customer code is required")
    .max(32, "Customer code must be less than 33 characters"),
    address: nullableText(500, "Address"),
  notes: nullableText(500, "Notes"),
});

export const CreateCustomerSchema = CustomerBaseSchema

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerSortBySchema = z.enum([
  "createdAt",
  "customerCode",
  "name",
  "address",
]);