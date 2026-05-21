export const STOCK_MOVEMENT_TYPES = [
  "opening_balance",
  "purchase_in",
  "delivery_out",
  "delivery_correction",
  "manual_adjustment",
  "damage",
  "personal_draw",
  "return_in",
  "return_to_supplier",
  "found_stock",
  "correction",
] as const;

export type StockMovement = {
  id: string;
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantityDelta: number;
  movementType: string;
  sourceType: string | null;
  sourceId: string | null;
  occurredAt: Date;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date;
};

export type ProductStockSummary = {
  currentStock: number;
  productId: string;
};
