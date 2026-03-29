"use client";

import { Todo } from "@/modules/todos/todo.types";
import { TodoState, updateTodoAction } from "../../../actions";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import FormError from "@/components/forms/form-error";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditForm({ todo }: { todo: Todo }) {
  const initialState: TodoState = {
    errors: {},
    message: "",
    values: {
      title: todo.title,
      text: todo.text ?? "",
    },
  };
  const updateWithId = updateTodoAction.bind(null, todo.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );
  return (
    <form action={formAction}>
      <div>
        <div className="mb-4">
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Title
          </label>
          <div className="relative">
            <Input
              id="title"
              name="title"
              className="block w-full"
              aria-describedby="title-error"
              defaultValue={state.values.title}
            />
          </div>

          <FormError
            errorField={state.errors?.title?.errors}
            errorId="title-error"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="text" className="mb-2 block text-sm font-medium">
            Text
          </label>
          <div className="relative">
            <Textarea
              id="text"
              name="text"
              className="block w-full"
              aria-describedby="text-error"
              defaultValue={state.values.text}
            />
          </div>

          <FormError
            errorField={state.errors?.text?.errors}
            errorId="text-error"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/todos"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Update Todo
        </Button>
      </div>
    </form>
  );
}
