"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomerSelectOption } from "@/modules/customers/customer.types";
import {
  createDeliveryAction,
  DeliveryItemFormValues,
  DeliveryState,
  updateDeliveryAction,
} from "@/app/dashboard/deliveries/actions";
import {
  DeliveryDetail,
  DELIVERY_DIRECT_SOURCE_MODES,
  DELIVERY_STATUSES,
} from "@/modules/deliveries/delivery.types";
import { ProductSelectOption } from "@/modules/products/product.types";
import { SalesLineSelectOption } from "@/modules/sales-lines/sales-line.types";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";
import { DeliveryTypeSelectOption } from "@/modules/delivery-types/delivery-type.types";

const STATUS_LABELS: Record<(typeof DELIVERY_STATUSES)[number], string> = {
  recorded: "Recorded",
  delivered: "Delivered",
  void: "Void",
};

function createEmptyItem(): DeliveryItemFormValues {
  return {
    itemMode: "existing",
    salesLineId: "",
    productId: "",
    supplierId: "",
    quantity: "",
    unitSellPrice: "",
    sourceMode: "stock",
    notes: "",
  };
}

function formatDateTimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function DeliveryForm({
  customers,
  delivery,
  deliveryTypes,
  productOptions,
  salesLineOptions,
  suppliers,
}: {
  customers: CustomerSelectOption[];
  delivery?: DeliveryDetail;
  deliveryTypes: DeliveryTypeSelectOption[];
  productOptions: ProductSelectOption[];
  salesLineOptions: SalesLineSelectOption[];
  suppliers: SupplierSelectOption[];
}) {
  const initialState: DeliveryState = {
    errors: {},
    message: "",
    values: delivery
      ? {
          customerId: delivery.customerId,
          deliveredAt: delivery.deliveredAt
            ? formatDateTimeLocal(new Date(delivery.deliveredAt))
            : "",
          recordedAt: formatDateTimeLocal(new Date(delivery.recordedAt)),
          deliveredBy: delivery.deliveredBy ?? "",
          deliveryTypeId: delivery.deliveryTypeId ?? "",
          status: delivery.status,
          notes: delivery.notes ?? "",
          items:
            delivery.items.length > 0
              ? delivery.items.map((item) => ({
                  itemMode:
                    item.salesLineSourceDeliveryId === delivery.id ? "direct" : "existing",
                  salesLineId: item.salesLineId ?? "",
                  productId: item.productId,
                  supplierId: item.salesLineSupplierId ?? "",
                  quantity: String(item.quantity),
                  unitSellPrice:
                    item.unitSellPrice === null ? "" : String(item.unitSellPrice),
                  sourceMode: item.sourceMode,
                  notes: item.notes ?? "",
                }))
              : [createEmptyItem()],
        }
      : {
          customerId: "",
          deliveredAt: "",
          recordedAt: formatDateTimeLocal(new Date()),
          deliveredBy: "",
          deliveryTypeId: "",
          status: "recorded",
          notes: "",
          items: [createEmptyItem()],
        },
  };

  const action = delivery
    ? updateDeliveryAction.bind(null, delivery.id)
    : createDeliveryAction;

  const [state, formAction, pending] = useActionState(action, initialState);
  const [items, setItems] = useState<DeliveryItemFormValues[]>(
    state.values.items.length > 0 ? state.values.items : [createEmptyItem()],
  );

  function updateItem(
    index: number,
    field: keyof DeliveryItemFormValues,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function changeItemMode(index: number, nextMode: string) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (nextMode === item.itemMode) {
          return item;
        }

        if (nextMode === "direct") {
          return {
            ...item,
            itemMode: "direct",
            salesLineId: "",
            productId: "",
            supplierId: "",
            quantity: "",
            unitSellPrice: "",
            sourceMode: "stock",
          };
        }

        return {
          ...item,
          itemMode: "existing",
          salesLineId: "",
          productId: "",
          supplierId: "",
          quantity: "",
          unitSellPrice: "",
          sourceMode: "stock",
        };
      }),
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
          title={delivery ? "Unable to update delivery" : "Unable to create delivery"}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="customerId" className="mb-2 block text-sm font-medium">
            Customer
          </label>
          <select
            id="customerId"
            name="customerId"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.customerId}
            aria-describedby="customerId-error"
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customerCode} - {customer.name}
              </option>
            ))}
          </select>
          <FormError errorField={state.errors.customerId} errorId="customerId-error" />
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.status}
            aria-describedby="status-error"
          >
            {DELIVERY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <FormError errorField={state.errors.status} errorId="status-error" />
        </div>

        <div>
          <label htmlFor="recordedAt" className="mb-2 block text-sm font-medium">
            Recorded At
          </label>
          <Input
            id="recordedAt"
            name="recordedAt"
            type="datetime-local"
            defaultValue={state.values.recordedAt}
            aria-describedby="recordedAt-error"
          />
          <FormError
            errorField={state.errors.recordedAt}
            errorId="recordedAt-error"
          />
        </div>

        <div>
          <label htmlFor="deliveredAt" className="mb-2 block text-sm font-medium">
            Delivered At <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="deliveredAt"
            name="deliveredAt"
            type="datetime-local"
            defaultValue={state.values.deliveredAt}
            aria-describedby="deliveredAt-error"
          />
          <FormError
            errorField={state.errors.deliveredAt}
            errorId="deliveredAt-error"
          />
        </div>

        <div>
          <label htmlFor="deliveryTypeId" className="mb-2 block text-sm font-medium">
            Delivery Type <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="deliveryTypeId"
            name="deliveryTypeId"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.deliveryTypeId}
            aria-describedby="deliveryTypeId-error deliveryTypeId-help"
          >
            <option value="">No delivery type</option>
            {deliveryTypes.map((deliveryType) => (
              <option key={deliveryType.id} value={deliveryType.id}>
                {deliveryType.name}
                {!deliveryType.active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          <p id="deliveryTypeId-help" className="mt-1 text-xs text-muted-foreground">
            Stores the method/default profile for this delivery. Charges can still be overridden.
          </p>
          <FormError
            errorField={state.errors.deliveryTypeId}
            errorId="deliveryTypeId-error"
          />
        </div>

        <div>
          <label htmlFor="deliveredBy" className="mb-2 block text-sm font-medium">
            Delivered By <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="deliveredBy"
            name="deliveredBy"
            defaultValue={state.values.deliveredBy}
            aria-describedby="deliveredBy-error"
          />
          <FormError
            errorField={state.errors.deliveredBy}
            errorId="deliveredBy-error"
          />
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
            <h2 className="text-lg font-semibold">Delivery Items</h2>
            <p className="text-sm text-muted-foreground">
              Link one or more existing sales lines to this physical delivery event.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            Add Item
          </Button>
        </div>

        <FormError errorField={state.errors.items} errorId="items-error" />

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border p-4">
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
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Item Type
                  </label>
                  <select
                    name="itemMode"
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                    value={item.itemMode}
                    onChange={(event) => changeItemMode(index, event.target.value)}
                  >
                    <option value="existing">Use existing sales line</option>
                    <option value="direct">Create from this delivery</option>
                  </select>
                </div>

                {item.itemMode === "existing" ? (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Sales Line
                    </label>
                    <select
                      name="itemSalesLineId"
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      value={item.salesLineId}
                      onChange={(event) =>
                        updateItem(index, "salesLineId", event.target.value)
                      }
                    >
                      <option value="">Select sales line</option>
                      {salesLineOptions.map((salesLine) => (
                        <option key={salesLine.id} value={salesLine.id}>
                          {salesLine.customerCode} - {salesLine.customerName} |{" "}
                          {salesLine.productCode
                            ? `${salesLine.productCode} - ${salesLine.productName}`
                            : salesLine.productName}{" "}
                          | Qty {salesLine.quantity} | {salesLine.status}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name="itemProductId" value="" />
                    <input type="hidden" name="itemQuantity" value="" />
                    <input type="hidden" name="itemUnitSellPrice" value="" />
                    <input type="hidden" name="itemSourceMode" value="" />
                    <input type="hidden" name="itemSupplierId" value="" />
                  </div>
                ) : (
                  <>
                    <input
                      type="hidden"
                      name="itemSalesLineId"
                      value={item.salesLineId}
                    />
                    <div className="md:col-span-2">
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
                            {!product.active ? " (inactive)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium">
                        Supplier{" "}
                        <span className="text-muted-foreground">
                          {item.sourceMode === "supplier_direct" ||
                          item.sourceMode === "supplier_prepacked"
                            ? "(required)"
                            : "(optional)"}
                        </span>
                      </label>
                      <select
                        name="itemSupplierId"
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                        value={item.supplierId}
                        onChange={(event) =>
                          updateItem(index, "supplierId", event.target.value)
                        }
                      >
                        <option value="">No supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.supplierCode
                              ? `${supplier.supplierCode} - ${supplier.name}`
                              : supplier.name}
                            {!supplier.active ? " (inactive)" : ""}
                          </option>
                        ))}
                      </select>
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
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Sell Price <span className="text-muted-foreground">(optional)</span>
                      </label>
                      <Input
                        name="itemUnitSellPrice"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={item.unitSellPrice}
                        onChange={(event) =>
                          updateItem(index, "unitSellPrice", event.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium">
                        Source Mode
                      </label>
                      <select
                        name="itemSourceMode"
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                        value={item.sourceMode}
                        onChange={(event) =>
                          updateItem(index, "sourceMode", event.target.value)
                        }
                      >
                        {DELIVERY_DIRECT_SOURCE_MODES.map((sourceMode) => (
                          <option key={sourceMode} value={sourceMode}>
                            {sourceMode === "stock" ? "Stock" : "Manual"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

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
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/deliveries"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {delivery ? "Update Delivery" : "Create Delivery"}
        </Button>
      </div>
    </form>
  );
}
