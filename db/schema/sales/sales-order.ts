import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { orderStatusEnum, fulfillmentTypeEnum } from "../enums";

export const salesOrder = pgTable("sales_order", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),

  status: orderStatusEnum("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesOrderLine = pgTable("sales_order_line", {
  id: text("id").primaryKey(),

  orderId: text("order_id").notNull(),

  productId: text("product_id").notNull(),

  orderedQty: integer("ordered_qty").notNull(),

  fulfillmentType: fulfillmentTypeEnum("fulfillment_type").notNull(),

  supplierId: text("supplier_id"),

  costPrice: integer("cost_price").notNull(),
  sellPrice: integer("sell_price").notNull(),
});
