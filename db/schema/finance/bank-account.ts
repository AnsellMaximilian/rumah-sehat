import { pgTable, text, boolean } from "drizzle-orm/pg-core";

export const bankAccount = pgTable("bank_account", {
  id: text("id").primaryKey(),

  entityType: text("entity_type").notNull(), // 'CUSTOMER' | 'SUPPLIER'
  entityId: text("entity_id").notNull(),

  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name"),

  isPrimary: boolean("is_primary").default(false).notNull(),
});
