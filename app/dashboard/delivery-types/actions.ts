"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import {
  CreateDeliveryTypeSchema,
} from "@/modules/delivery-types/delivery-type.schema";
import {
  createDeliveryTypeService,
  deleteDeliveryTypeService,
  updateDeliveryTypeService,
} from "@/modules/delivery-types/delivery-type.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type DeliveryTypeFormValues = {
  name: string;
  defaultChargeType: string;
  defaultBillToCustomer: string;
  defaultAccountId: string;
  requiresManualAmount: string;
  active: string;
  notes: string;
};

export type DeliveryTypeState = {
  errors: TreeifiedFieldErrors<DeliveryTypeFormValues>;
  message: string;
  values: DeliveryTypeFormValues;
};

function getDeliveryTypeValues(formData: FormData): DeliveryTypeFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    defaultChargeType: String(formData.get("defaultChargeType") ?? ""),
    defaultBillToCustomer: String(formData.get("defaultBillToCustomer") ?? "true"),
    defaultAccountId: String(formData.get("defaultAccountId") ?? ""),
    requiresManualAmount: String(formData.get("requiresManualAmount") ?? "true"),
    active: String(formData.get("active") ?? "true"),
    notes: String(formData.get("notes") ?? ""),
  };
}

function getActionErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function createDeliveryTypeAction(
  prevState: DeliveryTypeState,
  formData: FormData,
): Promise<DeliveryTypeState> {
  const values = getDeliveryTypeValues(formData);
  const validatedFields = CreateDeliveryTypeSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createDeliveryTypeService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create delivery type"),
      values,
    };
  }

  revalidatePath("/dashboard/delivery-types");
  redirect("/dashboard/delivery-types");
}

export async function updateDeliveryTypeAction(
  id: string,
  prevState: DeliveryTypeState,
  formData: FormData,
): Promise<DeliveryTypeState> {
  const values = getDeliveryTypeValues(formData);
  const validatedFields = CreateDeliveryTypeSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateDeliveryTypeService({ id, ...validatedFields.data });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update delivery type"),
      values,
    };
  }

  revalidatePath("/dashboard/delivery-types");
  redirect("/dashboard/delivery-types");
}

export async function deleteDeliveryTypeAction(id: string) {
  try {
    await deleteDeliveryTypeService({ id });
    revalidatePath("/dashboard/delivery-types");
    return { success: true, message: "Delivery type deactivated" };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to deactivate delivery type"),
    };
  }
}
