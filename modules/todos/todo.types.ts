export type Todo = {
  id: number;
  title: string;
  text: string | null;
  done: boolean;
};

export type TodoSortBy = "id" | "title";

export type TodoSortOrder = "asc" | "desc";

export type TodoListInput = {
  page?: number;
  limit?: number;
  query?: string;
  sortBy?: TodoSortBy;
  sortOrder?: TodoSortOrder;
};

export type TodoPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CreateTodoInput = {
  text: string;
};
