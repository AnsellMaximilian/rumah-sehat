import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import {
  deleteProductCategory,
  getAllProductCategories,
  getPaginatedProductCategories,
  getProductCategory,
  getProductCategoryByName,
  getProductCategoryCount,
  insertProductCategory,
  updateProductCategory,
} from "./product-category.repository";
import {
  ProductCategory,
  ProductCategoryListInput,
  ProductCategorySelectOption,
} from "./product-category.types";
import { ProductCategorySortBySchema } from "./product-category.schema";

type ProductCategoryMutationInput = {
  name: string;
  description: string | null;
  active: boolean;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeProductCategoryInput(input: ProductCategoryMutationInput) {
  return {
    name: input.name.trim(),
    description: normalizeOptionalText(input.description),
    active: input.active,
  };
}

async function ensureUniqueProductCategoryName(name: string) {
  const existingProductCategory = await getProductCategoryByName(name);

  if (existingProductCategory) {
    throw new Error("Category name already exists");
  }
}

async function ensureUniqueProductCategoryNameForUpdate(
  name: string,
  productCategoryId: string,
) {
  const duplicateProductCategory = await getProductCategoryByName(
    name,
    productCategoryId,
  );

  if (duplicateProductCategory) {
    throw new Error("Category name already exists");
  }
}

export async function getProductCategoriesService(
  input: ProductCategoryListInput = {},
): Promise<PaginatedResult<ProductCategory>> {
  const auth = await getAuthContext();

  await auth.require("view", "product_categories");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: ProductCategorySortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getProductCategoryCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedProductCategories({
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

export async function getProductCategoryService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "product_categories");

  return getProductCategory(input.id);
}

export async function getAllProductCategoriesService(): Promise<
  ProductCategorySelectOption[]
> {
  const auth = await getAuthContext();

  await auth.require("view", "product_categories");

  return getAllProductCategories();
}

export async function createProductCategoryService(
  input: ProductCategoryMutationInput,
) {
  const auth = await getAuthContext();

  await auth.require("create", "product_categories");

  const normalizedInput = normalizeProductCategoryInput(input);

  await ensureUniqueProductCategoryName(normalizedInput.name);

  return insertProductCategory(normalizedInput);
}

export async function updateProductCategoryService(
  input: ProductCategoryMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "product_categories");

  const productCategory = await getProductCategory(input.id);

  if (!productCategory) {
    throw new Error("Category not found");
  }

  const normalizedInput = normalizeProductCategoryInput(input);

  await ensureUniqueProductCategoryNameForUpdate(
    normalizedInput.name,
    input.id,
  );

  return updateProductCategory(input.id, normalizedInput);
}

export async function deleteProductCategoryService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "product_categories");

  const productCategory = await getProductCategory(input.id);

  if (!productCategory) {
    throw new Error("Category not found");
  }

  return deleteProductCategory(input.id);
}
