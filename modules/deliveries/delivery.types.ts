import { ListInput, ListSortOrder } from "@/types";

export const DELIVERY_STATUSES = ["recorded", "delivered", "void"] as const;

export type Delivery = {
  id: string;
  customerId: string;
  customerName: string | null;
  customerCode: string | null;
  deliveredAt: Date | null;
  recordedAt: Date;
  deliveredBy: string | null;
  status: string;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type DeliveryItem = {
  id: string;
  deliveryId: string;
  salesLineId: string;
  salesLineCustomerId: string | null;
  salesLineStatus: string | null;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  unitSellPrice: number | null;
  sourceMode: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type DeliveryDetail = Delivery & {
  items: DeliveryItem[];
};

export type DeliverySortBy =
  | "createdAt"
  | "recordedAt"
  | "deliveredAt"
  | "customerName"
  | "status";

export type DeliverySortOrder = ListSortOrder;

export type DeliveryListInput = ListInput<DeliverySortBy>;
