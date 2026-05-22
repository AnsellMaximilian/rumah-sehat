import { z } from "zod";
import {
  INVOICE_ITEM_LINE_TYPES,
  INVOICE_STATUSES,
  INVOICE_SYNC_STATUSES,
} from "./invoice.types";

function nullableText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((value) => value || null);
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

function dateString(label: string) {
  return z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} is invalid`);
}

const InvoiceGenerateBaseObjectSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  periodStart: dateString("Period start"),
  periodEnd: dateString("Period end"),
  invoiceDate: dateString("Invoice date"),
  invoiceNumber: nullableText(64, "Invoice number"),
  notes: nullableText(1000, "Notes"),
});

export const CreateInvoiceSchema =
  InvoiceGenerateBaseObjectSchema.superRefine((value, ctx) => {
    if (value.periodEnd < value.periodStart) {
      ctx.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "Period end must be on or after period start",
      });
    }
  });

const InvoiceUpdateBaseObjectSchema = z.object({
  invoiceNumber: nullableText(64, "Invoice number"),
  invoiceDate: dateString("Invoice date"),
  status: z.enum(INVOICE_STATUSES, {
    error: () => ({ message: "Status is required" }),
  }),
  syncStatus: z.enum(INVOICE_SYNC_STATUSES, {
    error: () => ({ message: "Sync status is required" }),
  }),
  notes: nullableText(1000, "Notes"),
});

export const UpdateInvoiceSchema = InvoiceUpdateBaseObjectSchema;

export const InvoiceSortBySchema = z.enum([
  "createdAt",
  "invoiceDate",
  "invoiceNumber",
  "customerName",
  "status",
  "syncStatus",
]);


const ManualInvoiceItemBaseSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required"),
  lineType: z.enum(INVOICE_ITEM_LINE_TYPES, {
    error: () => ({ message: "Line type is required" }),
  }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(255, "Description must be less than 255 characters"),
  quantity: nullableWholeNumber("Quantity"),
  unitPrice: nullableWholeNumber("Unit price"),
  amount: requiredWholeNumber("Amount"),
});

export const CreateManualInvoiceItemSchema = ManualInvoiceItemBaseSchema.superRefine(
  (value, ctx) => {
    if (value.lineType !== "misc_charge" && value.lineType !== "adjustment") {
      ctx.addIssue({
        code: "custom",
        path: ["lineType"],
        message: "Manual invoice items must be misc charges or adjustments",
      });
    }

    if (value.amount === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount must not be 0",
      });
    }
  },
);
