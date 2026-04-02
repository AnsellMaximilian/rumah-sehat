import { asc, count, desc, eq, ilike } from "drizzle-orm"
import { todos } from "@/db/schema"
import { db } from "@/db/drizzle"
import { TodoSortBy, TodoSortOrder } from "@/modules/todos/todo.types"

export async function getAllTodos() {
    const allTodos = await db.select().from(todos);
    return allTodos
}

function getTodoOrderBy(sortBy: TodoSortBy, sortOrder: TodoSortOrder) {
    const columns = {
        id: todos.id,
        title: todos.title,
    } as const;

    const column = columns[sortBy];

    return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildTodoSearchFilter(query: string) {
    if (!query) {
        return undefined;
    }

    return ilike(todos.title, `%${query}%`);
}

export async function getPaginatedTodos(input: {
    page: number;
    limit: number;
    query: string;
    sortBy: TodoSortBy;
    sortOrder: TodoSortOrder;
}) {
    const { page, limit, query, sortBy, sortOrder } = input;
    const offset = (page - 1) * limit;
    const filter = buildTodoSearchFilter(query);
    const baseQuery = filter
        ? db.select().from(todos).where(filter)
        : db.select().from(todos);

    const paginatedTodos = await baseQuery
        .orderBy(getTodoOrderBy(sortBy, sortOrder))
        .limit(limit)
        .offset(offset);
    return paginatedTodos
}

export async function getTodosCount(query: string) {
    const filter = buildTodoSearchFilter(query);
    const baseQuery = filter
        ? db.select({ count: count() }).from(todos).where(filter)
        : db.select({ count: count() }).from(todos);

    const [{count: countResult}] = await baseQuery;
    return countResult;
}

export async function insertTodo(title: string, text?: string) {
  const [todo] = await db
    .insert(todos)
    .values({ title, text })
    .returning()

  return todo
}

export async function getTodo(id: number) {
    const [todo] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id));

    return todo;
}


export async function updateTodo(
  id: number,
  input: {
    title?: string;
    text?: string;
    done?: boolean;
  }
) {
  const updateData: {
    title?: string;
    text?: string;
    done?: boolean;
  } = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.text !== undefined) updateData.text = input.text;
  if (input.done !== undefined) updateData.done = input.done;

  const [todo] = await db
    .update(todos)
    .set(updateData)
    .where(eq(todos.id, id))
    .returning();

  return todo;
}


export async function deleteTodo(id: number) {
  const [todo] = await db
    .delete(todos)
    .where(eq(todos.id, id))
    .returning()

  return todo
}
