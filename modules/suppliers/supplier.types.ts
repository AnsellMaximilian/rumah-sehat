import { ListInput, ListSortOrder } from "@/types";

export type Supplier = {
  id: string;
  name: string;
  supplierCode: string | null;
  contactInfo: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SupplierSelectOption = {
  id: string;
  name: string;
  supplierCode: string | null;
  active: boolean;
};

export type SupplierSortBy =
  | "createdAt"
  | "supplierCode"
  | "name"
  | "bankName";

export type SupplierSortOrder = ListSortOrder;

export type SupplierListInput = ListInput<SupplierSortBy>;
