"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createSupplierPurchaseAction,
  SupplierPurchaseItemFormValues,
  SupplierPurchaseState,
  updateSupplierPurchaseAction,
} from "@/app/dashboard/supplier-purchases/actions";
import {
  SUPPLIER_PURCHASE_DESTINATION_TYPES,
  SUPPLIER_PURCHASE_STATUSES,
  SupplierPurchaseDetail,
} from "@/modules/supplier-purchases/supplier-purchase.types";
import {
  getSupplierPurchaseItemWorkflowHint,
  getSupplierPurchaseStatusWorkflowHint,
} from "@/modules/supplier-purchases/supplier-purchase-workflow";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";
import { ProductSelectOption } from "@/modules/products/product.types";
import { CustomerSelectOption } from "@/modules/customers/customer.types";

const STATUS_LABELS: Record<(typeof SUPPLIER_PURCHASE_STATUSES)[number], string> = {
  draft: "Draft",
  ordered: "Ordered",
  confirmed: "Confirmed",
  arrived: "Arrived",
  delivered_by_supplier: "Delivered by Supplier",
  closed: "Closed",
  void: "Void",
};

const DESTINATION_LABELS: Record<
  (typeof SUPPLIER_PURCHASE_DESTINATION_TYPES)[number],
  string
> = {
  stock: "Stock",
  customer_direct: "Customer Direct",
  customer_prepacked: "Customer Prepacked",
  record_only: "Record Only",
  unknown: "Unknown",
};

function createEmptyItem(): SupplierPurchaseItemFormValues {
  return {
    id: "",
    productId: "",
    quantity: "",
    unitCost: "",
    destinationType: "unknown",
    customerId: "",
    notes: "",
  };
}

type SupplierPurchaseFormProps = {
  customers: CustomerSelectOption[];
  defaultPurchaseDate: string;
  productOptions: ProductSelectOption[];
  purchase?: SupplierPurchaseDetail;
  suppliers: SupplierSelectOption[];
};

