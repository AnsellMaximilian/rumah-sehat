import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  SignInServiceInput,
  SignUpServiceInput,
} from "@/modules/auth/auth.types";

export async function getAuthSessionRepository() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function signInEmailRepository(input: SignInServiceInput) {
  return auth.api.signInEmail({
    body: input,
  });
}

export async function signUpEmailRepository(input: SignUpServiceInput) {
  return auth.api.signUpEmail({
    body: input,
  });
}

export async function signOutRepository() {
  return auth.api.signOut({
    headers: await headers(),
  });
}
