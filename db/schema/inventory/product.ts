import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),

  sellPrice: integer("sell_price"),
  costPrice: integer("cost_price"),

  priceUpdatedAt: timestamp("price_updated_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
