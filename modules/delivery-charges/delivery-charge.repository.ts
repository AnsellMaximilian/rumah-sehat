import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import { customers, deliveries, deliveryCharges } from "@/db/schema";
import {
  DeliveryChargeSortBy,
  DeliveryChargeSortOrder,
} from "./delivery-charge.types";

type DeliveryChargeMutationInput = {
  deliveryId: string;
  chargeType: string;
  description: string;
  amount: number;
  billToCustomer: boolean;
  notes: string | null;
};

function getDeliveryChargeOrderBy(
  sortBy: DeliveryChargeSortBy,
  sortOrder: DeliveryChargeSortOrder,
) {
  const columns = {
    createdAt: deliveryCharges.createdAt,
    deliveryRecordedAt: deliveries.recordedAt,
    customerName: customers.name,
    chargeType: deliveryCharges.chargeType,
    amount: deliveryCharges.amount,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildDeliveryChargeSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(customers.customerCode, `%${query}%`),
    ilike(customers.name, `%${query}%`),
    ilike(deliveryCharges.chargeType, `%${query}%`),
    ilike(deliveryCharges.description, `%${query}%`),
    ilike(deliveryCharges.notes, `%${query}%`),
  );
}

function buildBaseDeliveryChargeQuery() {
  const chargeColumns = getTableColumns(deliveryCharges);

  return db
    .select({
      ...chargeColumns,
      deliveryStatus: deliveries.status,
      deliveryRecordedAt: deliveries.recordedAt,
      customerId: customers.id,
      customerCode: customers.customerCode,
      customerName: customers.name,
    })
    .from(deliveryCharges)
    .innerJoin(deliveries, eq(deliveryCharges.deliveryId, deliveries.id))
    .leftJoin(customers, eq(deliveries.customerId, customers.id));
}

function buildActiveDeliveryChargeFilter(query?: string) {
  const searchFilter = query ? buildDeliveryChargeSearchFilter(query) : undefined;
  const activeFilter = and(
    isNull(deliveryCharges.deletedAt),
    isNull(deliveries.deletedAt),
  );

  if (!searchFilter) {
    return activeFilter;
  }

  return and(activeFilter, searchFilter);
}

export async function getPaginatedDeliveryCharges(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: DeliveryChargeSortBy;
  sortOrder: DeliveryChargeSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  return buildBaseDeliveryChargeQuery()
    .where(buildActiveDeliveryChargeFilter(query))
    .orderBy(getDeliveryChargeOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getDeliveryChargeCount(query: string) {
  const [{ count: countResult }] = await db
    .select({ count: count() })
    .from(deliveryCharges)
    .innerJoin(deliveries, eq(deliveryCharges.deliveryId, deliveries.id))
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .where(buildActiveDeliveryChargeFilter(query));

  return countResult;
}

export async function getDeliveryCharge(id: string) {
  const [deliveryCharge] = await buildBaseDeliveryChargeQuery().where(
    and(
      eq(deliveryCharges.id, id),
      isNull(deliveryCharges.deletedAt),
      isNull(deliveries.deletedAt),
    ),
  );

  return deliveryCharge;
}

export async function getDeliveryChargesByDelivery(deliveryId: string) {
  return buildBaseDeliveryChargeQuery()
    .where(
      and(
        eq(deliveryCharges.deliveryId, deliveryId),
        isNull(deliveryCharges.deletedAt),
        isNull(deliveries.deletedAt),
      ),
    )
    .orderBy(asc(deliveryCharges.createdAt));
}

export async function insertDeliveryCharge(input: DeliveryChargeMutationInput) {
  const [deliveryCharge] = await db
    .insert(deliveryCharges)
    .values(input)
    .returning();

  return deliveryCharge;
}

export async function updateDeliveryCharge(
  id: string,
  input: Partial<DeliveryChargeMutationInput>,
) {
  const updateData: Partial<DeliveryChargeMutationInput> = {};

  if (input.deliveryId !== undefined) updateData.deliveryId = input.deliveryId;
  if (input.chargeType !== undefined) updateData.chargeType = input.chargeType;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.billToCustomer !== undefined) {
    updateData.billToCustomer = input.billToCustomer;
  }
  if (input.notes !== undefined) updateData.notes = input.notes;

  const [deliveryCharge] = await db
    .update(deliveryCharges)
    .set(updateData)
    .where(eq(deliveryCharges.id, id))
    .returning();

  return deliveryCharge;
}

export async function softDeleteDeliveryCharge(id: string) {
  const [deliveryCharge] = await db
    .update(deliveryCharges)
    .set({ deletedAt: new Date() })
    .where(and(eq(deliveryCharges.id, id), isNull(deliveryCharges.deletedAt)))
    .returning();

  return deliveryCharge;
}
