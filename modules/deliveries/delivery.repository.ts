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

type DeliveryItemMutationInput = {
  salesLineId: string;
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

export async function insertDelivery(input: {
  delivery: DeliveryMutationInput;
  items: DeliveryItemMutationInput[];
}) {
  return db.transaction(async (tx) => {
    const [delivery] = await tx
      .insert(deliveries)
      .values(input.delivery)
      .returning();

    const linkedSalesLines = await tx
      .select()
      .from(salesLines)
      .where(
        and(
          inArray(
            salesLines.id,
            input.items.map((item) => item.salesLineId),
          ),
          isNull(salesLines.deletedAt),
        ),
      );

    await tx.insert(deliveryItems).values(
      input.items.map((item) => {
        const salesLine = linkedSalesLines.find((line) => line.id === item.salesLineId);

        if (!salesLine) {
          throw new Error("One or more sales lines no longer exist");
        }

        return {
          deliveryId: delivery.id,
          salesLineId: salesLine.id,
          productId: salesLine.productId,
          quantity: salesLine.quantity,
          unitSellPrice: salesLine.unitSellPrice,
          sourceMode: salesLine.sourceMode,
          notes: item.notes,
        };
      }),
    );

    if (input.delivery.status === "delivered") {
      await setSalesLineStatuses(
        tx,
        input.items.map((item) => item.salesLineId),
        "delivered",
      );
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
        status: deliveries.status,
      })
      .from(deliveries)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)));

    const previousItems = await tx
      .select({
        salesLineId: deliveryItems.salesLineId,
      })
      .from(deliveryItems)
      .where(
        and(
          eq(deliveryItems.deliveryId, id),
          isNull(deliveryItems.deletedAt),
        ),
      );

    const previousSalesLineIds = previousItems
      .map((item) => item.salesLineId);

    const [delivery] = await tx
      .update(deliveries)
      .set(input.delivery)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)))
      .returning();

    await tx
      .delete(deliveryItems)
      .where(eq(deliveryItems.deliveryId, id));

    const linkedSalesLines = await tx
      .select()
      .from(salesLines)
      .where(
        and(
          inArray(
            salesLines.id,
            input.items.map((item) => item.salesLineId),
          ),
          isNull(salesLines.deletedAt),
        ),
      );

    await tx.insert(deliveryItems).values(
      input.items.map((item) => {
        const salesLine = linkedSalesLines.find((line) => line.id === item.salesLineId);

        if (!salesLine) {
          throw new Error("One or more sales lines no longer exist");
        }

        return {
          deliveryId: id,
          salesLineId: salesLine.id,
          productId: salesLine.productId,
          quantity: salesLine.quantity,
          unitSellPrice: salesLine.unitSellPrice,
          sourceMode: salesLine.sourceMode,
          notes: item.notes,
        };
      }),
    );

    if (existingDelivery?.status === "delivered" && previousSalesLineIds.length > 0) {
      await setSalesLineStatuses(tx, previousSalesLineIds, "ready_for_delivery");
    }

    if (input.delivery.status === "delivered") {
      await setSalesLineStatuses(
        tx,
        input.items.map((item) => item.salesLineId),
        "delivered",
      );
    }

    return delivery;
  });
}

export async function softDeleteDelivery(id: string) {
  return db.transaction(async (tx) => {
    const [existingDelivery] = await tx
      .select({
        status: deliveries.status,
      })
      .from(deliveries)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deletedAt)));

    const existingItems = await tx
      .select({
        salesLineId: deliveryItems.salesLineId,
      })
      .from(deliveryItems)
      .where(
        and(
          eq(deliveryItems.deliveryId, id),
          isNull(deliveryItems.deletedAt),
        ),
      );

    const linkedSalesLineIds = existingItems
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

    if (existingDelivery?.status === "delivered" && linkedSalesLineIds.length > 0) {
      await setSalesLineStatuses(tx, linkedSalesLineIds, "ready_for_delivery");
    }

    return delivery;
  });
}
