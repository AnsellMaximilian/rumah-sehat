import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  customers,
  deliveries,
  deliveryItems,
  products,
  salesLines,
  user,
} from "@/db/schema";
import { syncDeliveryOutStockMovements } from "@/modules/stock-movements/stock-movement.repository";
import { DeliverySortBy, DeliverySortOrder } from "./delivery.types";

type DeliveryMutationInput = {
  customerId: string;
  deliveredAt: Date | null;
  recordedAt: Date;
  deliveredBy: string | null;
  status: string;
  notes: string | null;
  createdBy: string;
};

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

function getDeliveryOrderBy(sortBy: DeliverySortBy, sortOrder: DeliverySortOrder) {
  const columns = {
    createdAt: deliveries.createdAt,
    recordedAt: deliveries.recordedAt,
    deliveredAt: deliveries.deliveredAt,
    customerName: customers.name,
    status: deliveries.status,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildDeliverySearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(customers.customerCode, `%${query}%`),
    ilike(customers.name, `%${query}%`),
    ilike(deliveries.status, `%${query}%`),
    ilike(deliveries.deliveredBy, `%${query}%`),
    ilike(deliveries.notes, `%${query}%`),
  );
}

function buildBaseDeliveryQuery() {
  const deliveryColumns = getTableColumns(deliveries);

  return db
    .select({
      ...deliveryColumns,
      customerName: customers.name,
      customerCode: customers.customerCode,
      createdByName: user.name,
    })
    .from(deliveries)
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .leftJoin(user, eq(deliveries.createdBy, user.id));
}

function buildBaseDeliveryItemQuery() {
  const itemColumns = getTableColumns(deliveryItems);

  return db
    .select({
      ...itemColumns,
      salesLineSourceDeliveryId: salesLines.sourceDeliveryId,
      salesLineSupplierId: salesLines.supplierId,
      salesLineCustomerId: salesLines.customerId,
      salesLineStatus: salesLines.status,
      productName: products.name,
      productCode: products.productCode,
    })
    .from(deliveryItems)
    .leftJoin(salesLines, eq(deliveryItems.salesLineId, salesLines.id))
    .leftJoin(products, eq(deliveryItems.productId, products.id));
}

