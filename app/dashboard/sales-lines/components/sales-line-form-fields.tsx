import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomerSelectOption } from "@/modules/customers/customer.types";
import { ProductSelectOption } from "@/modules/products/product.types";
import { SalesLineState } from "@/app/dashboard/sales-lines/actions";
import {
  SALES_LINE_SOURCE_MODES,
  SALES_LINE_STATUSES,
} from "@/modules/sales-lines/sales-line.types";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";

const SOURCE_MODE_LABELS: Record<
  (typeof SALES_LINE_SOURCE_MODES)[number],
  string
> = {
  stock: "Stock",
  supplier_direct: "Supplier Direct",
  supplier_prepacked: "Supplier Prepacked",
  manual: "Manual",
  correction: "Correction",
  unknown: "Unknown",
};

const STATUS_LABELS: Record<(typeof SALES_LINE_STATUSES)[number], string> = {
  pending: "Pending",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SalesLineFormFields({
  customers,
  products,
  state,
  suppliers,
}: {
  customers: CustomerSelectOption[];
  products: ProductSelectOption[];
  state: SalesLineState;
  suppliers: SupplierSelectOption[];
}) {
  return (
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
        <FormError
          errorField={state.errors?.customerId?.errors}
          errorId="customerId-error"
        />
      </div>

      <div>
        <label htmlFor="productId" className="mb-2 block text-sm font-medium">
          Product
        </label>
        <select
          id="productId"
          name="productId"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.productId}
          aria-describedby="productId-error"
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productCode
                ? `${product.productCode} - ${product.name}`
                : product.name}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.productId?.errors}
          errorId="productId-error"
        />
      </div>

      <div>
        <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
          Quantity
        </label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          defaultValue={state.values.quantity}
          aria-describedby="quantity-error"
        />
        <FormError
          errorField={state.errors?.quantity?.errors}
          errorId="quantity-error"
        />
      </div>

      <div>
        <label htmlFor="unitSellPrice" className="mb-2 block text-sm font-medium">
          Sell Price <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="unitSellPrice"
          name="unitSellPrice"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          defaultValue={state.values.unitSellPrice}
          aria-describedby="unitSellPrice-error unitSellPrice-help"
        />
        <p id="unitSellPrice-help" className="mt-1 text-xs text-muted-foreground">
          Whole rupiah amount only.
        </p>
        <FormError
          errorField={state.errors?.unitSellPrice?.errors}
          errorId="unitSellPrice-error"
        />
      </div>

      <div>
        <label htmlFor="sourceMode" className="mb-2 block text-sm font-medium">
          Source Mode
        </label>
        <select
          id="sourceMode"
          name="sourceMode"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.sourceMode}
          aria-describedby="sourceMode-error"
        >
          {SALES_LINE_SOURCE_MODES.map((sourceMode) => (
            <option key={sourceMode} value={sourceMode}>
              {SOURCE_MODE_LABELS[sourceMode]}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.sourceMode?.errors}
          errorId="sourceMode-error"
        />
      </div>

      <div>
        <label htmlFor="supplierId" className="mb-2 block text-sm font-medium">
          Supplier <span className="text-muted-foreground">(optional)</span>
        </label>
        <select
          id="supplierId"
          name="supplierId"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.supplierId}
          aria-describedby="supplierId-error"
        >
          <option value="">No supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.supplierCode
                ? `${supplier.supplierCode} - ${supplier.name}`
                : supplier.name}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.supplierId?.errors}
          errorId="supplierId-error"
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
          defaultValue={state.values.status}
          aria-describedby="status-error"
        >
          {SALES_LINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.status?.errors}
          errorId="status-error"
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
        <FormError errorField={state.errors?.notes?.errors} errorId="notes-error" />
      </div>
    </div>
  );
}
