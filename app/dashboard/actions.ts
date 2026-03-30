"use server";

import { redirect } from "next/navigation";
import { signOutService } from "@/modules/auth/auth.service";

export async function signOutAction() {
  await signOutService();
  redirect("/signin");
}
