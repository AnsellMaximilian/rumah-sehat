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

  const desiredBySourceId = new Map(
    desiredMovements.map((movement) => [movement.sourceId, movement]),
  );
  const affectedProductIds = new Set<string>();
  const existingNetBySourceAndProduct = new Map<string, Map<string, number>>();

  for (const movement of existingMovements) {
    if (!movement.sourceId) {
      continue;
    }

    const productNetBySource =
      existingNetBySourceAndProduct.get(movement.sourceId) ?? new Map<string, number>();

    productNetBySource.set(
      movement.productId,
      (productNetBySource.get(movement.productId) ?? 0) + movement.quantityDelta,
    );
    existingNetBySourceAndProduct.set(movement.sourceId, productNetBySource);
  }

  function resolveCorrectionMovementType() {
    if (movementType === "delivery_out") {
      return "delivery_correction";
    }

    return "correction";
  }

  async function appendCorrection(input: {
    notes: string | null;
    occurredAt: Date;
    productId: string;
    quantityDelta: number;
    sourceId: string;
  }) {
    if (input.quantityDelta === 0) {
      return;
    }

    await tx.insert(stockMovements).values({
      createdBy,
      movementType: resolveCorrectionMovementType(),
      notes: input.notes,
      occurredAt: input.occurredAt,
      productId: input.productId,
      quantityDelta: input.quantityDelta,
      sourceId: input.sourceId,
      sourceType,
    });

    affectedProductIds.add(input.productId);
  }

  for (const sourceId of sourceIds) {
    const desiredMovement = desiredBySourceId.get(sourceId);
    const existingNetByProduct =
      existingNetBySourceAndProduct.get(sourceId) ?? new Map<string, number>();

    if (!desiredMovement) {
      for (const [productId, currentNet] of existingNetByProduct) {
        await appendCorrection({
          notes: "Correction for removed stock source",
          occurredAt: new Date(),
          productId,
          quantityDelta: -currentNet,
          sourceId,
        });
      }
      continue;
    }

    if (existingNetByProduct.size === 0) {
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

    for (const [productId, currentNet] of existingNetByProduct) {
      if (productId === desiredMovement.productId) {
        continue;
      }

      await appendCorrection({
        notes: desiredMovement.notes,
        occurredAt: desiredMovement.occurredAt,
        productId,
        quantityDelta: -currentNet,
        sourceId,
      });
    }

    const currentNet = existingNetByProduct.get(desiredMovement.productId) ?? 0;
    const correctionDelta = desiredMovement.quantityDelta - currentNet;

    await appendCorrection({
      notes: desiredMovement.notes,
      occurredAt: desiredMovement.occurredAt,
      productId: desiredMovement.productId,
      quantityDelta: correctionDelta,
      sourceId,
    });
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


export async function insertStockMovement(input: {
  createdBy: string;
  movementType: string;
  notes: string | null;
  occurredAt: Date;
  productId: string;
  quantityDelta: number;
  sourceId?: string | null;
  sourceType?: string | null;
}) {
  const [stockMovement] = await db
    .insert(stockMovements)
    .values({
      createdBy: input.createdBy,
      movementType: input.movementType,
      notes: input.notes,
      occurredAt: input.occurredAt,
      productId: input.productId,
      quantityDelta: input.quantityDelta,
      sourceId: input.sourceId ?? null,
      sourceType: input.sourceType ?? null,
    })
    .returning();

  return stockMovement;
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
