import { relations } from "drizzle-orm";

// --- SALES ---
import { salesOrder, salesOrderLine } from "./sales/sales-order";
import { delivery, deliveryLine, deliveryLineEvent } from "./sales/delivery";
import { invoice, invoiceLine } from "./sales/invoice";

// --- INVENTORY ---
import { product } from "./inventory/product";
import { stockMovement } from "./inventory/stock-movement";
import { stockCount, stockCountLine } from "./inventory/stock-count";

// --- PROCUREMENT ---
import { purchaseOrder, purchaseOrderLine } from "./procurement/purchase-order";
import { goodsReceipt, goodsReceiptLine } from "./procurement/goods-receipt";

// --- SUPPLIER ---
import { supplier } from "./supplier/supplier";
import {
  supplierFulfillment,
  supplierFulfillmentLine,
  supplierFulfillmentEvent,
} from "./supplier/supplier-fulfillment";
import {
  supplierInvoice,
  supplierInvoiceLine,
} from "./supplier/supplier-invoice";

// ======================================================
// SALES
// ======================================================

export const salesOrderRelations = relations(salesOrder, ({ many }) => ({
  lines: many(salesOrderLine),
  deliveries: many(delivery),
}));

export const salesOrderLineRelations = relations(
  salesOrderLine,
  ({ one, many }) => ({
    order: one(salesOrder, {
      fields: [salesOrderLine.orderId],
      references: [salesOrder.id],
    }),
    deliveries: many(deliveryLine),
    supplierFulfillments: many(supplierFulfillmentLine),
  }),
);

export const deliveryRelations = relations(delivery, ({ one, many }) => ({
  order: one(salesOrder, {
    fields: [delivery.orderId],
    references: [salesOrder.id],
  }),
  lines: many(deliveryLine),
}));

export const deliveryLineRelations = relations(
  deliveryLine,
  ({ one, many }) => ({
    delivery: one(delivery, {
      fields: [deliveryLine.deliveryId],
      references: [delivery.id],
    }),
    orderLine: one(salesOrderLine, {
      fields: [deliveryLine.orderLineId],
      references: [salesOrderLine.id],
    }),
    events: many(deliveryLineEvent),
    invoiceLines: many(invoiceLine),
  }),
);

export const deliveryLineEventRelations = relations(
  deliveryLineEvent,
  ({ one }) => ({
    deliveryLine: one(deliveryLine, {
      fields: [deliveryLineEvent.deliveryLineId],
      references: [deliveryLine.id],
    }),
  }),
);

export const invoiceRelations = relations(invoice, ({ many }) => ({
  lines: many(invoiceLine),
}));

export const invoiceLineRelations = relations(invoiceLine, ({ one }) => ({
  deliveryLine: one(deliveryLine, {
    fields: [invoiceLine.deliveryLineId],
    references: [deliveryLine.id],
  }),
  supplierFulfillmentLine: one(supplierFulfillmentLine, {
    fields: [invoiceLine.supplierFulfillmentLineId],
    references: [supplierFulfillmentLine.id],
  }),
}));

// ======================================================
// INVENTORY
// ======================================================

export const productRelations = relations(product, ({ many }) => ({
  stockMovements: many(stockMovement),
  stockCountLines: many(stockCountLine),
}));

export const stockMovementRelations = relations(stockMovement, ({ one }) => ({
  product: one(product, {
    fields: [stockMovement.productId],
    references: [product.id],
  }),
}));

export const stockCountRelations = relations(stockCount, ({ many }) => ({
  lines: many(stockCountLine),
}));

export const stockCountLineRelations = relations(stockCountLine, ({ one }) => ({
  stockCount: one(stockCount, {
    fields: [stockCountLine.stockCountId],
    references: [stockCount.id],
  }),
  product: one(product, {
    fields: [stockCountLine.productId],
    references: [product.id],
  }),
}));

