import { ListInput, ListSortOrder } from "@/types";

export type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductCategorySelectOption = {
  id: string;
  name: string;
  active: boolean;
};

export type ProductCategorySortBy =
  | "createdAt"
  | "name";

export type ProductCategorySortOrder = ListSortOrder;

export type ProductCategoryListInput = ListInput<ProductCategorySortBy>;
