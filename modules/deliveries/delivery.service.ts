import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import { getSalesLine } from "@/modules/sales-lines/sales-line.repository";
import {
  getActiveDeliveryItemsBySalesLineIds,
  getDelivery,
  getDeliveryCount,
  getDeliveryItems,
  getPaginatedDeliveries,
  insertDelivery,
  softDeleteDelivery,
  updateDelivery,
} from "./delivery.repository";
import { Delivery, DeliveryDetail, DeliveryListInput } from "./delivery.types";
import { DeliverySortBySchema } from "./delivery.schema";

type DeliveryItemMutationInput = {
  salesLineId: string;
  notes: string | null;
};

type DeliveryMutationInput = {
  customerId: string;
  deliveredAt: Date | null;
  recordedAt: Date;
  deliveredBy: string | null;
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
    status: input.status,
    notes: normalizeOptionalText(input.notes),
    items: input.items.map((item) => ({
      salesLineId: item.salesLineId,
      notes: normalizeOptionalText(item.notes),
    })),
  };
}

async function ensureCustomerExists(customerId: string) {
  const customer = await getCustomer(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
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

export async function createDeliveryService(input: DeliveryMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "deliveries");

  const normalizedInput = normalizeDeliveryInput(input);

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureSalesLinesBelongToCustomer({
    customerId: normalizedInput.customerId,
    salesLineIds: normalizedInput.items.map((item) => item.salesLineId),
  });
  await ensureSalesLinesAreUnassigned({
    salesLineIds: normalizedInput.items.map((item) => item.salesLineId),
  });

  return insertDelivery({
    delivery: {
      customerId: normalizedInput.customerId,
      deliveredAt: normalizedInput.deliveredAt,
      recordedAt: normalizedInput.recordedAt,
      deliveredBy: normalizedInput.deliveredBy,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
      createdBy: auth.user.id,
    },
    items: normalizedInput.items,
  });
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

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureSalesLinesBelongToCustomer({
    customerId: normalizedInput.customerId,
    currentDeliverySalesLineIds: existingSalesLineIds,
    salesLineIds: normalizedInput.items.map((item) => item.salesLineId),
  });
  await ensureSalesLinesAreUnassigned({
    excludeDeliveryId: input.id,
    salesLineIds: normalizedInput.items.map((item) => item.salesLineId),
  });

  return updateDelivery(input.id, {
    delivery: {
      customerId: normalizedInput.customerId,
      deliveredAt: normalizedInput.deliveredAt,
      recordedAt: normalizedInput.recordedAt,
      deliveredBy: normalizedInput.deliveredBy,
      status: normalizedInput.status,
      notes: normalizedInput.notes,
    },
    items: normalizedInput.items,
  });
}

export async function deleteDeliveryService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "deliveries");

  const delivery = await getDelivery(input.id);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  return softDeleteDelivery(input.id);
}
