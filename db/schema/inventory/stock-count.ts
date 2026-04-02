import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { stockCountStatusEnum } from "../enums";

export const stockCount = pgTable("stock_count", {
  id: text("id").primaryKey(),

  status: stockCountStatusEnum("status").notNull(),

  countedAt: timestamp("counted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockCountLine = pgTable("stock_count_line", {
  id: text("id").primaryKey(),

  stockCountId: text("stock_count_id").notNull(),

  productId: text("product_id").notNull(),

  systemQty: integer("system_qty").notNull(),

  physicalQty: integer("physical_qty").notNull(),
});