"use server";

import { revalidatePath } from "next/cache";
import {
  createTodoService,
  deleteTodoService,
  toggleTodoService,
} from "@/modules/todos/todo.service";
import { CreateTodoSchema } from "@/modules/todos/todo.schemas";
import { z, treeifyError } from "zod";
import { redirect } from "next/navigation";

type TodoValues = z.infer<typeof CreateTodoSchema>;

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type TodoState = {
  errors: TreeifiedFieldErrors<TodoValues>;

  message: string;
  values: {
    title: string;
    text?: string;
  };
};

export async function createTodoAction(
  prevState: TodoState,
  formData: FormData,
): Promise<TodoState> {
  const values = {
    title: String(formData.get("title") ?? ""),
    text: String(formData.get("text") ?? ""),
  };
  const validatedFields = CreateTodoSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  const { title, text } = validatedFields.data;

  try {
    await createTodoService({ title, text: text || undefined });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: "Failed to create todo",
      values,
    };
  }

  revalidatePath("/dashboard/todos");
  redirect("/dashboard/todos");
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

  revalidatePath("/dashboard/todos");
}

export async function deleteTodoAction(id: number) {
  try {
    await deleteTodoService({ id });
    revalidatePath("/dashboard/todos");
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete todo" };
  }
}
