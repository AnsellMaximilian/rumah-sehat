"use server";

import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { SignInSchema } from "@/modules/auth/auth.schemas";
import {
  SignInInput,
  TreeifiedFieldErrors,
} from "@/modules/auth/auth.types";
import { signInService } from "@/modules/auth/auth.service";

export type SignInState = {
  errors: TreeifiedFieldErrors<SignInInput>;
  message: string;
  values: SignInInput;
};

export async function signInAction(
  prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const values: SignInInput = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    rememberMe: formData.get("rememberMe") === "on",
    callbackURL: "/dashboard",
  };

  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await signInService(validatedFields.data);
  } catch (error) {
    console.error(error);

    return {
      errors: {},
      message:
        error instanceof Error ? error.message : "Failed to sign in with email",
      values,
    };
  }

  redirect("/dashboard");
}
