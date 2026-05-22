"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import {
  CreateAccountEntrySchema,
  CreateAccountSchema,
} from "@/modules/accounts/account.schema";
import {
  createAccountEntryService,
  createAccountService,
  deleteAccountService,
  updateAccountService,
} from "@/modules/accounts/account.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type AccountFormValues = {
  name: string;
  type: string;
  ownerType: string;
  ownerId: string;
  active: string;
  notes: string;
};

export type AccountState = {
  errors: TreeifiedFieldErrors<AccountFormValues>;
  message: string;
  values: AccountFormValues;
};

export type AccountEntryFormValues = {
  accountId: string;
  amountDelta: string;
  entryType: string;
  sourceType: string;
  sourceId: string;
  description: string;
  occurredAt: string;
};

export type AccountEntryState = {
  errors: TreeifiedFieldErrors<AccountEntryFormValues>;
  message: string;
  values: AccountEntryFormValues;
};

function getAccountValues(formData: FormData): AccountFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "staff_cash"),
    ownerType: String(formData.get("ownerType") ?? ""),
    ownerId: String(formData.get("ownerId") ?? ""),
    active: String(formData.get("active") ?? "true"),
    notes: String(formData.get("notes") ?? ""),
  };
}

function getAccountEntryValues(
  accountId: string,
  formData: FormData,
): AccountEntryFormValues {
  return {
    accountId,
    amountDelta: String(formData.get("amountDelta") ?? ""),
    entryType: String(formData.get("entryType") ?? "top_up"),
    sourceType: String(formData.get("sourceType") ?? ""),
    sourceId: String(formData.get("sourceId") ?? ""),
    description: String(formData.get("description") ?? ""),
    occurredAt: String(formData.get("occurredAt") ?? ""),
  };
}

function getActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function createAccountAction(
  prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const values = getAccountValues(formData);
  const validatedFields = CreateAccountSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createAccountService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create account"),
      values,
    };
  }

  revalidatePath("/dashboard/accounts");
  redirect("/dashboard/accounts");
}

export async function updateAccountAction(
  id: string,
  prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const values = getAccountValues(formData);
  const validatedFields = CreateAccountSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateAccountService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update account"),
      values,
    };
  }

  revalidatePath("/dashboard/accounts");
  redirect("/dashboard/accounts");
}

export async function deleteAccountAction(id: string) {
  try {
    await deleteAccountService({ id });
    revalidatePath("/dashboard/accounts");
    return { success: true, message: "Account deactivated" };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to delete account"),
    };
  }
}

export async function createAccountEntryAction(
  accountId: string,
  prevState: AccountEntryState,
  formData: FormData,
): Promise<AccountEntryState> {
  const values = getAccountEntryValues(accountId, formData);
  const validatedFields = CreateAccountEntrySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createAccountEntryService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create account entry"),
      values,
    };
  }

  revalidatePath(`/dashboard/accounts/${accountId}`);
  redirect(`/dashboard/accounts/${accountId}`);
}
