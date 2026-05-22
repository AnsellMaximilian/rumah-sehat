import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import {
  logEntityCreated,
  logEntityDeleted,
  logEntityUpdated,
} from "@/modules/change-logs/change-log.service";
import { AccountSortBySchema, AccountEntrySortBySchema } from "./account.schema";
import {
  Account,
  AccountEntry,
  AccountEntryListInput,
  AccountListInput,
  AccountSelectOption,
} from "./account.types";
import {
  deleteAccount,
  getAccount,
  getAccountByName,
  getAccountCount,
  getAccountEntriesByAccount,
  getAccountEntryCount,
  getAllAccounts,
  getPaginatedAccounts,
  insertAccount,
  insertAccountEntry,
  updateAccount,
} from "./account.repository";

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
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeAccountInput(input: AccountMutationInput) {
  return {
    name: input.name.trim(),
    type: input.type,
    ownerType: normalizeOptionalText(input.ownerType),
    ownerId: normalizeOptionalText(input.ownerId),
    active: input.active,
    notes: normalizeOptionalText(input.notes),
  };
}

function normalizeAccountEntryInput(input: AccountEntryMutationInput) {
  return {
    accountId: input.accountId,
    amountDelta: input.amountDelta,
    entryType: input.entryType,
    sourceType: normalizeOptionalText(input.sourceType),
    sourceId: normalizeOptionalText(input.sourceId),
    description: input.description.trim(),
    occurredAt: input.occurredAt,
  };
}

async function ensureAccountExists(accountId: string) {
  const account = await getAccount(accountId);

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

async function ensureUniqueAccountName(name: string, excludeId?: string) {
  const existingAccount = await getAccountByName(name, excludeId);

  if (existingAccount) {
    throw new Error("Account name already exists");
  }
}

export async function getAccountsService(
  input: AccountListInput = {},
): Promise<PaginatedResult<Account>> {
  const auth = await getAuthContext();

  await auth.require("view", "accounts");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: AccountSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getAccountCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedAccounts({
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

export async function getAccountService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "accounts");

  return getAccount(input.id);
}

export async function getAllAccountsService(): Promise<AccountSelectOption[]> {
  const auth = await getAuthContext();

  await auth.require("view", "accounts");

  return getAllAccounts();
}

export async function getAccountEntriesService(
  input: AccountEntryListInput & { accountId: string },
): Promise<PaginatedResult<AccountEntry>> {
  const auth = await getAuthContext();

  await auth.require("view", "account_entries");

  await ensureAccountExists(input.accountId);

  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: AccountEntrySortBySchema,
    defaultSortBy: "occurredAt",
    defaultSortOrder: "desc",
  });
  const total = await getAccountEntryCount(input.accountId);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 20,
  });

  const data = await getAccountEntriesByAccount({
    accountId: input.accountId,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  return {
    data,
    pagination,
  };
}

export async function createAccountService(input: AccountMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "accounts");

  const normalizedInput = normalizeAccountInput(input);

  await ensureUniqueAccountName(normalizedInput.name);

  const account = await insertAccount(normalizedInput);

  await logEntityCreated({
    changedBy: auth.user.id,
    entity: account,
    entityId: account.id,
    entityType: "account",
  });

  return account;
}

export async function updateAccountService(
  input: AccountMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "accounts");

  const account = await getAccount(input.id);

  if (!account) {
    throw new Error("Account not found");
  }

  const normalizedInput = normalizeAccountInput(input);

  await ensureUniqueAccountName(normalizedInput.name, input.id);

  const updatedAccount = await updateAccount(input.id, normalizedInput);

  if (updatedAccount) {
    await logEntityUpdated({
      after: updatedAccount,
      before: account,
      changedBy: auth.user.id,
      entityId: input.id,
      entityType: "account",
      fields: ["name", "type", "ownerType", "ownerId", "active", "notes"],
    });
  }

  return updatedAccount;
}

export async function deleteAccountService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "accounts");

  const account = await getAccount(input.id);

  if (!account) {
    throw new Error("Account not found");
  }

  const deletedAccount = await deleteAccount(input.id);

  if (deletedAccount) {
    await logEntityDeleted({
      changedBy: auth.user.id,
      entity: account,
      entityId: input.id,
      entityType: "account",
      reason: "Account deactivated",
    });
  }

  return deletedAccount;
}

export async function createAccountEntryService(input: AccountEntryMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "account_entries");

  const normalizedInput = normalizeAccountEntryInput(input);

  await ensureAccountExists(normalizedInput.accountId);

  if (normalizedInput.amountDelta === 0) {
    throw new Error("Account entry amount must not be 0");
  }

  const accountEntry = await insertAccountEntry({
    ...normalizedInput,
    createdBy: auth.user.id,
  });

  await logEntityCreated({
    changedBy: auth.user.id,
    entity: accountEntry,
    entityId: accountEntry.id,
    entityType: "account_entry",
  });

  return accountEntry;
}
