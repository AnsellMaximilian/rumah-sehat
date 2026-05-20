import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import {
  deleteProduct,
  getProduct,
  getProductByCode,
  getProductCount,
  getPaginatedProducts,
  insertProduct,
  updateProduct,
} from "./product.repository";
import { Product, ProductListInput } from "./product.types";
import { ProductSortBySchema } from "./product.schema";

type ProductMutationInput = {
  name: string;
  productCode: string | null;
  description: string | null;
  defaultUnit: string | null;
  cost: number;
  price: number;
  defaultFulfillmentMode: string;
  trackStock: boolean;
  active: boolean;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeProductInput(input: ProductMutationInput) {
  return {
    name: input.name.trim(),
    productCode: normalizeOptionalText(input.productCode),
    description: normalizeOptionalText(input.description),
    defaultUnit: normalizeOptionalText(input.defaultUnit),
    cost: input.cost,
    price: input.price,
    defaultFulfillmentMode: input.defaultFulfillmentMode,
    trackStock: input.trackStock,
    active: input.active,
  };
}

async function ensureUniqueProductCode(productCode: string | null) {
  if (!productCode) {
    return;
  }

  const existingProduct = await getProductByCode(productCode);

  if (existingProduct) {
    throw new Error("Product code already exists");
  }
}

async function ensureUniqueProductCodeForUpdate(
  productCode: string | null,
  productId: string,
) {
  if (!productCode) {
    return;
  }

  const duplicateProduct = await getProductByCode(productCode, productId);

  if (duplicateProduct) {
    throw new Error("Product code already exists");
  }
}

function resolveStockTrackingStartedAt(input: {
  trackStock: boolean;
  existingStartedAt?: Date | null;
}) {
  if (!input.trackStock) {
    return input.existingStartedAt ?? null;
  }

  return input.existingStartedAt ?? new Date();
}

export async function getProductsService(
  input: ProductListInput = {},
): Promise<PaginatedResult<Product>> {
  const auth = await getAuthContext();

  await auth.require("view", "products");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: ProductSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getProductCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedProducts({
    page,
    limit,
    query,
    sortBy,
    sortOrder,
  });

  return {
    data,
    pagination,
  };
}

export async function getProductService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "products");

  return getProduct(input.id);
}

export async function createProductService(input: ProductMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "products");

  const normalizedInput = normalizeProductInput(input);

  await ensureUniqueProductCode(normalizedInput.productCode);

  return insertProduct({
    ...normalizedInput,
    stockTrackingStartedAt: resolveStockTrackingStartedAt({
      trackStock: normalizedInput.trackStock,
    }),
  });
}

export async function updateProductService(
  input: ProductMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "products");

  const product = await getProduct(input.id);

  if (!product) {
    throw new Error("Product not found");
  }

  const normalizedInput = normalizeProductInput(input);

  await ensureUniqueProductCodeForUpdate(
    normalizedInput.productCode,
    input.id,
  );

  return updateProduct(input.id, {
    ...normalizedInput,
    stockTrackingStartedAt: resolveStockTrackingStartedAt({
      trackStock: normalizedInput.trackStock,
      existingStartedAt: product.stockTrackingStartedAt,
    }),
  });
}

export async function deleteProductService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "products");

  const product = await getProduct(input.id);

  if (!product) {
    throw new Error("Product not found");
  }

  return deleteProduct(input.id);
}
