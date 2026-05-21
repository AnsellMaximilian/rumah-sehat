import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { products } from "./products";

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantityDelta: doublePrecision("quantity_delta").notNull(),
  movementType: varchar("movement_type", { length: 32 }).notNull(),
  sourceType: varchar("source_type", { length: 64 }),
  sourceId: uuid("source_id"),
  occurredAt: timestamp("occurred_at").notNull(),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
