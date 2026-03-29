import "server-only";
import {
  deleteTodo,
  insertTodo,
  updateTodo,
  getTodo,
  getPaginatedTodos,
  getTodosCount,
} from "@/modules/todos/todo.repository";
import {
  TodoSortBySchema,
  TodoSortOrderSchema,
} from "@/modules/todos/todo.schemas";
import {
  Todo,
  TodoListInput,
  TodoPagination,
} from "@/modules/todos/todo.types";
import { normalizePositiveInt } from "@/lib/utils/number";

type PaginatedData<T> = {
  data: T[];
  pagination: TodoPagination;
};

export async function getTodosService(
  input: TodoListInput = {},
): Promise<PaginatedData<Todo>> {
  const parsedSortBy = TodoSortBySchema.safeParse(input.sortBy);
  const parsedSortOrder = TodoSortOrderSchema.safeParse(input.sortOrder);

  const page = normalizePositiveInt(input?.page, 1);
  const limit = normalizePositiveInt(input?.limit, 10);
  const safeLimit = Math.min(limit, 100);
  const query = input.query?.trim() ?? "";
  const sortBy = parsedSortBy.success ? parsedSortBy.data : "id";
  const sortOrder = parsedSortOrder.success ? parsedSortOrder.data : "desc";
  const total = await getTodosCount(query);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(page, totalPages);

  const data = await getPaginatedTodos({
    page: safePage,
    limit: safeLimit,
    query,
    sortBy,
    sortOrder,
  });

  return {
    data,
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

export async function getTodoService(input: { id: number }) {
  return getTodo(input.id);
}

export async function createTodoService(input: {
  title: string;
  text?: string;
}) {
  return insertTodo(input.title.trim(), input.text?.trim());
}

export async function toggleTodoService(input: { id: number }) {
  const todo = await getTodo(input.id);

  if (!todo) {
    throw new Error("Todo not found");
  }

  return updateTodo(input.id, {
    done: !todo.done,
  });
}

export async function updateTodoService(input: {
  id: number;
  title?: string;
  text?: string;
  done?: boolean;
}) {
  const todo = await getTodo(input.id);

  if (!todo) {
    throw new Error("Todo not found");
  }
  return updateTodo(input.id, {
    title: input.title?.trim(),
    text: input.text?.trim(),
    done: input.done,
  });
}

export async function deleteTodoService(input: { id: number }) {
  const todo = await getTodo(input.id);

  if (!todo) {
    throw new Error("Todo not found");
  }

  return deleteTodo(input.id);
}
