import {
  boolean,
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
import { salesLines } from "./sales-lines";

export const deliveries = pgTable("deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  deliveredAt: timestamp("delivered_at"),
  recordedAt: timestamp("recorded_at").notNull(),
  deliveredBy: varchar("delivered_by", { length: 255 }),
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

export const deliveryItems = pgTable("delivery_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "cascade" }),
  salesLineId: uuid("sales_line_id")
    .notNull()
    .references(() => salesLines.id, { onDelete: "restrict" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: doublePrecision("quantity").notNull(),
  unitSellPrice: integer("unit_sell_price"),
  sourceMode: varchar("source_mode", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const deliveryCharges = pgTable("delivery_charges", {
  id: uuid("id").defaultRandom().primaryKey(),
  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "cascade" }),
  chargeType: varchar("charge_type", { length: 32 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  billToCustomer: boolean("bill_to_customer").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
