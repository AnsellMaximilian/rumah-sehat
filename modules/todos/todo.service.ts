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
} from "@/modules/todos/todo.schemas";
import {
  Todo,
  TodoListInput,
} from "@/modules/todos/todo.types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { PaginatedResult } from "@/types";

export async function getTodosService(
  input: TodoListInput = {},
): Promise<PaginatedResult<Todo>> {
  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: TodoSortBySchema,
    defaultSortBy: "id",
    defaultSortOrder: "desc",
  });
  const total = await getTodosCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedTodos({
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
