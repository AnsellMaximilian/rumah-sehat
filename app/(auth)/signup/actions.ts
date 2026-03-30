"use server";

import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { SignUpSchema } from "@/modules/auth/auth.schemas";
import {
  SignUpInput,
  TreeifiedFieldErrors,
} from "@/modules/auth/auth.types";
import { signUpService } from "@/modules/auth/auth.service";

export type SignUpState = {
  errors: TreeifiedFieldErrors<SignUpInput>;
  message: string;
  values: SignUpInput;
};

export async function signUpAction(
  prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const values: SignUpInput = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    rememberMe: formData.get("rememberMe") === "on",
    callbackURL: "/dashboard",
  };

  const validatedFields = SignUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await signUpService({
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      rememberMe: validatedFields.data.rememberMe,
      callbackURL: validatedFields.data.callbackURL,
    });
  } catch (error) {
    console.error(error);

    return {
      errors: {},
      message:
        error instanceof Error ? error.message : "Failed to create account",
      values,
    };
  }

  redirect("/dashboard");
}
