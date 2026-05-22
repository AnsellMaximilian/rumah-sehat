import { ListInput, ListSortOrder } from "@/types";

export const CHANGE_LOG_ACTIONS = [
  "created",
  "updated",
  "deleted",
  "restored",
  "voided",
] as const;

export type ChangeLog = {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedByName: string | null;
  changedAt: Date;
  reason: string | null;
};

export type ChangeLogSortBy = "changedAt" | "entityType" | "action";
export type ChangeLogSortOrder = ListSortOrder;
export type ChangeLogListInput = ListInput<ChangeLogSortBy>;
