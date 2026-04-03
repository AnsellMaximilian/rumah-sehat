import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const supplier = pgTable("supplier", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
