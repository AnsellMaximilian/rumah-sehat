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
  products,
  salesLines,
  supplierPurchaseAllocations,
  supplierPurchaseItems,
  supplierPurchases,
  suppliers,
  user,
} from "@/db/schema";
import { syncPurchaseInStockMovements } from "@/modules/stock-movements/stock-movement.repository";
import {
  SupplierPurchaseSortBy,
  SupplierPurchaseSortOrder,
} from "./supplier-purchase.types";

type SupplierPurchaseMutationInput = {
  supplierId: string;
  purchaseDate: string;
  referenceNumber: string | null;
  status: string;
  notes: string | null;
  createdBy: string;
};

type SupplierPurchaseItemMutationInput = {
  id?: string | null;
  productId: string;
  quantity: number;
  unitCost: number | null;
  destinationType: string;
  customerId: string | null;
  notes: string | null;
};

type SupplierPurchaseWriteResult = {
  affectedSalesLineIds: string[];
  deliveredSalesLineCustomerIds: string[];
  supplierPurchase: typeof supplierPurchases.$inferSelect | undefined;
};

function shouldMaterializeSupplierPurchaseItem(input: {
  destinationType: string;
  status: string;
}) {
  if (input.destinationType === "customer_direct") {
    return input.status === "delivered_by_supplier" || input.status === "closed";
  }

  if (input.destinationType === "customer_prepacked") {
    return input.status === "arrived" || input.status === "closed";
  }

  return false;
}

function resolveGeneratedSalesLineSourceMode(destinationType: string) {
  if (destinationType === "customer_direct") {
    return "supplier_direct";
  }

  return "supplier_prepacked";
}

function resolveGeneratedSalesLineStatus(destinationType: string) {
  if (destinationType === "customer_direct") {
    return "delivered";
  }

  return "ready_for_delivery";
}

async function getRawSupplierPurchaseItems(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  supplierPurchaseId: string,
) {
  return tx
    .select()
    .from(supplierPurchaseItems)
    .where(eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchaseId))
    .orderBy(asc(supplierPurchaseItems.createdAt));
}

