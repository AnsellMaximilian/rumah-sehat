import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { customers } from "./customers";
import { products } from "./products";
import { suppliers } from "./suppliers";

export const supplierPurchases = pgTable("supplier_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  purchaseDate: varchar("purchase_date", { length: 10 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull(),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const supplierPurchaseItems = pgTable("supplier_purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierPurchaseId: uuid("supplier_purchase_id")
    .notNull()
    .references(() => supplierPurchases.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: doublePrecision("quantity").notNull(),
  unitCost: integer("unit_cost"),
  destinationType: varchar("destination_type", { length: 32 }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
