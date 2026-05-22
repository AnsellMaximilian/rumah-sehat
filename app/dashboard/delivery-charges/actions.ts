"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateDeliveryChargeSchema } from "@/modules/delivery-charges/delivery-charge.schema";
import {
  createDeliveryChargeService,
  deleteDeliveryChargeService,
  updateDeliveryChargeService,
} from "@/modules/delivery-charges/delivery-charge.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type DeliveryChargeFormValues = {
  deliveryId: string;
  chargeType: string;
  description: string;
  amount: string;
  billToCustomer: string;
  accountId: string;
  notes: string;
};

export type DeliveryChargeState = {
  errors: TreeifiedFieldErrors<DeliveryChargeFormValues>;
  message: string;
  values: DeliveryChargeFormValues;
};

function getDeliveryChargeValues(formData: FormData): DeliveryChargeFormValues {
  return {
    deliveryId: String(formData.get("deliveryId") ?? ""),
    chargeType: String(formData.get("chargeType") ?? "courier"),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    billToCustomer: String(formData.get("billToCustomer") ?? "true"),
    accountId: String(formData.get("accountId") ?? ""),
    notes: String(formData.get("notes") ?? ""),
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

export async function createDeliveryChargeAction(
  prevState: DeliveryChargeState,
  formData: FormData,
): Promise<DeliveryChargeState> {
  const values = getDeliveryChargeValues(formData);
  const validatedFields = CreateDeliveryChargeSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createDeliveryChargeService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create delivery charge"),
      values,
    };
  }

  revalidatePath("/dashboard/delivery-charges");
  revalidatePath("/dashboard/deliveries");
  redirect("/dashboard/delivery-charges");
}

export async function updateDeliveryChargeAction(
  id: string,
  prevState: DeliveryChargeState,
  formData: FormData,
): Promise<DeliveryChargeState> {
  const values = getDeliveryChargeValues(formData);
  const validatedFields = CreateDeliveryChargeSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateDeliveryChargeService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update delivery charge"),
      values,
    };
  }

  revalidatePath("/dashboard/delivery-charges");
  revalidatePath("/dashboard/deliveries");
  redirect("/dashboard/delivery-charges");
}

export async function deleteDeliveryChargeAction(id: string) {
  try {
    await deleteDeliveryChargeService({ id });
    revalidatePath("/dashboard/delivery-charges");
    revalidatePath("/dashboard/deliveries");
    return { success: true, message: "Delivery charge deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete delivery charge" };
  }
}