async function syncGeneratedSalesLines(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    currentItems: Awaited<ReturnType<typeof getRawSupplierPurchaseItems>>;
    sourceItemIds: string[];
    status: string;
    supplierId: string;
  },
) {
  if (input.sourceItemIds.length === 0) {
    return {
      affectedSalesLineIds: [] as string[],
      deliveredSalesLineCustomerIds: [] as string[],
    };
  }

  const existingGeneratedSalesLines = await tx
    .select()
    .from(salesLines)
    .where(
      and(
        inArray(salesLines.sourceSupplierPurchaseItemId, input.sourceItemIds),
        isNull(salesLines.deletedAt),
      ),
    );

  const existingGeneratedBySourceItemId = new Map(
    existingGeneratedSalesLines
      .filter((salesLine) => salesLine.sourceSupplierPurchaseItemId)
      .map((salesLine) => [
        salesLine.sourceSupplierPurchaseItemId as string,
        salesLine,
      ]),
  );
  const nextMaterializedItems = input.currentItems.filter(
    (item) =>
      item.customerId &&
      shouldMaterializeSupplierPurchaseItem({
        destinationType: item.destinationType,
        status: input.status,
      }),
  );
  const nextSourceItemIds = new Set(nextMaterializedItems.map((item) => item.id));
  const affectedSalesLineIds = new Set<string>();
  const deliveredSalesLineCustomerIds = new Set<string>();

  async function softDeleteAllocationsForSalesLine(salesLineId: string) {
    await tx
      .update(supplierPurchaseAllocations)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(supplierPurchaseAllocations.salesLineId, salesLineId),
          isNull(supplierPurchaseAllocations.deletedAt),
        ),
      );
  }

  async function upsertAllocation(input: {
    allocatedQuantity: number;
    salesLineId: string;
    supplierPurchaseItemId: string;
  }) {
    const [updatedAllocation] = await tx
      .update(supplierPurchaseAllocations)
      .set({
        allocatedQuantity: input.allocatedQuantity,
        deletedAt: null,
      })
      .where(
        and(
          eq(supplierPurchaseAllocations.salesLineId, input.salesLineId),
          eq(
            supplierPurchaseAllocations.supplierPurchaseItemId,
            input.supplierPurchaseItemId,
          ),
        ),
      )
      .returning();

    if (updatedAllocation) {
      return;
    }

    await tx.insert(supplierPurchaseAllocations).values({
      allocatedQuantity: input.allocatedQuantity,
      salesLineId: input.salesLineId,
      supplierPurchaseItemId: input.supplierPurchaseItemId,
    });
  }

  for (const existingGeneratedSalesLine of existingGeneratedSalesLines) {
    const sourceItemId = existingGeneratedSalesLine.sourceSupplierPurchaseItemId;

    if (!sourceItemId || nextSourceItemIds.has(sourceItemId)) {
      continue;
    }

    const [deletedSalesLine] = await tx
      .update(salesLines)
      .set({ deletedAt: new Date() })
      .where(and(eq(salesLines.id, existingGeneratedSalesLine.id), isNull(salesLines.deletedAt)))
      .returning();

    if (deletedSalesLine) {
      await softDeleteAllocationsForSalesLine(deletedSalesLine.id);
      affectedSalesLineIds.add(deletedSalesLine.id);
    }
  }

  for (const item of nextMaterializedItems) {
    const sourceMode = resolveGeneratedSalesLineSourceMode(item.destinationType);
    const desiredStatus = resolveGeneratedSalesLineStatus(item.destinationType);
    const existingGeneratedSalesLine = existingGeneratedBySourceItemId.get(item.id);

    if (!existingGeneratedSalesLine) {
      const [createdSalesLine] = await tx
        .insert(salesLines)
        .values({
          customerId: item.customerId as string,
          productId: item.productId,
          quantity: item.quantity,
          unitSellPrice: null,
          sourceMode,
          sourceSupplierPurchaseItemId: item.id,
          supplierId: input.supplierId,
          status: desiredStatus,
          notes: item.notes,
        })
        .returning();

      if (createdSalesLine) {
        await upsertAllocation({
          allocatedQuantity: item.quantity,
          salesLineId: createdSalesLine.id,
          supplierPurchaseItemId: item.id,
        });
        affectedSalesLineIds.add(createdSalesLine.id);

        if (createdSalesLine.status === "delivered") {
          deliveredSalesLineCustomerIds.add(createdSalesLine.customerId);
        }
      }

      continue;
    }

    const nextStatus =
      existingGeneratedSalesLine.status === "delivered" ||
      existingGeneratedSalesLine.status === "cancelled"
        ? existingGeneratedSalesLine.status
        : desiredStatus;

    const [updatedSalesLine] = await tx
      .update(salesLines)
      .set({
        customerId: item.customerId as string,
        productId: item.productId,
        quantity: item.quantity,
        sourceMode,
        sourceSupplierPurchaseItemId: item.id,
        supplierId: input.supplierId,
        status: nextStatus,
        notes: item.notes,
      })
      .where(and(eq(salesLines.id, existingGeneratedSalesLine.id), isNull(salesLines.deletedAt)))
      .returning();

    if (updatedSalesLine) {
      await upsertAllocation({
        allocatedQuantity: item.quantity,
        salesLineId: updatedSalesLine.id,
        supplierPurchaseItemId: item.id,
      });
      affectedSalesLineIds.add(updatedSalesLine.id);

      if (updatedSalesLine.status === "delivered") {
        deliveredSalesLineCustomerIds.add(updatedSalesLine.customerId);
      }
    }
  }

  return {
    affectedSalesLineIds: Array.from(affectedSalesLineIds),
    deliveredSalesLineCustomerIds: Array.from(deliveredSalesLineCustomerIds),
  };
}

function getSupplierPurchaseOrderBy(
  sortBy: SupplierPurchaseSortBy,
  sortOrder: SupplierPurchaseSortOrder,
) {
  const columns = {
    createdAt: supplierPurchases.createdAt,
    purchaseDate: supplierPurchases.purchaseDate,
    referenceNumber: supplierPurchases.referenceNumber,
    status: supplierPurchases.status,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildSupplierPurchaseSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(suppliers.name, `%${query}%`),
    ilike(supplierPurchases.referenceNumber, `%${query}%`),
    ilike(supplierPurchases.status, `%${query}%`),
    ilike(supplierPurchases.notes, `%${query}%`),
  );
}