// ======================================================
// PROCUREMENT
// ======================================================

export const purchaseOrderRelations = relations(
  purchaseOrder,
  ({ many, one }) => ({
    lines: many(purchaseOrderLine),
    supplier: one(supplier, {
      fields: [purchaseOrder.supplierId],
      references: [supplier.id],
    }),
  }),
);

export const purchaseOrderLineRelations = relations(
  purchaseOrderLine,
  ({ one, many }) => ({
    order: one(purchaseOrder, {
      fields: [purchaseOrderLine.purchaseOrderId],
      references: [purchaseOrder.id],
    }),
    receipts: many(goodsReceiptLine),
  }),
);

export const goodsReceiptRelations = relations(
  goodsReceipt,
  ({ one, many }) => ({
    purchaseOrder: one(purchaseOrder, {
      fields: [goodsReceipt.purchaseOrderId],
      references: [purchaseOrder.id],
    }),
    lines: many(goodsReceiptLine),
  }),
);

export const goodsReceiptLineRelations = relations(
  goodsReceiptLine,
  ({ one, many }) => ({
    receipt: one(goodsReceipt, {
      fields: [goodsReceiptLine.receiptId],
      references: [goodsReceipt.id],
    }),
    purchaseOrderLine: one(purchaseOrderLine, {
      fields: [goodsReceiptLine.purchaseOrderLineId],
      references: [purchaseOrderLine.id],
    }),
    supplierInvoiceLines: many(supplierInvoiceLine),
  }),
);

// ======================================================
// SUPPLIER
// ======================================================

export const supplierRelations = relations(supplier, ({ many }) => ({
  fulfillments: many(supplierFulfillment),
  invoices: many(supplierInvoice),
  purchaseOrders: many(purchaseOrder),
}));

export const supplierFulfillmentRelations = relations(
  supplierFulfillment,
  ({ one, many }) => ({
    supplier: one(supplier, {
      fields: [supplierFulfillment.supplierId],
      references: [supplier.id],
    }),
    lines: many(supplierFulfillmentLine),
  }),
);

export const supplierFulfillmentLineRelations = relations(
  supplierFulfillmentLine,
  ({ one, many }) => ({
    fulfillment: one(supplierFulfillment, {
      fields: [supplierFulfillmentLine.fulfillmentId],
      references: [supplierFulfillment.id],
    }),
    orderLine: one(salesOrderLine, {
      fields: [supplierFulfillmentLine.orderLineId],
      references: [salesOrderLine.id],
    }),
    events: many(supplierFulfillmentEvent),
    invoiceLines: many(invoiceLine),
  }),
);

export const supplierFulfillmentEventRelations = relations(
  supplierFulfillmentEvent,
  ({ one }) => ({
    fulfillmentLine: one(supplierFulfillmentLine, {
      fields: [supplierFulfillmentEvent.fulfillmentLineId],
      references: [supplierFulfillmentLine.id],
    }),
  }),
);

export const supplierInvoiceRelations = relations(
  supplierInvoice,
  ({ one, many }) => ({
    supplier: one(supplier, {
      fields: [supplierInvoice.supplierId],
      references: [supplier.id],
    }),
    lines: many(supplierInvoiceLine),
  }),
);

export const supplierInvoiceLineRelations = relations(
  supplierInvoiceLine,
  ({ one }) => ({
    supplierInvoice: one(supplierInvoice, {
      fields: [supplierInvoiceLine.supplierInvoiceId],
      references: [supplierInvoice.id],
    }),
    fulfillmentLine: one(supplierFulfillmentLine, {
      fields: [supplierInvoiceLine.supplierFulfillmentLineId],
      references: [supplierFulfillmentLine.id],
    }),
    goodsReceiptLine: one(goodsReceiptLine, {
      fields: [supplierInvoiceLine.goodsReceiptLineId],
      references: [goodsReceiptLine.id],
    }),
  }),
);
