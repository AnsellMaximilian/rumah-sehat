import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { stockMovementTypeEnum } from "../enums";
import { product } from "./product";

export const stockMovement = pgTable("stock_movement", {
  id: text("id").primaryKey(),

  productId: text("product_id")
    .notNull()
    .references(() => product.id),

  qtyDelta: integer("qty_delta").notNull(),

  movementType: stockMovementTypeEnum("movement_type").notNull(),

  sourceDocumentType: text("source_document_type"),
  sourceDocumentId: text("source_document_id"),
  sourceLineId: text("source_line_id"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});