export async function getPaginatedSupplierPurchases(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: SupplierPurchaseSortBy;
  sortOrder: SupplierPurchaseSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildSupplierPurchaseSearchFilter(query);
  const purchaseColumns = getTableColumns(supplierPurchases);
  const baseQuery = filter
    ? db
        .select({
          ...purchaseColumns,
          supplierName: suppliers.name,
          createdByName: user.name,
        })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .leftJoin(user, eq(supplierPurchases.createdBy, user.id))
        .where(filter)
    : db
        .select({
          ...purchaseColumns,
          supplierName: suppliers.name,
          createdByName: user.name,
        })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .leftJoin(user, eq(supplierPurchases.createdBy, user.id));

  return baseQuery
    .orderBy(getSupplierPurchaseOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getSupplierPurchaseCount(query: string) {
  const filter = buildSupplierPurchaseSearchFilter(query);
  const baseQuery = filter
    ? db
        .select({ count: count() })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .where(filter)
    : db
        .select({ count: count() })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id));
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getSupplierPurchase(id: string) {
  const purchaseColumns = getTableColumns(supplierPurchases);
  const [supplierPurchase] = await db
    .select({
      ...purchaseColumns,
      supplierName: suppliers.name,
      createdByName: user.name,
    })
    .from(supplierPurchases)
    .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
    .leftJoin(user, eq(supplierPurchases.createdBy, user.id))
    .where(eq(supplierPurchases.id, id));

  return supplierPurchase;
}

export async function getSupplierPurchaseItems(supplierPurchaseId: string) {
  const itemColumns = getTableColumns(supplierPurchaseItems);

  return db
    .select({
      ...itemColumns,
      productName: products.name,
      productCode: products.productCode,
      customerName: customers.name,
      customerCode: customers.customerCode,
    })
    .from(supplierPurchaseItems)
    .leftJoin(products, eq(supplierPurchaseItems.productId, products.id))
    .leftJoin(customers, eq(supplierPurchaseItems.customerId, customers.id))
    .where(eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchaseId))
    .orderBy(asc(supplierPurchaseItems.createdAt));
}


export async function getSupplierPurchaseAllocations(supplierPurchaseId: string) {
  const allocationColumns = getTableColumns(supplierPurchaseAllocations);

  return db
    .select({
      ...allocationColumns,
      salesLineQuantity: salesLines.quantity,
      salesLineStatus: salesLines.status,
      salesLineSourceMode: salesLines.sourceMode,
      customerId: customers.id,
      customerName: customers.name,
      customerCode: customers.customerCode,
      productId: products.id,
      productName: products.name,
      productCode: products.productCode,
    })
    .from(supplierPurchaseAllocations)
    .innerJoin(
      supplierPurchaseItems,
      eq(supplierPurchaseAllocations.supplierPurchaseItemId, supplierPurchaseItems.id),
    )
    .leftJoin(salesLines, eq(supplierPurchaseAllocations.salesLineId, salesLines.id))
    .leftJoin(customers, eq(salesLines.customerId, customers.id))
    .leftJoin(products, eq(salesLines.productId, products.id))
    .where(
      and(
        eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchaseId),
        isNull(supplierPurchaseAllocations.deletedAt),
      ),
    )
    .orderBy(asc(supplierPurchaseAllocations.createdAt));
}

export async function getSupplierPurchaseByReferenceNumber(
  referenceNumber: string,
  excludeId?: string,
) {
  const [supplierPurchase] = await db
    .select()
    .from(supplierPurchases)
    .where(
      excludeId
        ? and(
            eq(supplierPurchases.referenceNumber, referenceNumber),
            ne(supplierPurchases.id, excludeId),
          )
        : eq(supplierPurchases.referenceNumber, referenceNumber),
    );

  return supplierPurchase;
}

export async function insertSupplierPurchase(input: {
  purchase: SupplierPurchaseMutationInput;
  items: SupplierPurchaseItemMutationInput[];
}): Promise<SupplierPurchaseWriteResult> {
  return db.transaction(async (tx) => {
    const [supplierPurchase] = await tx
      .insert(supplierPurchases)
      .values(input.purchase)
      .returning();

    if (input.items.length > 0) {
      await tx.insert(supplierPurchaseItems).values(
        input.items.map((item) => ({
          supplierPurchaseId: supplierPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          destinationType: item.destinationType,
          customerId: item.customerId,
          notes: item.notes,
        })),
      );
    }

    const currentItems = await getRawSupplierPurchaseItems(tx, supplierPurchase.id);
    const syncResult = await syncGeneratedSalesLines(tx, {
      currentItems,
      sourceItemIds: currentItems.map((item) => item.id),
      status: input.purchase.status,
      supplierId: input.purchase.supplierId,
    });
    await syncPurchaseInStockMovements({
      createdBy: input.purchase.createdBy,
      items: currentItems,
      occurredAt: new Date(`${input.purchase.purchaseDate}T00:00:00`),
      status: input.purchase.status,
      tx,
    });

    return {
      affectedSalesLineIds: syncResult.affectedSalesLineIds,
      deliveredSalesLineCustomerIds: syncResult.deliveredSalesLineCustomerIds,
      supplierPurchase,
    };
  });
}

