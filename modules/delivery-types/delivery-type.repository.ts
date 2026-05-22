import { and, asc, count, desc, eq, getTableColumns, ilike, ne, or } from "drizzle-orm";
import { accounts, deliveryTypes } from "@/db/schema";
import { db } from "@/db/drizzle";
import {
  DeliveryTypeSortBy,
  DeliveryTypeSortOrder,
} from "./delivery-type.types";

type DeliveryTypeMutationInput = {
  name: string;
  defaultChargeType: string | null;
  defaultBillToCustomer: boolean;
  defaultAccountId: string | null;
  requiresManualAmount: boolean;
  active: boolean;
  notes: string | null;
};

function getDeliveryTypeOrderBy(
  sortBy: DeliveryTypeSortBy,
  sortOrder: DeliveryTypeSortOrder,
) {
  const columns = {
    name: deliveryTypes.name,
    defaultChargeType: deliveryTypes.defaultChargeType,
    active: deliveryTypes.active,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildDeliveryTypeSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(deliveryTypes.name, `%${query}%`),
    ilike(deliveryTypes.defaultChargeType, `%${query}%`),
    ilike(deliveryTypes.notes, `%${query}%`),
  );
}

function buildBaseDeliveryTypeQuery() {
  const deliveryTypeColumns = getTableColumns(deliveryTypes);

  return db
    .select({
      ...deliveryTypeColumns,
      defaultAccountName: accounts.name,
    })
    .from(deliveryTypes)
    .leftJoin(accounts, eq(deliveryTypes.defaultAccountId, accounts.id));
}

export async function getPaginatedDeliveryTypes(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: DeliveryTypeSortBy;
  sortOrder: DeliveryTypeSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildDeliveryTypeSearchFilter(query);
  const baseQuery = filter
    ? buildBaseDeliveryTypeQuery().where(filter)
    : buildBaseDeliveryTypeQuery();

  return baseQuery
    .orderBy(getDeliveryTypeOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getDeliveryTypeCount(query: string) {
  const filter = buildDeliveryTypeSearchFilter(query);
  const baseQuery = filter
    ? db.select({ count: count() }).from(deliveryTypes).where(filter)
    : db.select({ count: count() }).from(deliveryTypes);
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getDeliveryType(id: string) {
  const [deliveryType] = await buildBaseDeliveryTypeQuery().where(
    eq(deliveryTypes.id, id),
  );

  return deliveryType;
}

export async function getAllDeliveryTypes() {
  return db
    .select({
      id: deliveryTypes.id,
      name: deliveryTypes.name,
      defaultChargeType: deliveryTypes.defaultChargeType,
      defaultBillToCustomer: deliveryTypes.defaultBillToCustomer,
      defaultAccountId: deliveryTypes.defaultAccountId,
      requiresManualAmount: deliveryTypes.requiresManualAmount,
      active: deliveryTypes.active,
    })
    .from(deliveryTypes)
    .orderBy(asc(deliveryTypes.name));
}

export async function getDeliveryTypeByName(name: string, excludeId?: string) {
  const [deliveryType] = await db
    .select()
    .from(deliveryTypes)
    .where(
      excludeId
        ? and(eq(deliveryTypes.name, name), ne(deliveryTypes.id, excludeId))
        : eq(deliveryTypes.name, name),
    );

  return deliveryType;
}

export async function insertDeliveryType(input: DeliveryTypeMutationInput) {
  const [deliveryType] = await db.insert(deliveryTypes).values(input).returning();

  return deliveryType;
}

export async function updateDeliveryType(
  id: string,
  input: Partial<DeliveryTypeMutationInput>,
) {
  const [deliveryType] = await db
    .update(deliveryTypes)
    .set(input)
    .where(eq(deliveryTypes.id, id))
    .returning();

  return deliveryType;
}

export async function deleteDeliveryType(id: string) {
  const [deliveryType] = await db
    .delete(deliveryTypes)
    .where(eq(deliveryTypes.id, id))
    .returning();

  return deliveryType;
}
