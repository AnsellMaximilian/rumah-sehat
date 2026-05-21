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

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  invoiceNumber: varchar("invoice_number", { length: 64 }),
  periodStart: varchar("period_start", { length: 10 }).notNull(),
  periodEnd: varchar("period_end", { length: 10 }).notNull(),
  invoiceDate: varchar("invoice_date", { length: 10 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  syncStatus: varchar("sync_status", { length: 32 }).notNull(),
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

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  lineType: varchar("line_type", { length: 32 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  quantity: doublePrecision("quantity"),
  unitPrice: integer("unit_price"),
  amount: integer("amount").notNull(),
  sourceType: varchar("source_type", { length: 32 }),
  sourceId: uuid("source_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
