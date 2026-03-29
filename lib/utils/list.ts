import { z } from "zod";
import {
  ListInput,
  ListSearchParams,
  ListSortOrder,
  PaginationState,
} from "@/types";
import { normalizePositiveInt } from "@/lib/utils/number";
import { getSingleSearchParam } from "@/lib/utils/search";

type NormalizeListSortInput<TSortBy extends string> = {
  sortBy: string | undefined;
  sortOrder: string | undefined;
  sortBySchema: z.ZodType<TSortBy>;
  defaultSortBy: TSortBy;
  defaultSortOrder?: ListSortOrder;
};

type BuildPaginationInput = {
  page: number | string | undefined;
  limit: number | string | undefined;
  total: number;
  maxLimit?: number;
  defaultPage?: number;
  defaultLimit?: number;
};

export function normalizeListSort<TSortBy extends string>({
  sortBy,
  sortOrder,
  sortBySchema,
  defaultSortBy,
  defaultSortOrder = "desc",
}: NormalizeListSortInput<TSortBy>) {
  const parsedSortBy = sortBySchema.safeParse(sortBy);
  const parsedSortOrder = z.enum(["asc", "desc"]).safeParse(sortOrder);

  return {
    sortBy: parsedSortBy.success ? parsedSortBy.data : defaultSortBy,
    sortOrder: parsedSortOrder.success
      ? parsedSortOrder.data
      : defaultSortOrder,
  };
}

export function buildPagination({
  page,
  limit,
  total,
  maxLimit = 100,
  defaultPage = 1,
  defaultLimit = 10,
}: BuildPaginationInput): {
  page: number;
  limit: number;
  pagination: PaginationState;
} {
  const normalizedPage = normalizePositiveInt(page, defaultPage);
  const normalizedLimit = normalizePositiveInt(limit, defaultLimit);
  const safeLimit = Math.min(normalizedLimit, maxLimit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(normalizedPage, totalPages);

  return {
    page: safePage,
    limit: safeLimit,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export function parseListSearchParams<TSortBy extends string, TFilters extends object>(
  searchParams: ListSearchParams<TFilters> | undefined,
  options: {
    sortBySchema: z.ZodType<TSortBy>;
    defaultSortBy: TSortBy;
    defaultSortOrder?: ListSortOrder;
    defaultPage?: number;
    defaultLimit?: number;
  },
): Required<ListInput<TSortBy>> {
  const query = getSingleSearchParam(searchParams?.query)?.trim() ?? "";
  const page = normalizePositiveInt(
    getSingleSearchParam(searchParams?.page),
    options.defaultPage ?? 1,
  );
  const limit = normalizePositiveInt(
    getSingleSearchParam(searchParams?.limit),
    options.defaultLimit ?? 10,
  );
  const sort = normalizeListSort({
    sortBy: getSingleSearchParam(searchParams?.sortBy),
    sortOrder: getSingleSearchParam(searchParams?.sortOrder),
    sortBySchema: options.sortBySchema,
    defaultSortBy: options.defaultSortBy,
    defaultSortOrder: options.defaultSortOrder,
  });

  return {
    page,
    limit,
    query,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  };
}
