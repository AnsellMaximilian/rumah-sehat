"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { CreateSupplierPurchaseSchema } from "@/modules/supplier-purchases/supplier-purchase.schema";
import {
  createSupplierPurchaseService,
  deleteSupplierPurchaseService,
  updateSupplierPurchaseService,
} from "@/modules/supplier-purchases/supplier-purchase.service";

export type SupplierPurchaseItemFormValues = {
  id: string;
  productId: string;
  quantity: string;
  unitCost: string;
  destinationType: string;
  customerId: string;
  notes: string;
};

export type SupplierPurchaseFormValues = {
  supplierId: string;
  purchaseDate: string;
  referenceNumber: string;
  status: string;
  notes: string;
  items: SupplierPurchaseItemFormValues[];
};

export type SupplierPurchaseState = {
  errors: Partial<
    Record<
      | "supplierId"
      | "purchaseDate"
      | "referenceNumber"
      | "status"
      | "notes"
      | "items",
      string[]
    >
  >;
  message: string;
  values: SupplierPurchaseFormValues;
};

function getSupplierPurchaseValues(formData: FormData): SupplierPurchaseFormValues {
  const itemIds = formData.getAll("itemId").map(String);
  const productIds = formData.getAll("itemProductId").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const unitCosts = formData.getAll("itemUnitCost").map(String);
  const destinationTypes = formData.getAll("itemDestinationType").map(String);
  const customerIds = formData.getAll("itemCustomerId").map(String);
  const notes = formData.getAll("itemNotes").map(String);
  const itemCount = Math.max(
    itemIds.length,
    productIds.length,
    quantities.length,
    unitCosts.length,
    destinationTypes.length,
    customerIds.length,
    notes.length,
  );

  return {
    supplierId: String(formData.get("supplierId") ?? ""),
    purchaseDate: String(formData.get("purchaseDate") ?? ""),
    referenceNumber: String(formData.get("referenceNumber") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    notes: String(formData.get("notes") ?? ""),
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: itemIds[index] ?? "",
      productId: productIds[index] ?? "",
      quantity: quantities[index] ?? "",
      unitCost: unitCosts[index] ?? "",
      destinationType: destinationTypes[index] ?? "unknown",
      customerId: customerIds[index] ?? "",
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
  const fieldErrors: SupplierPurchaseState["errors"] = {};

  for (const issue of error.issues) {
    const firstPath = issue.path[0];

    if (firstPath === "items") {
      fieldErrors.items = [...(fieldErrors.items ?? []), issue.message];
      continue;
    }

    if (
      firstPath === "supplierId" ||
      firstPath === "purchaseDate" ||
      firstPath === "referenceNumber" ||
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

export async function createSupplierPurchaseAction(
  prevState: SupplierPurchaseState,
  formData: FormData,
): Promise<SupplierPurchaseState> {
  const values = getSupplierPurchaseValues(formData);
  const validatedFields = CreateSupplierPurchaseSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: mapValidationErrors(validatedFields.error),
      message: "Validation failed",
      values,
    };
  }

  try {
    await createSupplierPurchaseService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create supplier purchase"),
      values,
    };
  }

  revalidatePath("/dashboard/supplier-purchases");
  redirect("/dashboard/supplier-purchases");
}

export async function updateSupplierPurchaseAction(
  id: string,
  prevState: SupplierPurchaseState,
  formData: FormData,
): Promise<SupplierPurchaseState> {
  const values = getSupplierPurchaseValues(formData);
  const validatedFields = CreateSupplierPurchaseSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: mapValidationErrors(validatedFields.error),
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateSupplierPurchaseService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update supplier purchase"),
      values,
    };
  }

  revalidatePath("/dashboard/supplier-purchases");
  redirect("/dashboard/supplier-purchases");
}

export async function deleteSupplierPurchaseAction(id: string) {
  try {
    await deleteSupplierPurchaseService({ id });
    revalidatePath("/dashboard/supplier-purchases");
    return { success: true, message: "Supplier purchase deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete supplier purchase" };
  }
}
