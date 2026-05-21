import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import { getActiveDeliveryItemsBySalesLineIds } from "@/modules/deliveries/delivery.repository";
import {
  markInvoicesNeedsReviewBySources,
  markInvoicesNeedsReviewForCustomerDate,
} from "@/modules/invoices/invoice.service";
import { getProduct } from "@/modules/products/product.repository";
import { getSalesLinesBySourceSupplierPurchaseItemIds } from "@/modules/sales-lines/sales-line.repository";
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
  id?: string | null;
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
    id: normalizeOptionalText(item.id),
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

function parseSupplierPurchaseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function buildGeneratedSupplierPurchaseItemState(input: {
  item: {
    id: string;
    customerId: string | null;
    destinationType: string;
    productId: string;
    quantity: number;
  };
  status: string;
  supplierId: string;
}) {
  if (!input.item.customerId) {
    return null;
  }

  if (input.item.destinationType === "customer_direct") {
    if (
      input.status !== "delivered_by_supplier" &&
      input.status !== "closed"
    ) {
      return null;
    }

    return {
      customerId: input.item.customerId,
      productId: input.item.productId,
      quantity: input.item.quantity,
      sourceMode: "supplier_direct",
      status: "delivered",
      supplierId: input.supplierId,
    };
  }

  if (input.item.destinationType === "customer_prepacked") {
    if (input.status !== "arrived" && input.status !== "closed") {
      return null;
    }

    return {
      customerId: input.item.customerId,
      productId: input.item.productId,
      quantity: input.item.quantity,
      sourceMode: "supplier_prepacked",
      status: "ready_for_delivery",
      supplierId: input.supplierId,
    };
  }

  return null;
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

function ensurePurchaseItemIdsBelongToPurchase(input: {
  existingItemIds: string[];
  items: SupplierPurchaseItemMutationInput[];
}) {
  const existingItemIds = new Set(input.existingItemIds);
  const nextItemIds = new Set<string>();

  for (const item of input.items) {
    if (!item.id) {
      continue;
    }

    if (!existingItemIds.has(item.id)) {
      throw new Error("One or more supplier purchase items can no longer be updated");
    }

    if (nextItemIds.has(item.id)) {
      throw new Error("Duplicate supplier purchase items are not allowed");
    }

    nextItemIds.add(item.id);
  }
}

async function ensureGeneratedSalesLinesCanBeResynced(input: {
  currentPurchase: { status: string; supplierId: string };
  existingItems: Awaited<ReturnType<typeof getSupplierPurchaseItems>>;
  nextPurchase: { status: string; supplierId: string };
  nextItems: SupplierPurchaseItemMutationInput[];
}) {
  const generatedSalesLines = await getSalesLinesBySourceSupplierPurchaseItemIds(
    input.existingItems.map((item) => item.id),
  );

  if (generatedSalesLines.length === 0) {
    return;
  }

  const linkedDeliveryItems = await getActiveDeliveryItemsBySalesLineIds({
    salesLineIds: generatedSalesLines.map((salesLine) => salesLine.id),
  });

  if (linkedDeliveryItems.length === 0) {
    return;
  }

  const generatedSalesLineIdsWithDeliveries = new Set(
    linkedDeliveryItems.map((item) => item.salesLineId),
  );
  const currentItemStateById = new Map(
    input.existingItems.map((item) => [
      item.id,
      buildGeneratedSupplierPurchaseItemState({
        item,
        status: input.currentPurchase.status,
        supplierId: input.currentPurchase.supplierId,
      }),
    ]),
  );
  const nextItemStateById = new Map(
    input.nextItems
      .filter((item): item is SupplierPurchaseItemMutationInput & { id: string } => Boolean(item.id))
      .map((item) => [
        item.id,
        buildGeneratedSupplierPurchaseItemState({
          item: {
            id: item.id,
            customerId: item.customerId,
            destinationType: item.destinationType,
            productId: item.productId,
            quantity: item.quantity,
          },
          status: input.nextPurchase.status,
          supplierId: input.nextPurchase.supplierId,
        }),
      ]),
  );

  for (const generatedSalesLine of generatedSalesLines) {
    if (!generatedSalesLineIdsWithDeliveries.has(generatedSalesLine.id)) {
      continue;
    }

    const sourceItemId = generatedSalesLine.sourceSupplierPurchaseItemId;

    if (!sourceItemId) {
      continue;
    }

    const currentState = currentItemStateById.get(sourceItemId);
    const nextState = nextItemStateById.get(sourceItemId);

    if (!currentState || !nextState) {
      throw new Error(
        "Supplier purchase items already linked to deliveries cannot be removed or moved out of fulfillment",
      );
    }

    if (
      currentState.customerId !== nextState.customerId ||
      currentState.productId !== nextState.productId ||
      currentState.quantity !== nextState.quantity ||
      currentState.sourceMode !== nextState.sourceMode ||
      currentState.supplierId !== nextState.supplierId
    ) {
      throw new Error(
        "Supplier purchase items already linked to deliveries cannot change customer, product, quantity, supplier, or fulfillment mode",
      );
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

  const createdSupplierPurchase = await insertSupplierPurchase({
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

  if (createdSupplierPurchase.affectedSalesLineIds.length > 0) {
    await markInvoicesNeedsReviewBySources({
      salesLineIds: createdSupplierPurchase.affectedSalesLineIds,
    });
  }

  for (const customerId of createdSupplierPurchase.deliveredSalesLineCustomerIds) {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId,
      eventDate: parseSupplierPurchaseDate(normalizedInput.purchaseDate),
    });
  }

  return createdSupplierPurchase.supplierPurchase;
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

  const existingItems = await getSupplierPurchaseItems(input.id);

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
  ensurePurchaseItemIdsBelongToPurchase({
    existingItemIds: existingItems.map((item) => item.id),
    items: normalizedInput.items,
  });
  await ensureGeneratedSalesLinesCanBeResynced({
    currentPurchase: {
      status: supplierPurchase.status,
      supplierId: supplierPurchase.supplierId,
    },
    existingItems,
    nextPurchase: {
      status: normalizedInput.status,
      supplierId: normalizedInput.supplierId,
    },
    nextItems: normalizedInput.items,
  });

  const updatedSupplierPurchase = await updateSupplierPurchase(input.id, {
    purchase: {
      supplierId: normalizedInput.supplierId,
      purchaseDate: normalizedInput.purchaseDate,
      referenceNumber: normalizedInput.referenceNumber,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
    },
    items: normalizedInput.items,
  });

  if (updatedSupplierPurchase.affectedSalesLineIds.length > 0) {
    await markInvoicesNeedsReviewBySources({
      salesLineIds: updatedSupplierPurchase.affectedSalesLineIds,
    });
  }

  for (const customerId of updatedSupplierPurchase.deliveredSalesLineCustomerIds) {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId,
      eventDate: parseSupplierPurchaseDate(normalizedInput.purchaseDate),
    });
  }

  return updatedSupplierPurchase.supplierPurchase;
}

export async function deleteSupplierPurchaseService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "supplier_purchases");

  const supplierPurchase = await getSupplierPurchase(input.id);

  if (!supplierPurchase) {
    throw new Error("Supplier purchase not found");
  }

  const existingItems = await getSupplierPurchaseItems(input.id);
  const generatedSalesLines = await getSalesLinesBySourceSupplierPurchaseItemIds(
    existingItems.map((item) => item.id),
  );

  if (generatedSalesLines.length > 0) {
    const linkedDeliveryItems = await getActiveDeliveryItemsBySalesLineIds({
      salesLineIds: generatedSalesLines.map((salesLine) => salesLine.id),
    });

    if (linkedDeliveryItems.length > 0) {
      throw new Error(
        "Supplier purchases with customer lines already linked to deliveries cannot be deleted",
      );
    }
  }

  const deletedSupplierPurchase = await deleteSupplierPurchase(input.id);

  if (deletedSupplierPurchase.affectedSalesLineIds.length > 0) {
    await markInvoicesNeedsReviewBySources({
      salesLineIds: deletedSupplierPurchase.affectedSalesLineIds,
    });
  }

  return deletedSupplierPurchase.supplierPurchase;
}
