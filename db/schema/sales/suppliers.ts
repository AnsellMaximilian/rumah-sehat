import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  supplierCode: varchar("supplier_code", { length: 32 }).unique(),
  contactInfo: text("contact_info"),
  bankName: varchar("bank_name", { length: 255 }),
  bankAccountName: varchar("bank_account_name", { length: 255 }),
  bankAccountNumber: varchar("bank_account_number", { length: 64 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
