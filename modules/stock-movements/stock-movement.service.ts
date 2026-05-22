import { getAuthContext } from "@/modules/auth/auth.service";
import { logEntityCreated } from "@/modules/change-logs/change-log.service";
import { getProduct } from "@/modules/products/product.repository";
import { insertStockMovement } from "./stock-movement.repository";

export type StockMovementMutationInput = {
  productId: string;
  quantityDelta: number;
  movementType: string;
  occurredAt: Date;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeStockMovementInput(input: StockMovementMutationInput) {
  return {
    productId: input.productId,
    quantityDelta: input.quantityDelta,
    movementType: input.movementType,
    occurredAt: input.occurredAt,
    notes: normalizeOptionalText(input.notes),
  };
}

async function ensureTrackedProductExists(productId: string) {
  const product = await getProduct(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.trackStock) {
    throw new Error("Stock movements can only be added to tracked products");
  }

  return product;
}

export async function createStockMovementService(input: StockMovementMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "stock_movements");

  const normalizedInput = normalizeStockMovementInput(input);

  await ensureTrackedProductExists(normalizedInput.productId);

  const stockMovement = await insertStockMovement({
    ...normalizedInput,
    createdBy: auth.user.id,
    sourceId: null,
    sourceType: null,
  });

  await logEntityCreated({
    changedBy: auth.user.id,
    entity: stockMovement,
    entityId: stockMovement.id,
    entityType: "stock_movement",
  });

  return stockMovement;
}
