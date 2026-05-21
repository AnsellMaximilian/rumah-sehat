import { ListInput, ListSortOrder } from "@/types";

export const INVOICE_STATUSES = ["draft", "issued", "paid", "void"] as const;
export const INVOICE_SYNC_STATUSES = ["current", "needs_review"] as const;
export const INVOICE_ITEM_LINE_TYPES = [
  "product",
  "delivery_charge",
  "misc_charge",
  "adjustment",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type InvoiceSyncStatus = (typeof INVOICE_SYNC_STATUSES)[number];
export type InvoiceItemLineType = (typeof INVOICE_ITEM_LINE_TYPES)[number];

export type Invoice = {
  id: string;
  customerId: string;
  customerCode: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  status: string;
  syncStatus: string;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  lineType: string;
  description: string;
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: Date;
};

export type InvoiceDetail = Invoice & {
  items: InvoiceItem[];
  totalAmount: number;
};

export type InvoicePreviewSalesLine = {
  id: string;
  customerId: string;
  customerCode: string | null;
  customerName: string | null;
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  unitSellPrice: number | null;
  status: string;
  deliveryRecordedAt: Date | null;
  deliveryDeliveredAt: Date | null;
  amount: number | null;
};

export type InvoicePreviewDeliveryCharge = {
  id: string;
  deliveryId: string;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  chargeType: string;
  description: string;
  amount: number;
  deliveryRecordedAt: Date | null;
  deliveryDeliveredAt: Date | null;
};

export type InvoicePreview = {
  customerId: string;
  customerCode: string | null;
  customerName: string | null;
  periodStart: string;
  periodEnd: string;
  salesLines: InvoicePreviewSalesLine[];
  blockedSalesLines: InvoicePreviewSalesLine[];
  deliveryCharges: InvoicePreviewDeliveryCharge[];
  salesLinesTotal: number;
  deliveryChargesTotal: number;
  grandTotal: number;
  canGenerate: boolean;
};

export type InvoiceSortBy =
  | "createdAt"
  | "invoiceDate"
  | "invoiceNumber"
  | "customerName"
  | "status"
  | "syncStatus";

export type InvoiceSortOrder = ListSortOrder;

export type InvoiceListInput = ListInput<InvoiceSortBy>;
