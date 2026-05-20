import { ListInput, ListSortOrder } from "@/types";

export const SUPPLIER_PURCHASE_STATUSES = [
  "draft",
  "ordered",
  "confirmed",
  "arrived",
  "delivered_by_supplier",
  "closed",
  "void",
] as const;

export const SUPPLIER_PURCHASE_DESTINATION_TYPES = [
  "stock",
  "customer_direct",
  "customer_prepacked",
  "record_only",
  "unknown",
] as const;

export type SupplierPurchaseStatus =
  (typeof SUPPLIER_PURCHASE_STATUSES)[number];

export type SupplierPurchaseDestinationType =
  (typeof SUPPLIER_PURCHASE_DESTINATION_TYPES)[number];

export type SupplierPurchase = {
  id: string;
  supplierId: string;
  supplierName: string | null;
  purchaseDate: string;
  referenceNumber: string | null;
  status: string;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SupplierPurchaseItem = {
  id: string;
  supplierPurchaseId: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  unitCost: number | null;
  destinationType: string;
  customerId: string | null;
  customerName: string | null;
  customerCode: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SupplierPurchaseDetail = SupplierPurchase & {
  items: SupplierPurchaseItem[];
};

export type SupplierPurchaseSortBy =
  | "createdAt"
  | "purchaseDate"
  | "referenceNumber"
  | "status";

export type SupplierPurchaseSortOrder = ListSortOrder;

export type SupplierPurchaseListInput = ListInput<SupplierPurchaseSortBy>;
