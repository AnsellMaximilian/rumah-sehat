import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import {
  deleteSupplier,
  getAllSuppliers,
  getPaginatedSuppliers,
  getSupplier,
  getSupplierByCode,
  getSupplierCount,
  insertSupplier,
  updateSupplier,
} from "./supplier.repository";
import { Supplier, SupplierListInput, SupplierSelectOption } from "./supplier.types";
import { SupplierSortBySchema } from "./supplier.schema";

type SupplierMutationInput = {
  name: string;
  supplierCode: string | null;
  contactInfo: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  notes: string | null;
  active: boolean;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeSupplierInput(input: SupplierMutationInput) {
  return {
    name: input.name.trim(),
    supplierCode: normalizeOptionalText(input.supplierCode),
    contactInfo: normalizeOptionalText(input.contactInfo),
    bankName: normalizeOptionalText(input.bankName),
    bankAccountName: normalizeOptionalText(input.bankAccountName),
    bankAccountNumber: normalizeOptionalText(input.bankAccountNumber),
    notes: normalizeOptionalText(input.notes),
    active: input.active,
  };
}

async function ensureUniqueSupplierCode(supplierCode: string | null) {
  if (!supplierCode) {
    return;
  }

  const existingSupplier = await getSupplierByCode(supplierCode);

  if (existingSupplier) {
    throw new Error("Supplier code already exists");
  }
}

async function ensureUniqueSupplierCodeForUpdate(
  supplierCode: string | null,
  supplierId: string,
) {
  if (!supplierCode) {
    return;
  }

  const duplicateSupplier = await getSupplierByCode(supplierCode, supplierId);

  if (duplicateSupplier) {
    throw new Error("Supplier code already exists");
  }
}

export async function getSuppliersService(
  input: SupplierListInput = {},
): Promise<PaginatedResult<Supplier>> {
  const auth = await getAuthContext();

  await auth.require("view", "suppliers");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: SupplierSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getSupplierCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedSuppliers({
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

export async function getSupplierService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "suppliers");

  return getSupplier(input.id);
}

export async function getAllSuppliersService(): Promise<SupplierSelectOption[]> {
  const auth = await getAuthContext();

  await auth.require("view", "suppliers");

  return getAllSuppliers();
}

export async function createSupplierService(input: SupplierMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "suppliers");

  const normalizedInput = normalizeSupplierInput(input);

  await ensureUniqueSupplierCode(normalizedInput.supplierCode);

  return insertSupplier(normalizedInput);
}

export async function updateSupplierService(
  input: SupplierMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "suppliers");

  const supplier = await getSupplier(input.id);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const normalizedInput = normalizeSupplierInput(input);

  await ensureUniqueSupplierCodeForUpdate(
    normalizedInput.supplierCode,
    input.id,
  );

  return updateSupplier(input.id, normalizedInput);
}

export async function deleteSupplierService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "suppliers");

  const supplier = await getSupplier(input.id);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return deleteSupplier(input.id);
}
