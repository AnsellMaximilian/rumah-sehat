import { desc, eq, count } from "drizzle-orm"
import { todos } from "@/db/schema/todos"
import { db } from "@/db/drizzle"

export async function getAllTodos() {
    const allTodos = await db.select().from(todos);
    return allTodos
}

export async function getPaginatedTodos(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const paginatedTodos = await db
        .select()
        .from(todos)
        .orderBy(desc(todos.id))
        .limit(limit)
        .offset(offset);
    return paginatedTodos
}

export async function getTodosCount() {
    const [{count: countResult}] = await db
        .select({ count: count() })
        .from(todos);
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