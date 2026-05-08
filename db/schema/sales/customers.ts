import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";


export const customers = pgTable("customers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {length: 255}).notNull(),
    customerCode: varchar("customer_code", { length: 32 } ).notNull().unique(),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull()

})