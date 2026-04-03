import { pgTable, text, integer, timestamp, check } from "drizzle-orm/pg-core";
import { invoiceStatusEnum } from "../enums";
import { sql } from "drizzle-orm";

export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),

  customerName: text("customer_name").notNull(),

  status: invoiceStatusEnum("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoiceLine = pgTable(
  "invoice_line",
  {
    id: text("id").primaryKey(),

    invoiceId: text("invoice_id").notNull(),

    deliveryLineId: text("delivery_line_id"),
    supplierFulfillmentLineId: text("supplier_fulfillment_line_id"),

    productId: text("product_id").notNull(),

    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
  },

  (table) => ({
    onlyOneSource: check(
      "only_one_source",
      sql`
        (
          ${table.deliveryLineId} IS NOT NULL AND ${table.supplierFulfillmentLineId} IS NULL
        )
        OR
        (
          ${table.deliveryLineId} IS NULL AND ${table.supplierFulfillmentLineId} IS NOT NULL
        )
      `,
    ),
  }),
);
