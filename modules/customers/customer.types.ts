import { ListInput, ListSortOrder } from "@/types";

export type Customer = {
  id: string;
  name: string;
  customerCode: string;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerSortBy =
  | "createdAt"
  | "customerCode"
  | "name"
  | "address";

export type CustomerSortOrder = ListSortOrder;

export type CustomerListInput = ListInput<CustomerSortBy>;