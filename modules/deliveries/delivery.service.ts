import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import {
  markInvoicesNeedsReviewBySources,
  markInvoicesNeedsReviewForCustomerDate,
} from "@/modules/invoices/invoice.service";
import { getProduct } from "@/modules/products/product.repository";
import { getSalesLine } from "@/modules/sales-lines/sales-line.repository";
import { getSupplier } from "@/modules/suppliers/supplier.repository";
import { getDeliveryType } from "@/modules/delivery-types/delivery-type.repository";
import {
  getActiveDeliveryItemsBySalesLineIds,
  getAllDeliveries,
  getDelivery,
  getDeliveryCount,
  getDeliveryItems,
  getPaginatedDeliveries,
  insertDelivery,
  softDeleteDelivery,
  updateDelivery,
} from "./delivery.repository";
import {
  Delivery,
  DeliveryDetail,
  DeliveryListInput,
  DeliverySelectOption,
} from "./delivery.types";
import { DeliverySortBySchema } from "./delivery.schema";

type DeliveryItemMutationInput =
  | {
      itemMode: "existing";
      salesLineId: string;
      notes: string | null;
    }
  | {
      itemMode: "direct";
      salesLineId: string | null;
      productId: string;
      supplierId: string | null;
      quantity: number;
      unitSellPrice: number | null;
      sourceMode: string;
      notes: string | null;
    };

type DeliveryMutationInput = {
  customerId: string;
  deliveredAt: Date | null;
  recordedAt: Date;
  deliveredBy: string | null;
  deliveryTypeId: string | null;
  status: string;
  notes: string | null;
  items: DeliveryItemMutationInput[];
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeDeliveryInput(input: DeliveryMutationInput) {
  return {
    customerId: input.customerId,
    deliveredAt: input.deliveredAt,
    recordedAt: input.recordedAt,
    deliveredBy: normalizeOptionalText(input.deliveredBy),
    deliveryTypeId: normalizeOptionalText(input.deliveryTypeId),
    status: input.status,
    notes: normalizeOptionalText(input.notes),
    items: input.items.map((item) => ({
      ...(item.itemMode === "existing"
        ? {
            itemMode: "existing" as const,
            salesLineId: item.salesLineId,
            notes: normalizeOptionalText(item.notes),
          }
        : {
            itemMode: "direct" as const,
            salesLineId: item.salesLineId,
            productId: item.productId,
            supplierId: normalizeOptionalText(item.supplierId),
            quantity: item.quantity,
            unitSellPrice: item.unitSellPrice,
            sourceMode: item.sourceMode,
            notes: normalizeOptionalText(item.notes),
          }),
    })),
  };
}

function getDeliveryEventDate(input: {
  deliveredAt: Date | null;
  recordedAt: Date;
}) {
  return input.deliveredAt ?? input.recordedAt;
}

async function ensureDeliveryTypeExists(deliveryTypeId: string | null) {
  if (!deliveryTypeId) {
    return;
  }

  const deliveryType = await getDeliveryType(deliveryTypeId);

  if (!deliveryType) {
    throw new Error("Delivery type not found");
  }
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

async function ensureSalesLinesBelongToCustomer(input: {
  customerId: string;
  currentDeliverySalesLineIds?: string[];
  salesLineIds: string[];
}) {
  const currentDeliverySalesLineIds = new Set(input.currentDeliverySalesLineIds ?? []);

  for (const salesLineId of input.salesLineIds) {
    const salesLine = await getSalesLine(salesLineId);

    if (!salesLine) {
      throw new Error("One or more sales lines no longer exist");
    }

    if (salesLine.customerId !== input.customerId) {
      throw new Error("All sales lines must belong to the selected customer");
    }

    if (salesLine.status === "cancelled") {
      throw new Error("Cancelled sales lines cannot be delivered");
    }

    if (
      salesLine.status === "delivered" &&
      !currentDeliverySalesLineIds.has(salesLine.id)
    ) {
      throw new Error("Delivered sales lines must be edited from their existing delivery");
    }
  }
}

async function ensureDirectItemsAreValid(
  input: {
    currentDeliveryId?: string;
    items: Extract<DeliveryItemMutationInput, { itemMode: "direct" }>[];
  },
) {
  for (const item of input.items) {
    const product = await ensureProductExists(item.productId);

    await ensureSupplierExists(item.supplierId);

    if (
      (item.sourceMode === "supplier_direct" ||
        item.sourceMode === "supplier_prepacked") &&
      !item.supplierId
    ) {
      throw new Error("Supplier is required for supplier delivery items");
    }

    if (
      item.supplierId &&
      product.supplierId &&
      item.supplierId !== product.supplierId
    ) {
      throw new Error(`Product ${product.name} belongs to a different supplier`);
    }

    if (item.salesLineId) {
      const salesLine = await getSalesLine(item.salesLineId);

      if (!salesLine) {
        throw new Error("One or more direct delivery sales lines no longer exist");
      }

      if (!input.currentDeliveryId || salesLine.sourceDeliveryId !== input.currentDeliveryId) {
        throw new Error("Direct delivery items can only update sales lines created by this delivery");
      }
    }
  }
}

async function ensureSalesLinesAreUnassigned(input: {
  excludeDeliveryId?: string;
  salesLineIds: string[];
}) {
  const linkedItems = await getActiveDeliveryItemsBySalesLineIds({
    excludeDeliveryId: input.excludeDeliveryId,
    salesLineIds: input.salesLineIds,
  });

  if (linkedItems.length > 0) {
    throw new Error("One or more sales lines are already linked to another delivery");
  }
}

export async function getDeliveriesService(
  input: DeliveryListInput = {},
): Promise<PaginatedResult<Delivery>> {
  const auth = await getAuthContext();

  await auth.require("view", "deliveries");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: DeliverySortBySchema,
    defaultSortBy: "recordedAt",
    defaultSortOrder: "desc",
  });
  const total = await getDeliveryCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedDeliveries({
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

export async function getDeliveryService(input: { id: string }): Promise<DeliveryDetail | null> {
  const auth = await getAuthContext();

  await auth.require("view", "deliveries");

  const delivery = await getDelivery(input.id);

  if (!delivery) {
    return null;
  }

  const items = await getDeliveryItems(input.id);

  return {
    ...delivery,
    items,
  };
}

export async function getAllDeliveriesService(): Promise<DeliverySelectOption[]> {
  const auth = await getAuthContext();

  await auth.require("view", "deliveries");

  return getAllDeliveries();
}

export async function createDeliveryService(input: DeliveryMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "deliveries");

  const normalizedInput = normalizeDeliveryInput(input);
  const existingItems = normalizedInput.items.filter(
    (item): item is Extract<DeliveryItemMutationInput, { itemMode: "existing" }> =>
      item.itemMode === "existing",
  );
  const directItems = normalizedInput.items.filter(
    (item): item is Extract<DeliveryItemMutationInput, { itemMode: "direct" }> =>
      item.itemMode === "direct",
  );

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureDeliveryTypeExists(normalizedInput.deliveryTypeId);
  await ensureSalesLinesBelongToCustomer({
    customerId: normalizedInput.customerId,
    salesLineIds: existingItems.map((item) => item.salesLineId),
  });
  await ensureSalesLinesAreUnassigned({
    salesLineIds: existingItems.map((item) => item.salesLineId),
  });
  await ensureDirectItemsAreValid({
    items: directItems,
  });

  const createdDelivery = await insertDelivery({
    delivery: {
      customerId: normalizedInput.customerId,
      deliveredAt: normalizedInput.deliveredAt,
      recordedAt: normalizedInput.recordedAt,
      deliveredBy: normalizedInput.deliveredBy,
      deliveryTypeId: normalizedInput.deliveryTypeId,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
      createdBy: auth.user.id,
    },
    items: normalizedInput.items,
  });

  if (normalizedInput.status === "delivered") {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId: normalizedInput.customerId,
      eventDate: getDeliveryEventDate({
        deliveredAt: normalizedInput.deliveredAt,
        recordedAt: normalizedInput.recordedAt,
      }),
    });
  }

  return createdDelivery;
}

