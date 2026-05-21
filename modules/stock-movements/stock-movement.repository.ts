import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import { products, stockMovements, user } from "@/db/schema";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type DesiredStockMovement = {
  notes: string | null;
  occurredAt: Date;
  productId: string;
  quantityDelta: number;
  sourceId: string;
};

async function getTrackedProductIds(
  tx: DbTx,
  productIds: string[],
) {
  if (productIds.length === 0) {
    return new Set<string>();
  }

  const rows = await tx
    .select({
      id: products.id,
    })
    .from(products)
    .where(
      and(
        inArray(products.id, productIds),
        eq(products.trackStock, true),
      ),
    );

  return new Set(rows.map((row) => row.id));
}

async function syncStockMovementsBySource(input: {
  createdBy: string;
  desiredMovements: DesiredStockMovement[];
  movementType: string;
  sourceIds: string[];
  sourceType: string;
  tx: DbTx;
}) {
  const { createdBy, desiredMovements, movementType, sourceIds, sourceType, tx } = input;

  if (sourceIds.length === 0) {
    return [];
  }

  const existingMovements = await tx
    .select()
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.sourceType, sourceType),
        inArray(stockMovements.sourceId, sourceIds),
      ),
    );

  const existingBySourceId = new Map(
    existingMovements
      .filter((movement) => movement.sourceId)
      .map((movement) => [movement.sourceId as string, movement]),
  );
  const desiredBySourceId = new Map(
    desiredMovements.map((movement) => [movement.sourceId, movement]),
  );
  const affectedProductIds = new Set<string>();

  for (const existingMovement of existingMovements) {
    const sourceId = existingMovement.sourceId;

    if (!sourceId || desiredBySourceId.has(sourceId)) {
      continue;
    }

    await tx
      .delete(stockMovements)
      .where(eq(stockMovements.id, existingMovement.id));

    affectedProductIds.add(existingMovement.productId);
  }

  for (const desiredMovement of desiredMovements) {
    const existingMovement = existingBySourceId.get(desiredMovement.sourceId);

    if (!existingMovement) {
      await tx.insert(stockMovements).values({
        createdBy,
        movementType,
        notes: desiredMovement.notes,
        occurredAt: desiredMovement.occurredAt,
        productId: desiredMovement.productId,
        quantityDelta: desiredMovement.quantityDelta,
        sourceId: desiredMovement.sourceId,
        sourceType,
      });
      affectedProductIds.add(desiredMovement.productId);
      continue;
    }

    if (
      existingMovement.productId === desiredMovement.productId &&
      existingMovement.quantityDelta === desiredMovement.quantityDelta &&
      existingMovement.occurredAt.getTime() === desiredMovement.occurredAt.getTime() &&
      existingMovement.notes === desiredMovement.notes
    ) {
      continue;
    }

    await tx
      .update(stockMovements)
      .set({
        notes: desiredMovement.notes,
        occurredAt: desiredMovement.occurredAt,
        productId: desiredMovement.productId,
        quantityDelta: desiredMovement.quantityDelta,
      })
      .where(eq(stockMovements.id, existingMovement.id));

    affectedProductIds.add(existingMovement.productId);
    affectedProductIds.add(desiredMovement.productId);
  }

  return Array.from(affectedProductIds);
}

export async function syncPurchaseInStockMovements(input: {
  createdBy: string;
  items: Array<{
    destinationType: string;
    id: string;
    notes: string | null;
    productId: string;
    quantity: number;
  }>;
  occurredAt: Date;
  status: string;
  tx: DbTx;
}) {
  const sourceIds = input.items.map((item) => item.id);
  const trackedProductIds = await getTrackedProductIds(
    input.tx,
    Array.from(new Set(input.items.map((item) => item.productId))),
  );
  const statusAllowsStockIn =
    input.status === "arrived" || input.status === "closed";
  const desiredMovements = statusAllowsStockIn
    ? input.items
        .filter(
          (item) =>
            item.destinationType === "stock" &&
            trackedProductIds.has(item.productId),
        )
        .map((item) => ({
          notes: item.notes,
          occurredAt: input.occurredAt,
          productId: item.productId,
          quantityDelta: item.quantity,
          sourceId: item.id,
        }))
    : [];

  return syncStockMovementsBySource({
    createdBy: input.createdBy,
    desiredMovements,
    movementType: "purchase_in",
    sourceIds,
    sourceType: "supplier_purchase_item",
    tx: input.tx,
  });
}

export async function syncDeliveryOutStockMovements(input: {
  createdBy: string;
  items: Array<{
    notes: string | null;
    occurredAt: Date;
    productId: string;
    quantity: number;
    salesLineId: string;
    sourceMode: string;
  }>;
  sourceSalesLineIds: string[];
  tx: DbTx;
}) {
  const trackedProductIds = await getTrackedProductIds(
    input.tx,
    Array.from(new Set(input.items.map((item) => item.productId))),
  );
  const desiredMovements = input.items
    .filter(
      (item) =>
        item.sourceMode === "stock" &&
        trackedProductIds.has(item.productId),
    )
    .map((item) => ({
      notes: item.notes,
      occurredAt: item.occurredAt,
      productId: item.productId,
      quantityDelta: -Math.abs(item.quantity),
      sourceId: item.salesLineId,
    }));

  return syncStockMovementsBySource({
    createdBy: input.createdBy,
    desiredMovements,
    movementType: "delivery_out",
    sourceIds: input.sourceSalesLineIds,
    sourceType: "sales_line",
    tx: input.tx,
  });
}

export async function getProductStockSummaries(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }

  return db
    .select({
      currentStock: sql<number>`coalesce(sum(${stockMovements.quantityDelta}), 0)`,
      productId: stockMovements.productId,
    })
    .from(stockMovements)
    .where(inArray(stockMovements.productId, productIds))
    .groupBy(stockMovements.productId);
}

export async function getProductStockMovements(productId: string) {
  const movementColumns = getTableColumns(stockMovements);

  return db
    .select({
      ...movementColumns,
      createdByName: user.name,
      productCode: products.productCode,
      productName: products.name,
    })
    .from(stockMovements)
    .leftJoin(user, eq(stockMovements.createdBy, user.id))
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .where(eq(stockMovements.productId, productId))
    .orderBy(desc(stockMovements.occurredAt), desc(stockMovements.createdAt), asc(stockMovements.id));
}
