import { ListInput, ListSortOrder } from "@/types";

export const DELIVERY_CHARGE_TYPES = [
  "courier",
  "staff_delivery",
  "third_party_delivery",
  "packaging",
  "misc",
  "adjustment",
] as const;

export type DeliveryChargeType = (typeof DELIVERY_CHARGE_TYPES)[number];

export type DeliveryCharge = {
  id: string;
  deliveryId: string;
  deliveryStatus: string | null;
  deliveryRecordedAt: Date | null;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  accountId: string | null;
  accountEntryId: string | null;
  accountName: string | null;
  chargeType: string;
  description: string;
  amount: number;
  billToCustomer: boolean;
  invoiceItemId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type DeliveryChargeSortBy =
  | "createdAt"
  | "deliveryRecordedAt"
  | "customerName"
  | "chargeType"
  | "amount";

export type DeliveryChargeSortOrder = ListSortOrder;

export type DeliveryChargeListInput = ListInput<DeliveryChargeSortBy>;
