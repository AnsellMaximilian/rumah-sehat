import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { products } from "./products";
import { suppliers } from "./suppliers";

export const salesLines = pgTable("sales_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: doublePrecision("quantity").notNull(),
  unitSellPrice: integer("unit_sell_price"),
  sourceMode: varchar("source_mode", { length: 32 }).notNull(),
  sourceDeliveryId: uuid("source_delivery_id"),
  supplierId: uuid("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  status: varchar("status", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
