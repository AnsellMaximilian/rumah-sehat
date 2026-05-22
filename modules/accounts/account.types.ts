import { ListInput, ListSortOrder } from "@/types";

export const ACCOUNT_TYPES = [
  "staff_cash",
  "delivery_wallet",
  "third_party_wallet",
  "business_cash",
  "bank",
  "supplier_payable",
  "other",
] as const;

export const ACCOUNT_ENTRY_TYPES = [
  "top_up",
  "delivery_charge",
  "delivery_charge_reversal",
  "manual_adjustment",
  "correction",
] as const;

export type Account = {
  id: string;
  name: string;
  type: string;
  ownerType: string | null;
  ownerId: string | null;
  active: boolean;
  notes: string | null;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountEntry = {
  id: string;
  accountId: string;
  accountName: string | null;
  amountDelta: number;
  entryType: string;
  sourceType: string | null;
  sourceId: string | null;
  description: string;
  occurredAt: Date;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
};

export type AccountSelectOption = {
  id: string;
  name: string;
  type: string;
  active: boolean;
};

export type AccountSortBy = "createdAt" | "name" | "type" | "currentBalance";
export type AccountEntrySortBy = "occurredAt" | "createdAt" | "amountDelta";

export type AccountSortOrder = ListSortOrder;
export type AccountEntrySortOrder = ListSortOrder;

export type AccountListInput = ListInput<AccountSortBy>;
export type AccountEntryListInput = ListInput<AccountEntrySortBy>;
