"use server";

import { revalidatePath } from "next/cache";
import {
  createTodoService,
  deleteTodoService,
  toggleTodoService,
} from "@/modules/todos/todo.service";
import { CreateTodoSchema } from "@/modules/todos/todo.schemas";
import { treeifyError } from "zod/v4/core";
import { redirect } from "next/navigation";

export async function createTodoAction(formData: FormData) {
  const validatedFields = CreateTodoSchema.safeParse({
    title: formData.get("title"),
    text: formData.get("text"),
  });

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error),
      message: "Validation failed",
    };
  }

  const { title, text } = validatedFields.data;

  try {
    await createTodoService({ title, text: text || undefined });
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to create todo",
    };
  }

  revalidatePath("/todos");
  redirect("/todos");
}

export async function toggleTodoAction(id: number) {
  try {
    await toggleTodoService({ id });
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to toggle todo",
    };
  }

  revalidatePath("/todos");
}

export async function deleteTodoAction(id: number) {
  try {
    await deleteTodoService({ id });
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to delete todo",
    };
  }

  revalidatePath("/todos");
}