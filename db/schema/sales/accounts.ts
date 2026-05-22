import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  ownerType: varchar("owner_type", { length: 32 }),
  ownerId: uuid("owner_id"),
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const accountEntries = pgTable("account_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  amountDelta: integer("amount_delta").notNull(),
  entryType: varchar("entry_type", { length: 32 }).notNull(),
  sourceType: varchar("source_type", { length: 64 }),
  sourceId: uuid("source_id"),
  description: varchar("description", { length: 255 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
