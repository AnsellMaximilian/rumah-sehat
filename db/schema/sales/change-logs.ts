import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const changeLogs = pgTable("change_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: uuid("entity_id"),
  action: varchar("action", { length: 32 }).notNull(),
  fieldName: varchar("field_name", { length: 64 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: text("changed_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  reason: text("reason"),
});
