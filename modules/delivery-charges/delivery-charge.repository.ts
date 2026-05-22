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
import { accountEntries, accounts, customers, deliveries, deliveryCharges } from "@/db/schema";
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
  accountId: string | null;
  createdBy: string;
  notes: string | null;
};

type DeliveryChargeAccountEntryInput = {
  accountId: string;
  amount: number;
  chargeId: string;
  createdBy: string;
  description: string;
  entryType: "delivery_charge" | "delivery_charge_reversal";
  occurredAt: Date;
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
      accountName: accounts.name,
    })
    .from(deliveryCharges)
    .innerJoin(deliveries, eq(deliveryCharges.deliveryId, deliveries.id))
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .leftJoin(accounts, eq(deliveryCharges.accountId, accounts.id));
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
  return db.transaction(async (tx) => {
    const [deliveryCharge] = await tx
      .insert(deliveryCharges)
      .values({
        accountId: input.accountId,
        amount: input.amount,
        billToCustomer: input.billToCustomer,
        chargeType: input.chargeType,
        deliveryId: input.deliveryId,
        description: input.description,
        notes: input.notes,
      })
      .returning();

    if (!deliveryCharge.accountId) {
      return deliveryCharge;
    }

    const accountEntry = await insertDeliveryChargeAccountEntry(tx, {
      accountId: deliveryCharge.accountId,
      amount: deliveryCharge.amount,
      chargeId: deliveryCharge.id,
      createdBy: input.createdBy,
      description: deliveryCharge.description,
      entryType: "delivery_charge",
      occurredAt: new Date(),
    });

    const [updatedDeliveryCharge] = await tx
      .update(deliveryCharges)
      .set({ accountEntryId: accountEntry.id })
      .where(eq(deliveryCharges.id, deliveryCharge.id))
      .returning();

    return updatedDeliveryCharge;
  });
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
  if (input.accountId !== undefined) updateData.accountId = input.accountId;
  if (input.notes !== undefined) updateData.notes = input.notes;

  return db.transaction(async (tx) => {
    const [existingDeliveryCharge] = await tx
      .select()
      .from(deliveryCharges)
      .where(and(eq(deliveryCharges.id, id), isNull(deliveryCharges.deletedAt)));

    if (!existingDeliveryCharge) {
      return undefined;
    }

    const [deliveryCharge] = await tx
      .update(deliveryCharges)
      .set(updateData)
      .where(eq(deliveryCharges.id, id))
      .returning();

    const accountImpactChanged =
      existingDeliveryCharge.accountId !== deliveryCharge.accountId ||
      existingDeliveryCharge.amount !== deliveryCharge.amount;

    if (!accountImpactChanged) {
      return deliveryCharge;
    }

    if (existingDeliveryCharge.accountId) {
      await insertDeliveryChargeAccountEntry(tx, {
        accountId: existingDeliveryCharge.accountId,
        amount: -existingDeliveryCharge.amount,
        chargeId: existingDeliveryCharge.id,
        createdBy: input.createdBy ?? "",
        description: `Reverse ${existingDeliveryCharge.description}`,
        entryType: "delivery_charge_reversal",
        occurredAt: new Date(),
      });
    }

    if (!deliveryCharge.accountId) {
      const [updatedDeliveryCharge] = await tx
        .update(deliveryCharges)
        .set({ accountEntryId: null })
        .where(eq(deliveryCharges.id, deliveryCharge.id))
        .returning();

      return updatedDeliveryCharge;
    }

    const accountEntry = await insertDeliveryChargeAccountEntry(tx, {
      accountId: deliveryCharge.accountId,
      amount: deliveryCharge.amount,
      chargeId: deliveryCharge.id,
      createdBy: input.createdBy ?? "",
      description: deliveryCharge.description,
      entryType: "delivery_charge",
      occurredAt: new Date(),
    });

    const [updatedDeliveryCharge] = await tx
      .update(deliveryCharges)
      .set({ accountEntryId: accountEntry.id })
      .where(eq(deliveryCharges.id, deliveryCharge.id))
      .returning();

    return updatedDeliveryCharge;
  });
}

export async function softDeleteDeliveryCharge(input: {
  createdBy: string;
  id: string;
}) {
  return db.transaction(async (tx) => {
    const [existingDeliveryCharge] = await tx
      .select()
      .from(deliveryCharges)
      .where(and(eq(deliveryCharges.id, input.id), isNull(deliveryCharges.deletedAt)));

    if (!existingDeliveryCharge) {
      return undefined;
    }

    const [deliveryCharge] = await tx
      .update(deliveryCharges)
      .set({ deletedAt: new Date() })
      .where(and(eq(deliveryCharges.id, input.id), isNull(deliveryCharges.deletedAt)))
      .returning();

    if (existingDeliveryCharge.accountId) {
      await insertDeliveryChargeAccountEntry(tx, {
        accountId: existingDeliveryCharge.accountId,
        amount: -existingDeliveryCharge.amount,
        chargeId: existingDeliveryCharge.id,
        createdBy: input.createdBy,
        description: `Reverse ${existingDeliveryCharge.description}`,
        entryType: "delivery_charge_reversal",
        occurredAt: new Date(),
      });
    }

    return deliveryCharge;
  });
}

async function insertDeliveryChargeAccountEntry(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: DeliveryChargeAccountEntryInput,
) {
  const [accountEntry] = await tx
    .insert(accountEntries)
    .values({
      accountId: input.accountId,
      amountDelta: -input.amount,
      createdBy: input.createdBy,
      description: input.description,
      entryType: input.entryType,
      occurredAt: input.occurredAt,
      sourceId: input.chargeId,
      sourceType: "delivery_charge",
    })
    .returning();

  return accountEntry;
}
