import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});