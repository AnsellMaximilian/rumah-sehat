import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { getAccount } from "@/modules/accounts/account.repository";
import { getDelivery } from "@/modules/deliveries/delivery.repository";
import {
  logEntityCreated,
  logEntityDeleted,
  logEntityUpdated,
} from "@/modules/change-logs/change-log.service";
import {
  markInvoicesNeedsReviewBySources,
  markInvoicesNeedsReviewForCustomerDate,
} from "@/modules/invoices/invoice.service";
import {
  getDeliveryCharge,
  getDeliveryChargeCount,
  getDeliveryChargesByDelivery,
  getPaginatedDeliveryCharges,
  insertDeliveryCharge,
  softDeleteDeliveryCharge,
  updateDeliveryCharge,
} from "./delivery-charge.repository";
import {
  DeliveryCharge,
  DeliveryChargeListInput,
} from "./delivery-charge.types";
import { DeliveryChargeSortBySchema } from "./delivery-charge.schema";

type DeliveryChargeMutationInput = {
  deliveryId: string;
  chargeType: string;
  description: string;
  amount: number;
  billToCustomer: boolean;
  accountId: string | null;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeDeliveryChargeInput(input: DeliveryChargeMutationInput) {
  return {
    deliveryId: input.deliveryId,
    chargeType: input.chargeType,
    description: input.description.trim(),
    amount: input.amount,
    billToCustomer: input.billToCustomer,
    accountId: normalizeOptionalText(input.accountId),
    notes: normalizeOptionalText(input.notes),
  };
}

async function ensureDeliveryExists(deliveryId: string) {
  const delivery = await getDelivery(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  return delivery;
}

async function ensureAccountExists(accountId: string | null) {
  if (!accountId) {
    return null;
  }

  const account = await getAccount(accountId);

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

export async function getDeliveryChargesService(
  input: DeliveryChargeListInput = {},
): Promise<PaginatedResult<DeliveryCharge>> {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_charges");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: DeliveryChargeSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getDeliveryChargeCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedDeliveryCharges({
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

export async function getDeliveryChargeService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_charges");

  return getDeliveryCharge(input.id);
}

export async function getDeliveryChargesByDeliveryService(input: {
  deliveryId: string;
}) {
  const auth = await getAuthContext();

  await auth.require("view", "delivery_charges");

  return getDeliveryChargesByDelivery(input.deliveryId);
}

export async function createDeliveryChargeService(input: DeliveryChargeMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "delivery_charges");

  const normalizedInput = normalizeDeliveryChargeInput(input);

  const delivery = await ensureDeliveryExists(normalizedInput.deliveryId);
  await ensureAccountExists(normalizedInput.accountId);
  const createdDeliveryCharge = await insertDeliveryCharge({
    ...normalizedInput,
    createdBy: auth.user.id,
  });

  await logEntityCreated({
    changedBy: auth.user.id,
    entity: createdDeliveryCharge,
    entityId: createdDeliveryCharge.id,
    entityType: "delivery_charge",
  });

  if (normalizedInput.billToCustomer && delivery.status === "delivered") {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId: delivery.customerId,
      eventDate: delivery.deliveredAt ?? delivery.recordedAt,
    });
  }

  return createdDeliveryCharge;
}

export async function updateDeliveryChargeService(
  input: DeliveryChargeMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "delivery_charges");

  const deliveryCharge = await getDeliveryCharge(input.id);

  if (!deliveryCharge) {
    throw new Error("Delivery charge not found");
  }

  const normalizedInput = normalizeDeliveryChargeInput(input);

  const delivery = await ensureDeliveryExists(normalizedInput.deliveryId);
  await ensureAccountExists(normalizedInput.accountId);

  const updatedDeliveryCharge = await updateDeliveryCharge(input.id, {
    ...normalizedInput,
    createdBy: auth.user.id,
  });

  if (updatedDeliveryCharge) {
    await logEntityUpdated({
      after: updatedDeliveryCharge,
      before: deliveryCharge,
      changedBy: auth.user.id,
      entityId: input.id,
      entityType: "delivery_charge",
      fields: [
        "deliveryId",
        "chargeType",
        "description",
        "amount",
        "billToCustomer",
        "accountId",
        "notes",
      ],
    });
  }

  await markInvoicesNeedsReviewBySources({
    deliveryChargeIds: [input.id],
  });

  if (normalizedInput.billToCustomer && delivery.status === "delivered") {
    await markInvoicesNeedsReviewForCustomerDate({
      customerId: delivery.customerId,
      eventDate: delivery.deliveredAt ?? delivery.recordedAt,
    });
  }

  return updatedDeliveryCharge;
}

export async function deleteDeliveryChargeService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "delivery_charges");

  const deliveryCharge = await getDeliveryCharge(input.id);

  if (!deliveryCharge) {
    throw new Error("Delivery charge not found");
  }

  const deletedDeliveryCharge = await softDeleteDeliveryCharge({
    createdBy: auth.user.id,
    id: input.id,
  });

  if (deletedDeliveryCharge) {
    await logEntityDeleted({
      changedBy: auth.user.id,
      entity: deliveryCharge,
      entityId: input.id,
      entityType: "delivery_charge",
    });
  }

  await markInvoicesNeedsReviewBySources({
    deliveryChargeIds: [input.id],
  });

  return deletedDeliveryCharge;
}
