import { boolean, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";

export const deliveryTypes = pgTable("delivery_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  defaultChargeType: varchar("default_charge_type", { length: 32 }),
  defaultBillToCustomer: boolean("default_bill_to_customer").default(true).notNull(),
  defaultAccountId: uuid("default_account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  requiresManualAmount: boolean("requires_manual_amount").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
});
