"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { CreateDeliverySchema } from "@/modules/deliveries/delivery.schema";
import {
  createDeliveryService,
  deleteDeliveryService,
  updateDeliveryService,
} from "@/modules/deliveries/delivery.service";

export type DeliveryItemFormValues = {
  itemMode: string;
  salesLineId: string;
  productId: string;
  quantity: string;
  unitSellPrice: string;
  sourceMode: string;
  notes: string;
};

export type DeliveryFormValues = {
  customerId: string;
  deliveredAt: string;
  recordedAt: string;
  deliveredBy: string;
  status: string;
  notes: string;
  items: DeliveryItemFormValues[];
};

export type DeliveryState = {
  errors: Partial<
    Record<
      | "customerId"
      | "deliveredAt"
      | "recordedAt"
      | "deliveredBy"
      | "status"
      | "notes"
      | "items",
      string[]
    >
  >;
  message: string;
  values: DeliveryFormValues;
};

function getDeliveryValues(formData: FormData): DeliveryFormValues {
  const itemModes = formData.getAll("itemMode").map(String);
  const salesLineIds = formData.getAll("itemSalesLineId").map(String);
  const productIds = formData.getAll("itemProductId").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const unitSellPrices = formData.getAll("itemUnitSellPrice").map(String);
  const sourceModes = formData.getAll("itemSourceMode").map(String);
  const notes = formData.getAll("itemNotes").map(String);
  const itemCount = Math.max(
    itemModes.length,
    salesLineIds.length,
    productIds.length,
    quantities.length,
    unitSellPrices.length,
    sourceModes.length,
    notes.length,
  );

  return {
    customerId: String(formData.get("customerId") ?? ""),
    deliveredAt: String(formData.get("deliveredAt") ?? ""),
    recordedAt: String(formData.get("recordedAt") ?? ""),
    deliveredBy: String(formData.get("deliveredBy") ?? ""),
    status: String(formData.get("status") ?? "recorded"),
    notes: String(formData.get("notes") ?? ""),
    items: Array.from({ length: itemCount }, (_, index) => ({
      itemMode: itemModes[index] ?? "existing",
      salesLineId: salesLineIds[index] ?? "",
      productId: productIds[index] ?? "",
      quantity: quantities[index] ?? "",
      unitSellPrice: unitSellPrices[index] ?? "",
      sourceMode: sourceModes[index] ?? "stock",
      notes: notes[index] ?? "",
    })),
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

function mapValidationErrors(error: ZodError) {
  const fieldErrors: DeliveryState["errors"] = {};

  for (const issue of error.issues) {
    const firstPath = issue.path[0];

    if (firstPath === "items") {
      fieldErrors.items = [...(fieldErrors.items ?? []), issue.message];
      continue;
    }

    if (
      firstPath === "customerId" ||
      firstPath === "deliveredAt" ||
      firstPath === "recordedAt" ||
      firstPath === "deliveredBy" ||
      firstPath === "status" ||
      firstPath === "notes"
    ) {
      fieldErrors[firstPath] = [
        ...(fieldErrors[firstPath] ?? []),
        issue.message,
      ];
    }
  }

  return fieldErrors;
}

export async function createDeliveryAction(
  prevState: DeliveryState,
  formData: FormData,
): Promise<DeliveryState> {
  const values = getDeliveryValues(formData);
  const validatedFields = CreateDeliverySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: mapValidationErrors(validatedFields.error),
      message: "Validation failed",
      values,
    };
  }

  try {
    await createDeliveryService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create delivery"),
      values,
    };
  }

  revalidatePath("/dashboard/deliveries");
  redirect("/dashboard/deliveries");
}

export async function updateDeliveryAction(
  id: string,
  prevState: DeliveryState,
  formData: FormData,
): Promise<DeliveryState> {
  const values = getDeliveryValues(formData);
  const validatedFields = CreateDeliverySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: mapValidationErrors(validatedFields.error),
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateDeliveryService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update delivery"),
      values,
    };
  }

  revalidatePath("/dashboard/deliveries");
  redirect("/dashboard/deliveries");
}

export async function deleteDeliveryAction(id: string) {
  try {
    await deleteDeliveryService({ id });
    revalidatePath("/dashboard/deliveries");
    return { success: true, message: "Delivery deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete delivery" };
  }
}
