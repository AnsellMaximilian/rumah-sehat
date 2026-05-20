import { ListInput, ListSortOrder } from "@/types";

export const PRODUCT_FULFILLMENT_MODES = [
  "stock",
  "supplier_direct",
  "supplier_prepacked",
  "manual",
  "unknown",
] as const;

export type ProductFulfillmentMode =
  (typeof PRODUCT_FULFILLMENT_MODES)[number];

export type Product = {
  id: string;
  name: string;
  productCode: string | null;
  description: string | null;
  supplierId: string | null;
  supplierName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  defaultUnit: string | null;
  cost: number;
  price: number;
  defaultFulfillmentMode: string;
  trackStock: boolean;
  stockTrackingStartedAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductSelectOption = {
  id: string;
  name: string;
  productCode: string | null;
  supplierId: string | null;
  supplierName: string | null;
  active: boolean;
};

export type ProductSortBy =
  | "createdAt"
  | "productCode"
  | "name"
  | "defaultUnit"
  | "cost"
  | "price"
  | "defaultFulfillmentMode";

export type ProductSortOrder = ListSortOrder;

export type ProductListInput = ListInput<ProductSortBy>;
