"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import {
  CreateInvoiceSchema,
  CreateManualInvoiceItemSchema,
  UpdateInvoiceSchema,
} from "@/modules/invoices/invoice.schema";
import {
  createInvoiceService,
  createManualInvoiceItemService,
  deleteInvoiceService,
  regenerateDraftInvoiceService,
  updateInvoiceService,
  voidAndReissueInvoiceService,
} from "@/modules/invoices/invoice.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type InvoiceGenerateFormValues = {
  customerId: string;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  invoiceNumber: string;
  notes: string;
};

export type InvoiceGenerateState = {
  errors: TreeifiedFieldErrors<InvoiceGenerateFormValues>;
  message: string;
  values: InvoiceGenerateFormValues;
};

export type InvoiceUpdateFormValues = {
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  syncStatus: string;
  notes: string;
};

export type InvoiceUpdateState = {
  errors: TreeifiedFieldErrors<InvoiceUpdateFormValues>;
  message: string;
  values: InvoiceUpdateFormValues;
};

function getGenerateValues(formData: FormData): InvoiceGenerateFormValues {
  return {
    customerId: String(formData.get("customerId") ?? ""),
    periodStart: String(formData.get("periodStart") ?? ""),
    periodEnd: String(formData.get("periodEnd") ?? ""),
    invoiceDate: String(formData.get("invoiceDate") ?? ""),
    invoiceNumber: String(formData.get("invoiceNumber") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function getUpdateValues(formData: FormData): InvoiceUpdateFormValues {
  return {
    invoiceNumber: String(formData.get("invoiceNumber") ?? ""),
    invoiceDate: String(formData.get("invoiceDate") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    syncStatus: String(formData.get("syncStatus") ?? "current"),
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

export async function createInvoiceAction(
  prevState: InvoiceGenerateState,
  formData: FormData,
): Promise<InvoiceGenerateState> {
  const values = getGenerateValues(formData);
  const validatedFields = CreateInvoiceSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createInvoiceService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create invoice"),
      values,
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/delivery-charges");
  revalidatePath("/dashboard/deliveries");
  revalidatePath("/dashboard/sales-lines");
  redirect("/dashboard/invoices");
}

export async function updateInvoiceAction(
  id: string,
  prevState: InvoiceUpdateState,
  formData: FormData,
): Promise<InvoiceUpdateState> {
  const values = getUpdateValues(formData);
  const validatedFields = UpdateInvoiceSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateInvoiceService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update invoice"),
      values,
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoiceAction(id: string) {
  try {
    await deleteInvoiceService({ id });
    revalidatePath("/dashboard/invoices");
    return { success: true, message: "Invoice deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete invoice" };
  }
}

export async function regenerateDraftInvoiceAction(id: string) {
  try {
    await regenerateDraftInvoiceService({ id });
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to regenerate draft invoice"),
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: true, message: "Draft invoice regenerated" };
}

export async function voidAndReissueInvoiceAction(id: string) {
  try {
    const result = await voidAndReissueInvoiceService({ id });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath(`/dashboard/invoices/${result.replacementInvoice.id}`);

    return {
      success: true,
      message: "Invoice voided and replacement draft created",
      replacementInvoiceId: result.replacementInvoice.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to void and reissue invoice"),
    };
  }
}


export type ManualInvoiceItemFormValues = {
  invoiceId: string;
  lineType: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

export type ManualInvoiceItemState = {
  errors: TreeifiedFieldErrors<ManualInvoiceItemFormValues>;
  message: string;
  values: ManualInvoiceItemFormValues;
};

function getManualInvoiceItemValues(
  invoiceId: string,
  formData: FormData,
): ManualInvoiceItemFormValues {
  return {
    invoiceId,
    lineType: String(formData.get("lineType") ?? "adjustment"),
    description: String(formData.get("description") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unitPrice: String(formData.get("unitPrice") ?? ""),
    amount: String(formData.get("amount") ?? ""),
  };
}

export async function createManualInvoiceItemAction(
  invoiceId: string,
  prevState: ManualInvoiceItemState,
  formData: FormData,
): Promise<ManualInvoiceItemState> {
  const values = getManualInvoiceItemValues(invoiceId, formData);
  const validatedFields = CreateManualInvoiceItemSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createManualInvoiceItemService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to add invoice item"),
      values,
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);

  return {
    errors: {},
    message: "Invoice item added",
    values: {
      invoiceId,
      lineType: values.lineType,
      description: "",
      quantity: "",
      unitPrice: "",
      amount: "",
    },
  };
}
