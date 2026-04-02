import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const goodsReceipt = pgTable("goods_receipt", {
  id: text("id").primaryKey(),

  purchaseOrderId: text("purchase_order_id").notNull(),

  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const goodsReceiptLine = pgTable("goods_receipt_line", {
  id: text("id").primaryKey(),

  receiptId: text("receipt_id").notNull(),

  purchaseOrderLineId: text("purchase_order_line_id").notNull(),

  productId: text("product_id").notNull(),

  receivedQty: integer("received_qty").notNull(),
});