import { and, asc, count, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { accountEntries, accounts, user } from "@/db/schema";
import {
  AccountEntrySortBy,
  AccountEntrySortOrder,
  AccountSortBy,
  AccountSortOrder,
} from "./account.types";

type AccountMutationInput = {
  name: string;
  type: string;
  ownerType: string | null;
  ownerId: string | null;
  active: boolean;
  notes: string | null;
};

type AccountEntryMutationInput = {
  accountId: string;
  amountDelta: number;
  entryType: string;
  sourceType: string | null;
  sourceId: string | null;
  description: string;
  occurredAt: Date;
  createdBy: string;
};

function currentBalanceSql() {
  return sql<number>`coalesce(
    (
      select sum(${accountEntries.amountDelta})
      from ${accountEntries}
      where ${accountEntries.accountId} = ${accounts.id}
    ),
    0
  )`;
}

function getAccountOrderBy(sortBy: AccountSortBy, sortOrder: AccountSortOrder) {
  const columns = {
    createdAt: accounts.createdAt,
    name: accounts.name,
    type: accounts.type,
    currentBalance: currentBalanceSql(),
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function getAccountEntryOrderBy(
  sortBy: AccountEntrySortBy,
  sortOrder: AccountEntrySortOrder,
) {
  const columns = {
    occurredAt: accountEntries.occurredAt,
    createdAt: accountEntries.createdAt,
    amountDelta: accountEntries.amountDelta,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildAccountSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(accounts.name, `%${query}%`),
    ilike(accounts.type, `%${query}%`),
    ilike(accounts.ownerType, `%${query}%`),
    ilike(accounts.notes, `%${query}%`),
  );
}

function buildBaseAccountQuery() {
  const accountColumns = getTableColumns(accounts);

  return db.select({
    ...accountColumns,
    currentBalance: currentBalanceSql(),
  }).from(accounts);
}

function buildBaseAccountEntryQuery() {
  const entryColumns = getTableColumns(accountEntries);

  return db
    .select({
      ...entryColumns,
      accountName: accounts.name,
      createdByName: user.name,
    })
    .from(accountEntries)
    .leftJoin(accounts, eq(accountEntries.accountId, accounts.id))
    .leftJoin(user, eq(accountEntries.createdBy, user.id));
}

export async function getPaginatedAccounts(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: AccountSortBy;
  sortOrder: AccountSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildAccountSearchFilter(query);
  const baseQuery = filter ? buildBaseAccountQuery().where(filter) : buildBaseAccountQuery();

  return baseQuery.orderBy(getAccountOrderBy(sortBy, sortOrder)).limit(limit).offset(offset);
}

export async function getAccountCount(query: string) {
  const filter = buildAccountSearchFilter(query);
  const baseQuery = filter
    ? db.select({ count: count() }).from(accounts).where(filter)
    : db.select({ count: count() }).from(accounts);
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getAccount(id: string) {
  const [account] = await buildBaseAccountQuery().where(eq(accounts.id, id));

  return account;
}

export async function getAllAccounts() {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      active: accounts.active,
    })
    .from(accounts)
    .where(eq(accounts.active, true))
    .orderBy(asc(accounts.name));
}

export async function getAccountByName(name: string, excludeId?: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      excludeId
        ? and(eq(accounts.name, name), sql`${accounts.id} <> ${excludeId}`)
        : eq(accounts.name, name),
    );

  return account;
}

export async function getAccountEntriesByAccount(input: {
  accountId: string;
  page: number;
  limit: number;
  sortBy: AccountEntrySortBy;
  sortOrder: AccountEntrySortOrder;
}) {
  const offset = (input.page - 1) * input.limit;

  return buildBaseAccountEntryQuery()
    .where(eq(accountEntries.accountId, input.accountId))
    .orderBy(getAccountEntryOrderBy(input.sortBy, input.sortOrder))
    .limit(input.limit)
    .offset(offset);
}

export async function getAccountEntryCount(accountId: string) {
  const [{ count: countResult }] = await db
    .select({ count: count() })
    .from(accountEntries)
    .where(eq(accountEntries.accountId, accountId));

  return countResult;
}

export async function insertAccount(input: AccountMutationInput) {
  const [account] = await db.insert(accounts).values(input).returning();

  return account;
}

export async function updateAccount(
  id: string,
  input: Partial<AccountMutationInput>,
) {
  const [account] = await db
    .update(accounts)
    .set(input)
    .where(eq(accounts.id, id))
    .returning();

  return account;
}

export async function deleteAccount(id: string) {
  const [account] = await db
    .update(accounts)
    .set({ active: false })
    .where(eq(accounts.id, id))
    .returning();

  return account;
}

export async function insertAccountEntry(input: AccountEntryMutationInput) {
  const [accountEntry] = await db.insert(accountEntries).values(input).returning();

  return accountEntry;
}