export async function updateDeliveryService(
  input: DeliveryMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "deliveries");

  const delivery = await getDelivery(input.id);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const existingItems = await getDeliveryItems(input.id);
  const existingSalesLineIds = existingItems.map((item) => item.salesLineId);

  const normalizedInput = normalizeDeliveryInput(input);
  const linkedExistingItems = normalizedInput.items.filter(
    (item): item is Extract<DeliveryItemMutationInput, { itemMode: "existing" }> =>
      item.itemMode === "existing",
  );
  const directItems = normalizedInput.items.filter(
    (item): item is Extract<DeliveryItemMutationInput, { itemMode: "direct" }> =>
      item.itemMode === "direct",
  );

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureDeliveryTypeExists(normalizedInput.deliveryTypeId);
  await ensureSalesLinesBelongToCustomer({
    customerId: normalizedInput.customerId,
    currentDeliverySalesLineIds: existingSalesLineIds,
    salesLineIds: linkedExistingItems.map((item) => item.salesLineId),
  });
  await ensureSalesLinesAreUnassigned({
    excludeDeliveryId: input.id,
    salesLineIds: linkedExistingItems.map((item) => item.salesLineId),
  });
  await ensureDirectItemsAreValid({
    currentDeliveryId: input.id,
    items: directItems,
  });

  const updatedDelivery = await updateDelivery(input.id, {
    delivery: {
      customerId: normalizedInput.customerId,
      deliveredAt: normalizedInput.deliveredAt,
      recordedAt: normalizedInput.recordedAt,
      deliveredBy: normalizedInput.deliveredBy,
      deliveryTypeId: normalizedInput.deliveryTypeId,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
    },
    items: normalizedInput.items,
  });

  await markInvoicesNeedsReviewBySources({
    salesLineIds: Array.from(
      new Set([
        ...existingSalesLineIds,
        ...normalizedInput.items
          .map((item) => item.salesLineId)
          .filter((salesLineId): salesLineId is string => salesLineId !== null),
      ]),
    ),
  });

  if (normalizedInput.status === "delivered") {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId: normalizedInput.customerId,
      eventDate: getDeliveryEventDate({
        deliveredAt: normalizedInput.deliveredAt,
        recordedAt: normalizedInput.recordedAt,
      }),
    });
  }

  return updatedDelivery;
}

export async function deleteDeliveryService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "deliveries");

  const delivery = await getDelivery(input.id);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const existingItems = await getDeliveryItems(input.id);
  const deletedDelivery = await softDeleteDelivery(input.id);

  await markInvoicesNeedsReviewBySources({
    salesLineIds: existingItems.map((item) => item.salesLineId),
  });

  return deletedDelivery;
}
