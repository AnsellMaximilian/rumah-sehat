import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { purchaseOrderStatusEnum } from "../enums";

export const purchaseOrder = pgTable("purchase_order", {
  id: text("id").primaryKey(),

  supplierId: text("supplier_id").notNull(),

  status: purchaseOrderStatusEnum("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrderLine = pgTable("purchase_order_line", {
  id: text("id").primaryKey(),

  purchaseOrderId: text("purchase_order_id").notNull(),

  productId: text("product_id").notNull(),

  orderedQty: integer("ordered_qty").notNull(),

  costPrice: integer("cost_price").notNull(),
});