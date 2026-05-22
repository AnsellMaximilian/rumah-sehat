import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { ChangeLogSortBySchema } from "./change-log.schema";
import { ChangeLog, ChangeLogListInput } from "./change-log.types";
import {
  ChangeLogMutationInput,
  getChangeLogCount,
  getChangeLogsByEntity,
  getPaginatedChangeLogs,
  insertChangeLogs,
} from "./change-log.repository";

type AuditableValue = string | number | boolean | Date | null | undefined;
type AuditableRecord = Record<string, AuditableValue>;

function serializeAuditValue(value: AuditableValue) {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function serializeAuditSnapshot(value: unknown) {
  return JSON.stringify(value, (_key, currentValue) => {
    if (currentValue instanceof Date) {
      return currentValue.toISOString();
    }

    return currentValue;
  });
}

function buildUpdateLogs(input: {
  action?: string;
  after: AuditableRecord;
  before: AuditableRecord;
  changedBy: string;
  entityId: string;
  entityType: string;
  fields: string[];
  reason?: string | null;
}) {
  return input.fields.flatMap((fieldName) => {
    const oldValue = serializeAuditValue(input.before[fieldName]);
    const newValue = serializeAuditValue(input.after[fieldName]);

    if (oldValue === newValue) {
      return [];
    }

    return {
      action: input.action ?? "updated",
      changedBy: input.changedBy,
      entityId: input.entityId,
      entityType: input.entityType,
      fieldName,
      newValue,
      oldValue,
      reason: input.reason ?? null,
    };
  });
}

function buildSnapshotLog(input: {
  action: string;
  changedBy: string;
  entityId: string | null;
  entityType: string;
  newValue?: unknown;
  oldValue?: unknown;
  reason?: string | null;
}) {
  return {
    action: input.action,
    changedBy: input.changedBy,
    entityId: input.entityId,
    entityType: input.entityType,
    fieldName: null,
    newValue:
      input.newValue === undefined ? null : serializeAuditSnapshot(input.newValue),
    oldValue:
      input.oldValue === undefined ? null : serializeAuditSnapshot(input.oldValue),
    reason: input.reason ?? null,
  };
}

export async function getChangeLogsService(
  input: ChangeLogListInput = {},
): Promise<PaginatedResult<ChangeLog>> {
  const auth = await getAuthContext();

  await auth.require("view", "change_logs");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: ChangeLogSortBySchema,
    defaultSortBy: "changedAt",
    defaultSortOrder: "desc",
  });
  const total = await getChangeLogCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 20,
  });

  const data = await getPaginatedChangeLogs({
    page,
    limit,
    query,
    sortBy,
    sortOrder,
  });

  return {
    data,
    pagination,
  };
}

export async function getEntityChangeLogsService(input: {
  entityId: string;
  entityType: string;
  limit?: number;
}) {
  const auth = await getAuthContext();

  await auth.require("view", "change_logs");

  return getChangeLogsByEntity(input);
}

export async function logChange(input: ChangeLogMutationInput) {
  await insertChangeLogs([input]);
}

export async function logChanges(input: ChangeLogMutationInput[]) {
  await insertChangeLogs(input);
}

export async function logEntityCreated(input: {
  changedBy: string;
  entity: unknown;
  entityId: string | null;
  entityType: string;
  reason?: string | null;
}) {
  await logChange(
    buildSnapshotLog({
      action: "created",
      changedBy: input.changedBy,
      entityId: input.entityId,
      entityType: input.entityType,
      newValue: input.entity,
      reason: input.reason,
    }),
  );
}

export async function logEntityDeleted(input: {
  changedBy: string;
  entity: unknown;
  entityId: string | null;
  entityType: string;
  reason?: string | null;
}) {
  await logChange(
    buildSnapshotLog({
      action: "deleted",
      changedBy: input.changedBy,
      entityId: input.entityId,
      entityType: input.entityType,
      oldValue: input.entity,
      reason: input.reason,
    }),
  );
}

export async function logEntityUpdated(input: {
  after: AuditableRecord;
  before: AuditableRecord;
  changedBy: string;
  entityId: string;
  entityType: string;
  fields: string[];
  reason?: string | null;
}) {
  await logChanges(buildUpdateLogs(input));
}
