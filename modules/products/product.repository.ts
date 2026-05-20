import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  ne,
  or,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import { products, suppliers } from "@/db/schema";
import { ProductSortBy, ProductSortOrder } from "./product.types";

type ProductMutationInput = {
  name: string;
  productCode: string | null;
  description: string | null;
  supplierId: string | null;
  defaultUnit: string | null;
  cost: number;
  price: number;
  defaultFulfillmentMode: string;
  trackStock: boolean;
  stockTrackingStartedAt: Date | null;
  active: boolean;
};

function getProductOrderBy(sortBy: ProductSortBy, sortOrder: ProductSortOrder) {
  const columns = {
    createdAt: products.createdAt,
    productCode: products.productCode,
    name: products.name,
    defaultUnit: products.defaultUnit,
    cost: products.cost,
    price: products.price,
    defaultFulfillmentMode: products.defaultFulfillmentMode,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildProductSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(products.name, `%${query}%`),
    ilike(products.productCode, `%${query}%`),
    ilike(products.description, `%${query}%`),
    ilike(suppliers.name, `%${query}%`),
    ilike(products.defaultUnit, `%${query}%`),
  );
}

export async function getPaginatedProducts(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildProductSearchFilter(query);
  const productColumns = getTableColumns(products);
  const baseQuery = filter
    ? db
        .select({
          ...productColumns,
          supplierName: suppliers.name,
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
        .where(filter)
    : db
        .select({
          ...productColumns,
          supplierName: suppliers.name,
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id));

  return baseQuery
    .orderBy(getProductOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getProductCount(query: string) {
  const filter = buildProductSearchFilter(query);
  const baseQuery = filter
    ? db
        .select({ count: count() })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
        .where(filter)
    : db
        .select({ count: count() })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id));
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getProduct(id: string) {
  const productColumns = getTableColumns(products);
  const [product] = await db
    .select({
      ...productColumns,
      supplierName: suppliers.name,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(eq(products.id, id));

  return product;
}

export async function getProductByCode(
  productCode: string,
  excludeId?: string,
) {
  const [product] = await db
    .select()
    .from(products)
    .where(
      excludeId
        ? and(
            eq(products.productCode, productCode),
            ne(products.id, excludeId),
          )
        : eq(products.productCode, productCode),
    );

  return product;
}

export async function insertProduct(input: ProductMutationInput) {
  const [product] = await db.insert(products).values(input).returning();

  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductMutationInput>,
) {
  const updateData: Partial<ProductMutationInput> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.productCode !== undefined) updateData.productCode = input.productCode;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
  if (input.defaultUnit !== undefined) updateData.defaultUnit = input.defaultUnit;
  if (input.cost !== undefined) updateData.cost = input.cost;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.defaultFulfillmentMode !== undefined) {
    updateData.defaultFulfillmentMode = input.defaultFulfillmentMode;
  }
  if (input.trackStock !== undefined) updateData.trackStock = input.trackStock;
  if (input.stockTrackingStartedAt !== undefined) {
    updateData.stockTrackingStartedAt = input.stockTrackingStartedAt;
  }
  if (input.active !== undefined) updateData.active = input.active;

  const [product] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning();

  return product;
}

export async function deleteProduct(id: string) {
  const [product] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  return product;
}
