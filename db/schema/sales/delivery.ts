import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { deliveryStatusEnum, deliveryEventTypeEnum } from "../enums";

export const delivery = pgTable("delivery", {
  id: text("id").primaryKey(),

  orderId: text("order_id").notNull(),

  status: deliveryStatusEnum("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryLine = pgTable("delivery_line", {
  id: text("id").primaryKey(),

  deliveryId: text("delivery_id").notNull(),

  orderLineId: text("order_line_id").notNull(),

  productId: text("product_id").notNull(),

  attemptedQty: integer("attempted_qty").notNull(),
});

export const deliveryLineEvent = pgTable("delivery_line_event", {
  id: text("id").primaryKey(),

  deliveryLineId: text("delivery_line_id").notNull(),

  eventType: deliveryEventTypeEnum("event_type").notNull(),

  qtyDelta: integer("qty_delta").notNull(),

  notes: text("notes"),
});