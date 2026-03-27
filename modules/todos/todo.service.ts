import { normalizePositiveInt } from "@/lib/utils";
import {
  deleteTodo,
  insertTodo,
  updateTodo,
  getTodo,
  getPaginatedTodos,
  getTodosCount
} from "@/modules/todos/todo.repository";
import { Todo } from "@/modules/todos/todo.types";

type PaginatedData<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getTodosService(input?: { 
    page?: number, 
    limit?: number
}): Promise<PaginatedData<Todo>> {
    
    const page = normalizePositiveInt(input?.page, 1);
    const limit = normalizePositiveInt(input?.limit, 10);
    const safeLimit = Math.min(limit, 100);

    const [data, total] = await Promise.all([
        getPaginatedTodos(page, safeLimit),
        getTodosCount(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
        data,
        pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        },
    };

}
 

export async function createTodoService(input: { title: string, text?: string }) {
  return insertTodo(input.title.trim(), input.text?.trim())
}

export async function toggleTodoService(input: { id: number }) {
    const todo = await getTodo(input.id);

    if (!todo) {
        throw new Error("Todo not found");
    }

    return updateTodo(input.id, { 
        done: !todo.done,
    })

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
     })

}

export async function deleteTodoService(input: { id: number }) {
  const todo = await getTodo(input.id);

  if (!todo) {
    throw new Error("Todo not found");
  }

  return deleteTodo(input.id);
}