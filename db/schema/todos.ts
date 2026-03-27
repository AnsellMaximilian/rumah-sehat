import { text, boolean, pgTable, serial } from "drizzle-orm/pg-core";

export const todos = pgTable("todo", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text"),
  done: boolean("done").default(false).notNull(),
});
