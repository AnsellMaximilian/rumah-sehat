"use client";

import { useActionState } from "react";
import { createTodoAction, TodoState } from "../actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FormError = ({
  errorField,
  errorId,
}: {
  errorField: string[] | undefined;
  errorId: string;
}) => {
  return (
    <div id={errorId} aria-live="polite" aria-atomic="true">
      {errorField &&
        errorField.map((error: string) => (
          <p className="mt-2 text-sm text-red-500" key={error}>
            {error}
          </p>
        ))}
    </div>
  );
};

export default function CreateForm() {
  const initialState: TodoState = {
    errors: {},
    message: "",
    values: {
      title: "",
      text: "",
    },
  };
  const [state, formAction, pending] = useActionState(
    createTodoAction,
    initialState,
  );

  console.log({ state });

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
          Create Todo
        </Button>
      </div>
    </form>
  );
}
