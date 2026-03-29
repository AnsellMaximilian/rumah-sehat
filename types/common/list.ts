export type ListSortOrder = "asc" | "desc";

export type ListInput<TSortBy extends string = string> = {
  page?: number;
  limit?: number;
  query?: string;
  sortBy?: TSortBy;
  sortOrder?: ListSortOrder;
};

export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationState;
};
