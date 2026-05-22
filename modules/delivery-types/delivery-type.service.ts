import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getAccount } from "@/modules/accounts/account.repository";
import { DeliveryTypeSortBySchema } from "./delivery-type.schema";
import {
  DeliveryType,
  DeliveryTypeListInput,
  DeliveryTypeSelectOption,
} from "./delivery-type.types";
import {
  getAllDeliveryTypes,
  getDeliveryType,
  getDeliveryTypeByName,
  getDeliveryTypeCount,
  getPaginatedDeliveryTypes,
  insertDeliveryType,
  updateDeliveryType,
} from "./delivery-type.repository";

type DeliveryTypeMutationInput = {
  name: string;
  defaultChargeType: string | null;
  defaultBillToCustomer: boolean;
  defaultAccountId: string | null;
  requiresManualAmount: boolean;
  active: boolean;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeDeliveryTypeInput(input: DeliveryTypeMutationInput) {
  return {
    name: input.name.trim(),
    defaultChargeType: normalizeOptionalText(input.defaultChargeType),
    defaultBillToCustomer: input.defaultBillToCustomer,
    defaultAccountId: normalizeOptionalText(input.defaultAccountId),
    requiresManualAmount: input.requiresManualAmount,
    active: input.active,
    notes: normalizeOptionalText(input.notes),
  };
}

async function ensureUniqueDeliveryTypeName(name: string, excludeId?: string) {
  const existingDeliveryType = await getDeliveryTypeByName(name, excludeId);

  if (existingDeliveryType) {
    throw new Error("Delivery type name already exists");
  }
}

async function ensureAccountExists(accountId: string | null) {
  if (!accountId) {
    return;
  }

  const account = await getAccount(accountId);

  if (!account) {
    throw new Error("Default account not found");
  }
}

export async function getDeliveryTypesService(
  input: DeliveryTypeListInput = {},
): Promise<PaginatedResult<DeliveryType>> {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_types");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: DeliveryTypeSortBySchema,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });
  const total = await getDeliveryTypeCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedDeliveryTypes({
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

export async function getDeliveryTypeService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_types");

  return getDeliveryType(input.id);
}

export async function getAllDeliveryTypesService(): Promise<DeliveryTypeSelectOption[]> {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_types");

  return getAllDeliveryTypes();
}

export async function createDeliveryTypeService(input: DeliveryTypeMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "delivery_types");

  const normalizedInput = normalizeDeliveryTypeInput(input);

  await ensureUniqueDeliveryTypeName(normalizedInput.name);
  await ensureAccountExists(normalizedInput.defaultAccountId);

  return insertDeliveryType(normalizedInput);
}

export async function updateDeliveryTypeService(
  input: DeliveryTypeMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "delivery_types");

  const deliveryType = await getDeliveryType(input.id);

  if (!deliveryType) {
    throw new Error("Delivery type not found");
  }

  const normalizedInput = normalizeDeliveryTypeInput(input);

  await ensureUniqueDeliveryTypeName(normalizedInput.name, input.id);
  await ensureAccountExists(normalizedInput.defaultAccountId);

  return updateDeliveryType(input.id, normalizedInput);
}

export async function deleteDeliveryTypeService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("update", "delivery_types");

  const deliveryType = await getDeliveryType(input.id);

  if (!deliveryType) {
    throw new Error("Delivery type not found");
  }

  return updateDeliveryType(input.id, { active: false });
}
