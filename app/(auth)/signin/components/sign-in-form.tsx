"use client";

import Link from "next/link";
import { useActionState } from "react";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignInState, signInAction } from "@/app/(auth)/signin/actions";

const initialState: SignInState = {
  errors: {},
  message: "",
  values: {
    email: "",
    password: "",
    rememberMe: false,
    callbackURL: "/dashboard",
  },
};

export default function SignInForm() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values.email}
          aria-describedby="email-error"
        />
        <FormError
          errorField={state.errors?.email?.errors}
          errorId="email-error"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue={state.values.password}
          aria-describedby="password-error"
        />
        <FormError
          errorField={state.errors?.password?.errors}
          errorId="password-error"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="rememberMe"
          defaultChecked={state.values.rememberMe}
          className="size-4 rounded border border-input"
        />
        Remember me
      </label>

      {state.message ? (
        <p className="text-sm text-red-500" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
