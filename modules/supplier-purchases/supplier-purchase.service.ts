import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import { getProduct } from "@/modules/products/product.repository";
import { getSupplier } from "@/modules/suppliers/supplier.repository";
import {
  deleteSupplierPurchase,
  getSupplierPurchase,
  getSupplierPurchaseByReferenceNumber,
  getSupplierPurchaseCount,
  getSupplierPurchaseItems,
  getPaginatedSupplierPurchases,
  insertSupplierPurchase,
  updateSupplierPurchase,
} from "./supplier-purchase.repository";
import {
  SupplierPurchase,
  SupplierPurchaseDetail,
  SupplierPurchaseListInput,
} from "./supplier-purchase.types";
import { SupplierPurchaseSortBySchema } from "./supplier-purchase.schema";

type SupplierPurchaseItemMutationInput = {
  productId: string;
  quantity: number;
  unitCost: number | null;
  destinationType: string;
  customerId: string | null;
  notes: string | null;
};

type SupplierPurchaseMutationInput = {
  supplierId: string;
  purchaseDate: string;
  referenceNumber: string | null;
  status: string;
  notes: string | null;
  items: SupplierPurchaseItemMutationInput[];
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeSupplierPurchaseItemInput(
  item: SupplierPurchaseItemMutationInput,
) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    unitCost: item.unitCost,
    destinationType: item.destinationType,
    customerId: normalizeOptionalText(item.customerId),
    notes: normalizeOptionalText(item.notes),
  };
}

function normalizeSupplierPurchaseInput(input: SupplierPurchaseMutationInput) {
  return {
    supplierId: input.supplierId,
    purchaseDate: input.purchaseDate,
    referenceNumber: normalizeOptionalText(input.referenceNumber),
    status: input.status,
    notes: normalizeOptionalText(input.notes),
    items: input.items.map(normalizeSupplierPurchaseItemInput),
  };
}

async function ensureSupplierExists(supplierId: string) {
  const supplier = await getSupplier(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
}

async function ensureUniqueReferenceNumber(referenceNumber: string | null) {
  if (!referenceNumber) {
    return;
  }

  const existingSupplierPurchase =
    await getSupplierPurchaseByReferenceNumber(referenceNumber);

  if (existingSupplierPurchase) {
    throw new Error("Reference number already exists");
  }
}

async function ensureUniqueReferenceNumberForUpdate(
  referenceNumber: string | null,
  supplierPurchaseId: string,
) {
  if (!referenceNumber) {
    return;
  }

  const duplicateSupplierPurchase =
    await getSupplierPurchaseByReferenceNumber(referenceNumber, supplierPurchaseId);

  if (duplicateSupplierPurchase) {
    throw new Error("Reference number already exists");
  }
}

async function ensureItemsAreValid(input: {
  supplierId: string;
  items: SupplierPurchaseItemMutationInput[];
}) {
  for (const item of input.items) {
    const product = await getProduct(item.productId);

    if (!product) {
      throw new Error("One or more products no longer exist");
    }

    if (product.supplierId && product.supplierId !== input.supplierId) {
      throw new Error(
        `Product ${product.name} belongs to a different supplier`,
      );
    }

    if (item.customerId) {
      const customer = await getCustomer(item.customerId);

      if (!customer) {
        throw new Error("One or more customers no longer exist");
      }
    }
  }
}

export async function getSupplierPurchasesService(
  input: SupplierPurchaseListInput = {},
): Promise<PaginatedResult<SupplierPurchase>> {
  const auth = await getAuthContext();

  await auth.require("view", "supplier_purchases");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: SupplierPurchaseSortBySchema,
    defaultSortBy: "purchaseDate",
    defaultSortOrder: "desc",
  });
  const total = await getSupplierPurchaseCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedSupplierPurchases({
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

export async function getSupplierPurchaseService(input: {
  id: string;
}): Promise<SupplierPurchaseDetail | null> {
  const auth = await getAuthContext();

  await auth.require("view", "supplier_purchases");

  const supplierPurchase = await getSupplierPurchase(input.id);

  if (!supplierPurchase) {
    return null;
  }

  const items = await getSupplierPurchaseItems(input.id);

  return {
    ...supplierPurchase,
    items,
  };
}

export async function createSupplierPurchaseService(
  input: SupplierPurchaseMutationInput,
) {
  const auth = await getAuthContext();

  await auth.require("create", "supplier_purchases");

  const normalizedInput = normalizeSupplierPurchaseInput(input);

  await ensureSupplierExists(normalizedInput.supplierId);
  await ensureUniqueReferenceNumber(normalizedInput.referenceNumber);
  await ensureItemsAreValid({
    supplierId: normalizedInput.supplierId,
    items: normalizedInput.items,
  });

  return insertSupplierPurchase({
    purchase: {
      supplierId: normalizedInput.supplierId,
      purchaseDate: normalizedInput.purchaseDate,
      referenceNumber: normalizedInput.referenceNumber,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
      createdBy: auth.user.id,
    },
    items: normalizedInput.items,
  });
}

export async function updateSupplierPurchaseService(
  input: SupplierPurchaseMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "supplier_purchases");

  const supplierPurchase = await getSupplierPurchase(input.id);

  if (!supplierPurchase) {
    throw new Error("Supplier purchase not found");
  }

  const normalizedInput = normalizeSupplierPurchaseInput(input);

  await ensureSupplierExists(normalizedInput.supplierId);
  await ensureUniqueReferenceNumberForUpdate(
    normalizedInput.referenceNumber,
    input.id,
  );
  await ensureItemsAreValid({
    supplierId: normalizedInput.supplierId,
    items: normalizedInput.items,
  });

  return updateSupplierPurchase(input.id, {
    purchase: {
      supplierId: normalizedInput.supplierId,
      purchaseDate: normalizedInput.purchaseDate,
      referenceNumber: normalizedInput.referenceNumber,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
    },
    items: normalizedInput.items,
  });
}

export async function deleteSupplierPurchaseService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "supplier_purchases");

  const supplierPurchase = await getSupplierPurchase(input.id);

  if (!supplierPurchase) {
    throw new Error("Supplier purchase not found");
  }

  return deleteSupplierPurchase(input.id);
}