export async function updateSupplierPurchase(
  id: string,
  input: {
    purchase: Omit<SupplierPurchaseMutationInput, "createdBy">;
    items: SupplierPurchaseItemMutationInput[];
  },
): Promise<SupplierPurchaseWriteResult> {
  return db.transaction(async (tx) => {
    const existingItems = await getRawSupplierPurchaseItems(tx, id);
    const existingItemIds = new Set(existingItems.map((item) => item.id));
    const [supplierPurchase] = await tx
      .update(supplierPurchases)
      .set(input.purchase)
      .where(eq(supplierPurchases.id, id))
      .returning();

    const nextExistingItems = input.items.filter(
      (item): item is SupplierPurchaseItemMutationInput & { id: string } =>
        Boolean(item.id && existingItemIds.has(item.id)),
    );
    const newItems = input.items.filter((item) => !item.id);
    const retainedItemIds = new Set(nextExistingItems.map((item) => item.id));
    const removedItemIds = existingItems
      .filter((item) => !retainedItemIds.has(item.id))
      .map((item) => item.id);

    for (const item of nextExistingItems) {
      await tx
        .update(supplierPurchaseItems)
        .set({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          destinationType: item.destinationType,
          customerId: item.customerId,
          notes: item.notes,
        })
        .where(
          and(
            eq(supplierPurchaseItems.id, item.id),
            eq(supplierPurchaseItems.supplierPurchaseId, id),
          ),
        );
    }

    if (newItems.length > 0) {
      await tx.insert(supplierPurchaseItems).values(
        newItems.map((item) => ({
          supplierPurchaseId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          destinationType: item.destinationType,
          customerId: item.customerId,
          notes: item.notes,
        })),
      );
    }

    if (removedItemIds.length > 0) {
      await tx
        .delete(supplierPurchaseItems)
        .where(inArray(supplierPurchaseItems.id, removedItemIds));
    }

    const currentItems = await getRawSupplierPurchaseItems(tx, id);
    const syncResult = await syncGeneratedSalesLines(tx, {
      currentItems,
      sourceItemIds: Array.from(
        new Set([...existingItems.map((item) => item.id), ...currentItems.map((item) => item.id)]),
      ),
      status: input.purchase.status,
      supplierId: input.purchase.supplierId,
    });
    await syncPurchaseInStockMovements({
      createdBy: supplierPurchase?.createdBy ?? "",
      items: currentItems,
      occurredAt: new Date(`${input.purchase.purchaseDate}T00:00:00`),
      status: input.purchase.status,
      tx,
    });

    return {
      affectedSalesLineIds: syncResult.affectedSalesLineIds,
      deliveredSalesLineCustomerIds: syncResult.deliveredSalesLineCustomerIds,
      supplierPurchase,
    };
  });
}

export async function deleteSupplierPurchase(id: string): Promise<SupplierPurchaseWriteResult> {
  return db.transaction(async (tx) => {
    const [existingPurchase] = await tx
      .select({
        createdBy: supplierPurchases.createdBy,
      })
      .from(supplierPurchases)
      .where(eq(supplierPurchases.id, id));
    const existingItems = await getRawSupplierPurchaseItems(tx, id);
    const syncResult = await syncGeneratedSalesLines(tx, {
      currentItems: [],
      sourceItemIds: existingItems.map((item) => item.id),
      status: "void",
      supplierId: "",
    });
    if (existingItems.length > 0) {
      await syncPurchaseInStockMovements({
        createdBy: existingPurchase?.createdBy ?? "",
        items: existingItems,
        occurredAt: new Date(),
        status: "void",
        tx,
      });
    }
    const [supplierPurchase] = await tx
      .delete(supplierPurchases)
      .where(eq(supplierPurchases.id, id))
      .returning();

    return {
      affectedSalesLineIds: syncResult.affectedSalesLineIds,
      deliveredSalesLineCustomerIds: syncResult.deliveredSalesLineCustomerIds,
      supplierPurchase,
    };
  });
}
