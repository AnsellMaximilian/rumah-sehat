import { and, asc, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { changeLogs, user } from "@/db/schema";
import {
  ChangeLogSortBy,
  ChangeLogSortOrder,
} from "./change-log.types";

export type ChangeLogMutationInput = {
  entityType: string;
  entityId: string | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  reason: string | null;
};

function getChangeLogOrderBy(
  sortBy: ChangeLogSortBy,
  sortOrder: ChangeLogSortOrder,
) {
  const columns = {
    changedAt: changeLogs.changedAt,
    entityType: changeLogs.entityType,
    action: changeLogs.action,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildChangeLogSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(changeLogs.entityType, `%${query}%`),
    ilike(changeLogs.action, `%${query}%`),
    ilike(changeLogs.fieldName, `%${query}%`),
    ilike(changeLogs.oldValue, `%${query}%`),
    ilike(changeLogs.newValue, `%${query}%`),
    ilike(changeLogs.reason, `%${query}%`),
  );
}

function buildBaseChangeLogQuery() {
  const changeLogColumns = getTableColumns(changeLogs);

  return db
    .select({
      ...changeLogColumns,
      changedByName: user.name,
    })
    .from(changeLogs)
    .leftJoin(user, eq(changeLogs.changedBy, user.id));
}

export async function getPaginatedChangeLogs(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: ChangeLogSortBy;
  sortOrder: ChangeLogSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildChangeLogSearchFilter(query);
  const baseQuery = filter ? buildBaseChangeLogQuery().where(filter) : buildBaseChangeLogQuery();

  return baseQuery
    .orderBy(getChangeLogOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getChangeLogCount(query: string) {
  const filter = buildChangeLogSearchFilter(query);
  const baseQuery = filter
    ? db.select({ count: count() }).from(changeLogs).where(filter)
    : db.select({ count: count() }).from(changeLogs);
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getChangeLogsByEntity(input: {
  entityId: string;
  entityType: string;
  limit?: number;
}) {
  return buildBaseChangeLogQuery()
    .where(
      and(
        eq(changeLogs.entityType, input.entityType),
        eq(changeLogs.entityId, input.entityId),
      ),
    )
    .orderBy(desc(changeLogs.changedAt))
    .limit(input.limit ?? 50);
}

export async function insertChangeLogs(input: ChangeLogMutationInput[]) {
  if (input.length === 0) {
    return [];
  }

  return db.insert(changeLogs).values(input).returning();
}
