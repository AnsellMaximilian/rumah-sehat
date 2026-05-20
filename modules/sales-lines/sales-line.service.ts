import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import { getProduct } from "@/modules/products/product.repository";
import { getSupplier } from "@/modules/suppliers/supplier.repository";
import {
  getPaginatedSalesLines,
  getSalesLine,
  getSalesLineCount,
  insertSalesLine,
  softDeleteSalesLine,
  updateSalesLine,
} from "./sales-line.repository";
import { SalesLine, SalesLineListInput } from "./sales-line.types";
import { SalesLineSortBySchema } from "./sales-line.schema";

type SalesLineMutationInput = {
  customerId: string;
  productId: string;
  quantity: number;
  unitSellPrice: number | null;
  sourceMode: string;
  supplierId: string | null;
  status: string;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeSalesLineInput(input: SalesLineMutationInput) {
  return {
    customerId: input.customerId,
    productId: input.productId,
    quantity: input.quantity,
    unitSellPrice: input.unitSellPrice,
    sourceMode: input.sourceMode,
    supplierId: normalizeOptionalText(input.supplierId),
    status: input.status,
    notes: normalizeOptionalText(input.notes),
  };
}

async function ensureCustomerExists(customerId: string) {
  const customer = await getCustomer(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

async function ensureProductExists(productId: string) {
  const product = await getProduct(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

async function ensureSupplierExists(supplierId: string | null) {
  if (!supplierId) {
    return null;
  }

  const supplier = await getSupplier(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
}

async function ensureProductSupplierCompatibility(input: {
  productId: string;
  supplierId: string | null;
}) {
  const product = await ensureProductExists(input.productId);

  if (input.supplierId && product.supplierId && input.supplierId !== product.supplierId) {
    throw new Error(`Product ${product.name} belongs to a different supplier`);
  }
}

export async function getSalesLinesService(
  input: SalesLineListInput = {},
): Promise<PaginatedResult<SalesLine>> {
  const auth = await getAuthContext();

  await auth.require("view", "sales_lines");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: SalesLineSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getSalesLineCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedSalesLines({
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

export async function getSalesLineService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "sales_lines");

  return getSalesLine(input.id);
}

export async function createSalesLineService(input: SalesLineMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "sales_lines");

  const normalizedInput = normalizeSalesLineInput(input);

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureProductExists(normalizedInput.productId);
  await ensureSupplierExists(normalizedInput.supplierId);
  await ensureProductSupplierCompatibility({
    productId: normalizedInput.productId,
    supplierId: normalizedInput.supplierId,
  });

  return insertSalesLine(normalizedInput);
}

export async function updateSalesLineService(
  input: SalesLineMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "sales_lines");

  const salesLine = await getSalesLine(input.id);

  if (!salesLine) {
    throw new Error("Sales line not found");
  }

  const normalizedInput = normalizeSalesLineInput(input);

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureProductExists(normalizedInput.productId);
  await ensureSupplierExists(normalizedInput.supplierId);
  await ensureProductSupplierCompatibility({
    productId: normalizedInput.productId,
    supplierId: normalizedInput.supplierId,
  });

  return updateSalesLine(input.id, normalizedInput);
}

export async function deleteSalesLineService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "sales_lines");

  const salesLine = await getSalesLine(input.id);

  if (!salesLine) {
    throw new Error("Sales line not found");
  }

  return softDeleteSalesLine(input.id);
}