export async function getPaginatedDeliveries(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: DeliverySortBy;
  sortOrder: DeliverySortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildDeliverySearchFilter(query);
  const baseQuery = buildBaseDeliveryQuery().where(
    filter ? and(isNull(deliveries.deletedAt), filter) : isNull(deliveries.deletedAt),
  );

  return baseQuery
    .orderBy(getDeliveryOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getDeliveryCount(query: string) {
  const filter = buildDeliverySearchFilter(query);
  const baseQuery = db
    .select({ count: count() })
    .from(deliveries)
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .where(
      filter ? and(isNull(deliveries.deletedAt), filter) : isNull(deliveries.deletedAt),
    );
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getDelivery(id: string) {
  const [delivery] = await buildBaseDeliveryQuery().where(
    and(eq(deliveries.id, id), isNull(deliveries.deletedAt)),
  );

  return delivery;
}

export async function getDeliveryItems(deliveryId: string) {
  return buildBaseDeliveryItemQuery()
    .where(
      and(
        eq(deliveryItems.deliveryId, deliveryId),
        isNull(deliveryItems.deletedAt),
      ),
    )
    .orderBy(asc(deliveryItems.createdAt));
}

export async function getAllDeliveries() {
  return db
    .select({
      id: deliveries.id,
      customerId: deliveries.customerId,
      customerCode: customers.customerCode,
      customerName: customers.name,
      recordedAt: deliveries.recordedAt,
      status: deliveries.status,
    })
    .from(deliveries)
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .where(isNull(deliveries.deletedAt))
    .orderBy(desc(deliveries.recordedAt), asc(customers.customerCode));
}

export async function getActiveDeliveryItemsBySalesLineIds(input: {
  excludeDeliveryId?: string;
  salesLineIds: string[];
}) {
  if (input.salesLineIds.length === 0) {
    return [];
  }

  const filters = [
    inArray(deliveryItems.salesLineId, input.salesLineIds),
    isNull(deliveryItems.deletedAt),
    isNull(deliveries.deletedAt),
  ];

  if (input.excludeDeliveryId) {
    filters.push(ne(deliveries.id, input.excludeDeliveryId));
  }

  return db
    .select({
      deliveryId: deliveries.id,
      deliveryStatus: deliveries.status,
      salesLineId: deliveryItems.salesLineId,
    })
    .from(deliveryItems)
    .innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
    .where(and(...filters));
}

async function setSalesLineStatuses(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  salesLineIds: string[],
  status: string,
) {
  if (salesLineIds.length === 0) {
    return;
  }

  await tx
    .update(salesLines)
    .set({ status })
    .where(
      and(
        inArray(salesLines.id, salesLineIds),
        isNull(salesLines.deletedAt),
      ),
    );
}

async function softDeleteSalesLines(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  salesLineIds: string[],
) {
  if (salesLineIds.length === 0) {
    return;
  }

  await tx
    .update(salesLines)
    .set({ deletedAt: new Date() })
    .where(
      and(
        inArray(salesLines.id, salesLineIds),
        isNull(salesLines.deletedAt),
      ),
    );
}

function resolveDirectSalesLineStatus(input: {
  deliveryStatus: string;
  sourceMode: string;
}) {
  if (input.deliveryStatus === "delivered") {
    return "delivered";
  }

  if (input.sourceMode === "supplier_direct") {
    return "pending";
  }

  return "ready_for_delivery";
}

async function resolveDeliverySalesLines(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    customerId: string;
    deliveryId: string;
    deliveryStatus: string;
    items: DeliveryItemMutationInput[];
  },
) {
  const deliverySalesLines = [];

  for (const item of input.items) {
    if (item.itemMode === "existing") {
      const [salesLine] = await tx
        .select()
        .from(salesLines)
        .where(and(eq(salesLines.id, item.salesLineId), isNull(salesLines.deletedAt)));

      if (!salesLine) {
        throw new Error("One or more sales lines no longer exist");
      }

      deliverySalesLines.push({
        notes: item.notes,
        salesLine,
      });
      continue;
    }

    const salesLineStatus = resolveDirectSalesLineStatus({
      deliveryStatus: input.deliveryStatus,
      sourceMode: item.sourceMode,
    });

    if (item.salesLineId) {
      const [salesLine] = await tx
        .update(salesLines)
        .set({
          customerId: input.customerId,
          productId: item.productId,
          quantity: item.quantity,
          unitSellPrice: item.unitSellPrice,
          sourceMode: item.sourceMode,
          sourceDeliveryId: input.deliveryId,
          supplierId: item.supplierId,
          status: salesLineStatus,
          notes: item.notes,
        })
        .where(
          and(
            eq(salesLines.id, item.salesLineId),
            eq(salesLines.sourceDeliveryId, input.deliveryId),
            isNull(salesLines.deletedAt),
          ),
        )
        .returning();

      if (!salesLine) {
        throw new Error("One or more direct delivery items can no longer be updated");
      }

      deliverySalesLines.push({
        notes: item.notes,
        salesLine,
      });
      continue;
    }

    const [salesLine] = await tx
      .insert(salesLines)
      .values({
        customerId: input.customerId,
        productId: item.productId,
        quantity: item.quantity,
        unitSellPrice: item.unitSellPrice,
        sourceMode: item.sourceMode,
        sourceDeliveryId: input.deliveryId,
        supplierId: item.supplierId,
        status: salesLineStatus,
        notes: item.notes,
      })
      .returning();

    deliverySalesLines.push({
      notes: item.notes,
      salesLine,
    });
  }

  return deliverySalesLines;
}

export async function insertDelivery(input: {
  delivery: DeliveryMutationInput;
  items: DeliveryItemMutationInput[];
}) {
  return db.transaction(async (tx) => {
    const [delivery] = await tx
      .insert(deliveries)
      .values(input.delivery)
      .returning();

    const linkedSalesLines = await resolveDeliverySalesLines(tx, {
      customerId: input.delivery.customerId,
      deliveryId: delivery.id,
      deliveryStatus: input.delivery.status,
      items: input.items,
    });

    const insertedItems = await tx.insert(deliveryItems).values(
      linkedSalesLines.map(({ salesLine, notes }) => {
        return {
          deliveryId: delivery.id,
          salesLineId: salesLine.id,
          productId: salesLine.productId,
          quantity: salesLine.quantity,
          unitSellPrice: salesLine.unitSellPrice,
          sourceMode: salesLine.sourceMode,
          notes,
        };
      }),
    ).returning();

    if (input.delivery.status === "delivered") {
      await setSalesLineStatuses(
        tx,
        linkedSalesLines.map(({ salesLine }) => salesLine.id),
        "delivered",
      );
      await syncDeliveryOutStockMovements({
        createdBy: input.delivery.createdBy,
        items: insertedItems.map((item) => ({
          notes: item.notes,
          occurredAt: input.delivery.deliveredAt ?? input.delivery.recordedAt,
          productId: item.productId,
          quantity: item.quantity,
          salesLineId: item.salesLineId,
          sourceMode: item.sourceMode,
        })),
        sourceSalesLineIds: insertedItems
          .filter((item) => item.sourceMode === "stock")
          .map((item) => item.salesLineId),
        tx,
      });
    }

    return delivery;
  });
}

export async function updateDelivery(
  id: string,
  input: {
    delivery: Omit<DeliveryMutationInput, "createdBy">;
    items: DeliveryItemMutationInput[];
  },
) {
  return db.transaction(async (tx) => {
    const [existingDelivery] = await tx
      .select({
        createdBy: deliveries.createdBy,
        deliveredAt: deliveries.deliveredAt,
        recordedAt: deliveries.recordedAt,
        status: deliveries.status,
      })
      .from(deliveries)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)));

    const previousItems = await tx
      .select({
        productId: deliveryItems.productId,
        salesLineId: deliveryItems.salesLineId,
        salesLineSourceDeliveryId: salesLines.sourceDeliveryId,
        sourceMode: deliveryItems.sourceMode,
      })
      .from(deliveryItems)
      .innerJoin(salesLines, eq(deliveryItems.salesLineId, salesLines.id))
      .where(
        and(
          eq(deliveryItems.deliveryId, id),
          isNull(deliveryItems.deletedAt),
        ),
      );

    const [delivery] = await tx
      .update(deliveries)
      .set(input.delivery)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)))
      .returning();

    await tx
      .delete(deliveryItems)
      .where(eq(deliveryItems.deliveryId, id));

    const linkedSalesLines = await resolveDeliverySalesLines(tx, {
      customerId: input.delivery.customerId,
      deliveryId: id,
      deliveryStatus: input.delivery.status,
      items: input.items,
    });

    const insertedItems = await tx.insert(deliveryItems).values(
      linkedSalesLines.map(({ salesLine, notes }) => {
        return {
          deliveryId: id,
          salesLineId: salesLine.id,
          productId: salesLine.productId,
          quantity: salesLine.quantity,
          unitSellPrice: salesLine.unitSellPrice,
          sourceMode: salesLine.sourceMode,
          notes,
        };
      }),
    ).returning();

    const nextSalesLineIds = linkedSalesLines.map(({ salesLine }) => salesLine.id);
    const previousExistingSalesLineIds = previousItems
      .filter((item) => item.salesLineSourceDeliveryId !== id)
      .map((item) => item.salesLineId);
    const removedSourceCreatedSalesLineIds = previousItems
      .filter(
        (item) =>
          item.salesLineSourceDeliveryId === id && !nextSalesLineIds.includes(item.salesLineId),
      )
      .map((item) => item.salesLineId);

    if (existingDelivery?.status === "delivered" && previousExistingSalesLineIds.length > 0) {
      await setSalesLineStatuses(tx, previousExistingSalesLineIds, "ready_for_delivery");
    }

    if (removedSourceCreatedSalesLineIds.length > 0) {
      await softDeleteSalesLines(tx, removedSourceCreatedSalesLineIds);
    }

    if (input.delivery.status === "delivered") {
      await setSalesLineStatuses(
        tx,
        nextSalesLineIds,
        "delivered",
      );
    }

    await syncDeliveryOutStockMovements({
      createdBy: existingDelivery?.createdBy ?? "",
      items: input.delivery.status === "delivered"
        ? insertedItems.map((item) => ({
            notes: item.notes,
            occurredAt: input.delivery.deliveredAt ?? input.delivery.recordedAt,
            productId: item.productId,
            quantity: item.quantity,
            salesLineId: item.salesLineId,
            sourceMode: item.sourceMode,
          }))
        : [],
      sourceSalesLineIds: Array.from(
        new Set([
          ...previousItems
            .filter((item) => item.sourceMode === "stock")
            .map((item) => item.salesLineId),
          ...insertedItems
            .filter((item) => item.sourceMode === "stock")
            .map((item) => item.salesLineId),
        ]),
      ),
      tx,
    });

    return delivery;
  });
}

