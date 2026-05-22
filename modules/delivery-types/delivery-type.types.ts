import { ListInput, ListSortOrder } from "@/types";

export type DeliveryType = {
  id: string;
  name: string;
  defaultChargeType: string | null;
  defaultBillToCustomer: boolean;
  defaultAccountId: string | null;
  defaultAccountName: string | null;
  requiresManualAmount: boolean;
  active: boolean;
  notes: string | null;
};

export type DeliveryTypeSelectOption = {
  id: string;
  name: string;
  defaultChargeType: string | null;
  defaultBillToCustomer: boolean;
  defaultAccountId: string | null;
  requiresManualAmount: boolean;
  active: boolean;
};

export type DeliveryTypeSortBy = "name" | "defaultChargeType" | "active";
export type DeliveryTypeSortOrder = ListSortOrder;
export type DeliveryTypeListInput = ListInput<DeliveryTypeSortBy>;
