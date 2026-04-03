import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { supplierInvoiceStatusEnum } from "../enums";

export const supplierInvoice = pgTable("supplier_invoice", {
  id: text("id").primaryKey(),

  supplierId: text("supplier_id").notNull(),

  invoiceNumber: text("invoice_number"),
  invoiceDate: timestamp("invoice_date"),

  status: supplierInvoiceStatusEnum("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const supplierInvoiceLine = pgTable(
  "supplier_invoice_line",
  {
    id: text("id").primaryKey(),

    supplierInvoiceId: text("supplier_invoice_id").notNull(),

    // 🔥 LINK TO REALITY
    supplierFulfillmentLineId: text("supplier_fulfillment_line_id"),
    goodsReceiptLineId: text("goods_receipt_line_id"),

    productId: text("product_id").notNull(),

    qty: integer("qty").notNull(),

    costPrice: integer("cost_price").notNull(),
  },
  (table) => ({
    onlyOneSource: check(
      "supplier_invoice_one_source",
      sql`
      (${table.supplierFulfillmentLineId} IS NOT NULL AND ${table.goodsReceiptLineId} IS NULL)
      OR
      (${table.supplierFulfillmentLineId} IS NULL AND ${table.goodsReceiptLineId} IS NOT NULL)
      `,
    ),
  }),
);
