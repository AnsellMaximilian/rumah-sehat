import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 32 }).unique(),
  description: text("description"),
  defaultUnit: varchar("default_unit", { length: 32 }),
  cost: integer("default_cost_price").notNull(),
  price: integer("default_sell_price").notNull(),
  defaultFulfillmentMode: varchar("default_fulfillment_mode", {
    length: 32,
  }).notNull(),
  trackStock: boolean("track_stock").default(false).notNull(),
  stockTrackingStartedAt: timestamp("stock_tracking_started_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
