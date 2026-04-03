import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { supplierFulfillmentEventTypeEnum } from "../enums";

export const supplierFulfillment = pgTable("supplier_fulfillment", {
  id: text("id").primaryKey(),

  orderId: text("order_id").notNull(),
  supplierId: text("supplier_id").notNull(),

  status: text("status").notNull(), // keep flexible for now

  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"),
  notes: text("notes"),
});

export const supplierFulfillmentLine = pgTable("supplier_fulfillment_line", {
  id: text("id").primaryKey(),

  fulfillmentId: text("fulfillment_id").notNull(),

  orderLineId: text("order_line_id").notNull(),

  productId: text("product_id").notNull(),

  requestedQty: integer("requested_qty").notNull(),

  // 🔥 important for invoicing control
  billedQty: integer("billed_qty").default(0).notNull(),
});

export const supplierFulfillmentEvent = pgTable("supplier_fulfillment_event", {
  id: text("id").primaryKey(),

  fulfillmentLineId: text("fulfillment_line_id").notNull(),

  eventType: supplierFulfillmentEventTypeEnum("event_type").notNull(),

  qtyDelta: integer("qty_delta").notNull(),

  notes: text("notes"),
});
