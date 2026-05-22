import {
  doublePrecision,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { salesLines } from "./sales-lines";
import { supplierPurchaseItems } from "./supplier-purchases";

export const supplierPurchaseAllocations = pgTable("supplier_purchase_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierPurchaseItemId: uuid("supplier_purchase_item_id")
    .notNull()
    .references(() => supplierPurchaseItems.id, { onDelete: "cascade" }),
  salesLineId: uuid("sales_line_id")
    .notNull()
    .references(() => salesLines.id, { onDelete: "restrict" }),
  allocatedQuantity: doublePrecision("allocated_quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
