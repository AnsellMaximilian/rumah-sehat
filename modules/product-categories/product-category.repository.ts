import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { productCategories } from "@/db/schema";
import {
  ProductCategorySortBy,
  ProductCategorySortOrder,
} from "./product-category.types";

type ProductCategoryMutationInput = {
  name: string;
  description: string | null;
  active: boolean;
};

function getProductCategoryOrderBy(
  sortBy: ProductCategorySortBy,
  sortOrder: ProductCategorySortOrder,
) {
  const columns = {
    createdAt: productCategories.createdAt,
    name: productCategories.name,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildProductCategorySearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(productCategories.name, `%${query}%`),
    ilike(productCategories.description, `%${query}%`),
  );
}

export async function getPaginatedProductCategories(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: ProductCategorySortBy;
  sortOrder: ProductCategorySortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildProductCategorySearchFilter(query);
  const baseQuery = filter
    ? db.select().from(productCategories).where(filter)
    : db.select().from(productCategories);

  return baseQuery
    .orderBy(getProductCategoryOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getProductCategoryCount(query: string) {
  const filter = buildProductCategorySearchFilter(query);
  const baseQuery = filter
    ? db.select({ count: count() }).from(productCategories).where(filter)
    : db.select({ count: count() }).from(productCategories);
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getProductCategory(id: string) {
  const [productCategory] = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.id, id));

  return productCategory;
}

export async function getAllProductCategories() {
  return db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      active: productCategories.active,
    })
    .from(productCategories)
    .orderBy(asc(productCategories.name));
}

export async function getProductCategoryByName(
  name: string,
  excludeId?: string,
) {
  const [productCategory] = await db
    .select()
    .from(productCategories)
    .where(
      excludeId
        ? and(
            eq(productCategories.name, name),
            ne(productCategories.id, excludeId),
          )
        : eq(productCategories.name, name),
    );

  return productCategory;
}

export async function insertProductCategory(input: ProductCategoryMutationInput) {
  const [productCategory] = await db
    .insert(productCategories)
    .values(input)
    .returning();

  return productCategory;
}

export async function updateProductCategory(
  id: string,
  input: Partial<ProductCategoryMutationInput>,
) {
  const updateData: Partial<ProductCategoryMutationInput> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.active !== undefined) updateData.active = input.active;

  const [productCategory] = await db
    .update(productCategories)
    .set(updateData)
    .where(eq(productCategories.id, id))
    .returning();

  return productCategory;
}

export async function deleteProductCategory(id: string) {
  const [productCategory] = await db
    .delete(productCategories)
    .where(eq(productCategories.id, id))
    .returning();

  return productCategory;
}
