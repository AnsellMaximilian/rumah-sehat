import { ListInput, ListSortOrder } from "@/types";

export const SALES_LINE_SOURCE_MODES = [
  "stock",
  "supplier_direct",
  "supplier_prepacked",
  "manual",
  "correction",
  "unknown",
] as const;

export const SALES_LINE_STATUSES = [
  "pending",
  "ready_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type SalesLine = {
  id: string;
  customerId: string;
  customerName: string | null;
  customerCode: string | null;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  unitSellPrice: number | null;
  sourceMode: string;
  supplierId: string | null;
  supplierName: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type SalesLineSortBy =
  | "createdAt"
  | "customerName"
  | "productName"
  | "quantity"
  | "unitSellPrice"
  | "sourceMode"
  | "status";

export type SalesLineSortOrder = ListSortOrder;

export type SalesLineListInput = ListInput<SalesLineSortBy>;
