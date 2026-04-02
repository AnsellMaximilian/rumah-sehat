import { pgEnum } from "drizzle-orm/pg-core";

// --- ORDER ---
export const orderStatusEnum = pgEnum("order_status", [
  "DRAFT",
  "CONFIRMED",
  "CANCELLED",
]);

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", [
  "INTERNAL",
  "SUPPLIER_DIRECT",
]);

// --- DELIVERY ---
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "DRAFT",
  "SENT",
  "COMPLETED",
]);

export const deliveryEventTypeEnum = pgEnum("delivery_event_type", [
  "BREAKAGE",
  "OMITTED_NOT_LOADED",
  "LOST_IN_TRANSIT",
  "CUSTOMER_REJECTED",
]);

// --- STOCK ---
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "PURCHASE_RECEIPT",
  "SALE_DELIVERY",
  "BREAKAGE",
  "INTERNAL_USE",
  "STOCK_COUNT_GAIN",
  "STOCK_COUNT_LOSS",
]);

// --- PROCUREMENT ---
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "DRAFT",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "COMPLETED",
]);

// --- INVOICE ---
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PAID",
]);

export const supplierInvoiceStatusEnum = pgEnum("supplier_invoice_status", [
  "UNPAID",
  "PAID",
]);

// --- STOCK COUNT ---
export const stockCountStatusEnum = pgEnum("stock_count_status", [
  "DRAFT",
  "COMPLETED",
]);