export default function SupplierPurchaseForm({
  customers,
  defaultPurchaseDate,
  productOptions,
  purchase,
  suppliers,
}: SupplierPurchaseFormProps) {
  const initialState: SupplierPurchaseState = {
    errors: {},
    message: "",
    values: purchase
      ? {
          supplierId: purchase.supplierId,
          purchaseDate: purchase.purchaseDate,
          referenceNumber: purchase.referenceNumber ?? "",
          status: purchase.status,
          notes: purchase.notes ?? "",
          items:
            purchase.items.length > 0
              ? purchase.items.map((item) => ({
                  id: item.id,
                  productId: item.productId,
                  quantity: String(item.quantity),
                  unitCost: item.unitCost === null ? "" : String(item.unitCost),
                  destinationType: item.destinationType,
                  customerId: item.customerId ?? "",
                  notes: item.notes ?? "",
                }))
              : [createEmptyItem()],
        }
      : {
          supplierId: "",
          purchaseDate: defaultPurchaseDate,
          referenceNumber: "",
          status: "draft",
          notes: "",
          items: [createEmptyItem()],
        },
  };

  const action = purchase
    ? updateSupplierPurchaseAction.bind(null, purchase.id)
    : createSupplierPurchaseAction;

  const [state, formAction, pending] = useActionState(action, initialState);
  const [status, setStatus] = useState(state.values.status);
  const [items, setItems] = useState<SupplierPurchaseItemFormValues[]>(
    state.values.items.length > 0 ? state.values.items : [createEmptyItem()],
  );

  function updateItem(
    index: number,
    field: keyof SupplierPurchaseItemFormValues,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  }

  function removeItem(index: number) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return [createEmptyItem()];
      }

      return currentItems.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title={
            purchase
              ? "Unable to update supplier purchase"
              : "Unable to create supplier purchase"
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="supplierId" className="mb-2 block text-sm font-medium">
            Supplier
          </label>
          <select
            id="supplierId"
            name="supplierId"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.supplierId}
            aria-describedby="supplierId-error"
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplierCode
                  ? `${supplier.supplierCode} - ${supplier.name}`
                  : supplier.name}
                {!supplier.active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors.supplierId}
            errorId="supplierId-error"
          />
        </div>

        <div>
          <label htmlFor="purchaseDate" className="mb-2 block text-sm font-medium">
            Purchase Date
          </label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={state.values.purchaseDate}
            aria-describedby="purchaseDate-error"
          />
          <FormError
            errorField={state.errors.purchaseDate}
            errorId="purchaseDate-error"
          />
        </div>

        <div>
          <label
            htmlFor="referenceNumber"
            className="mb-2 block text-sm font-medium"
          >
            Reference Number <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            defaultValue={state.values.referenceNumber}
            aria-describedby="referenceNumber-error"
          />
          <FormError
            errorField={state.errors.referenceNumber}
            errorId="referenceNumber-error"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-describedby="status-error"
          >
            {SUPPLIER_PURCHASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            {getSupplierPurchaseStatusWorkflowHint(status)}
          </p>
          <FormError errorField={state.errors.status} errorId="status-error" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={state.values.notes}
            aria-describedby="notes-error"
          />
          <FormError errorField={state.errors.notes} errorId="notes-error" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Purchase Items</h2>
            <p className="text-sm text-muted-foreground">
              Record each purchased line item with destination and optional customer.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            Add Item
          </Button>
        </div>

        <FormError errorField={state.errors.items} errorId="items-error" />

        <div className="space-y-4">
          {items.map((item, index) => {
            const lineTotal =
              item.quantity && item.unitCost
                ? Math.round(Number(item.quantity) * Number(item.unitCost))
                : null;
            const workflowHint = getSupplierPurchaseItemWorkflowHint({
              customerId: item.customerId || null,
              destinationType: item.destinationType,
              status,
            });
            const workflowToneClassName =
              workflowHint.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : workflowHint.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-border bg-muted/50 text-muted-foreground";

            return (
              <div key={index} className="rounded-lg border p-4">
                <input type="hidden" name="itemId" value={item.id} />
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="font-medium">Item {index + 1}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Product
                    </label>
                    <select
                      name="itemProductId"
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(index, "productId", event.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.productCode
                            ? `${product.productCode} - ${product.name}`
                            : product.name}
                          {product.supplierName ? ` (${product.supplierName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Destination
                    </label>
                    <select
                      name="itemDestinationType"
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      value={item.destinationType}
                      onChange={(event) =>
                        updateItem(index, "destinationType", event.target.value)
                      }
                    >
                      {SUPPLIER_PURCHASE_DESTINATION_TYPES.map((destinationType) => (
                        <option key={destinationType} value={destinationType}>
                          {DESTINATION_LABELS[destinationType]}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {workflowHint.summary}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Quantity
                    </label>
                    <Input
                      name="itemQuantity"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Unit Cost <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      name="itemUnitCost"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={item.unitCost}
                      onChange={(event) =>
                        updateItem(index, "unitCost", event.target.value)
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Whole rupiah amount only.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Customer <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <select
                      name="itemCustomerId"
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      value={item.customerId}
                      onChange={(event) =>
                        updateItem(index, "customerId", event.target.value)
                      }
                    >
                      <option value="">No customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.customerCode} - {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Line Total
                    </label>
                    <div className="flex h-10 items-center rounded-lg border bg-muted px-3 text-sm">
                      {lineTotal === null
                        ? "-"
                        : new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(lineTotal)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div
                      className={`rounded-lg border px-3 py-2 text-sm ${workflowToneClassName}`}
                    >
                      {workflowHint.detail}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Item Notes <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                      name="itemNotes"
                      value={item.notes}
                      onChange={(event) =>
                        updateItem(index, "notes", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/supplier-purchases"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {purchase ? "Update Supplier Purchase" : "Create Supplier Purchase"}
        </Button>
      </div>
    </form>
  );
}
