"use client";

import Link from "next/link";
import { useActionState } from "react";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignUpState, signUpAction } from "@/app/(auth)/signup/actions";

const initialState: SignUpState = {
  errors: {},
  message: "",
  values: {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
    callbackURL: "/dashboard",
  },
};

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={state.values.name}
          aria-describedby="name-error"
        />
        <FormError
          errorField={state.errors?.name?.errors}
          errorId="name-error"
        />
      </div>

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
          autoComplete="new-password"
          defaultValue={state.values.password}
          aria-describedby="password-error"
        />
        <FormError
          errorField={state.errors?.password?.errors}
          errorId="password-error"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          defaultValue={state.values.confirmPassword}
          aria-describedby="confirm-password-error"
        />
        <FormError
          errorField={state.errors?.confirmPassword?.errors}
          errorId="confirm-password-error"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="rememberMe"
          defaultChecked={state.values.rememberMe}
          className="size-4 rounded border border-input"
        />
        Keep me signed in
      </label>

      {state.message ? (
        <p className="text-sm text-red-500" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