export async function softDeleteDelivery(id: string) {
  return db.transaction(async (tx) => {
    const [existingDelivery] = await tx
      .select({
        createdBy: deliveries.createdBy,
        deliveredAt: deliveries.deliveredAt,
        recordedAt: deliveries.recordedAt,
        status: deliveries.status,
      })
      .from(deliveries)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)));

    const existingItems = await tx
      .select({
        productId: deliveryItems.productId,
        salesLineId: deliveryItems.salesLineId,
        salesLineSourceDeliveryId: salesLines.sourceDeliveryId,
        sourceMode: deliveryItems.sourceMode,
      })
      .from(deliveryItems)
      .innerJoin(salesLines, eq(deliveryItems.salesLineId, salesLines.id))
      .where(
        and(
          eq(deliveryItems.deliveryId, id),
          isNull(deliveryItems.deletedAt),
        ),
      );

    const sourceCreatedSalesLineIds = existingItems
      .filter((item) => item.salesLineSourceDeliveryId === id)
      .map((item) => item.salesLineId);
    const existingSalesLineIds = existingItems
      .filter((item) => item.salesLineSourceDeliveryId !== id)
      .map((item) => item.salesLineId);

    await tx
      .update(deliveryItems)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(deliveryItems.deliveryId, id),
          isNull(deliveryItems.deletedAt),
        ),
      );

    const [delivery] = await tx
      .update(deliveries)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)))
      .returning();

    if (existingDelivery?.status === "delivered" && existingSalesLineIds.length > 0) {
      await setSalesLineStatuses(tx, existingSalesLineIds, "ready_for_delivery");
    }

    if (sourceCreatedSalesLineIds.length > 0) {
      await softDeleteSalesLines(tx, sourceCreatedSalesLineIds);
    }

    await syncDeliveryOutStockMovements({
      createdBy: existingDelivery?.createdBy ?? "",
      items: [],
      sourceSalesLineIds: existingItems
        .filter((item) => item.sourceMode === "stock")
        .map((item) => item.salesLineId),
      tx,
    });

    return delivery;
  });
}
