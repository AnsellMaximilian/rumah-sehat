import { relations } from "drizzle-orm";

import { salesOrder, salesOrderLine } from "./sales/sales-order";
import { delivery, deliveryLine } from "./sales/delivery";

export const salesOrderRelations = relations(salesOrder, ({ many }) => ({
  lines: many(salesOrderLine),
}));

export const deliveryRelations = relations(delivery, ({ many }) => ({
  lines: many(deliveryLine),
}));