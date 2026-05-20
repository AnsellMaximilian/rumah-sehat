import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductState } from "@/app/dashboard/products/actions";
import { PRODUCT_FULFILLMENT_MODES } from "@/modules/products/product.types";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";

const FULFILLMENT_MODE_LABELS: Record<
  (typeof PRODUCT_FULFILLMENT_MODES)[number],
  string
> = {
  stock: "Stock",
  supplier_direct: "Supplier Direct",
  supplier_prepacked: "Supplier Prepacked",
  manual: "Manual",
  unknown: "Unknown",
};

export default function ProductFormFields({
  state,
  suppliers,
}: {
  state: ProductState;
  suppliers: SupplierSelectOption[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          className="block w-full"
          aria-describedby="name-error"
          defaultValue={state.values.name}
        />
        <FormError errorField={state.errors?.name?.errors} errorId="name-error" />
      </div>

      <div>
        <label htmlFor="productCode" className="mb-2 block text-sm font-medium">
          Product Code <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="productCode"
          name="productCode"
          className="block w-full"
          aria-describedby="productCode-error"
          defaultValue={state.values.productCode}
        />
        <FormError
          errorField={state.errors?.productCode?.errors}
          errorId="productCode-error"
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
              {!supplier.active ? " (inactive)" : ""}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.supplierId?.errors}
          errorId="supplierId-error"
        />
      </div>

      <div>
        <label htmlFor="defaultUnit" className="mb-2 block text-sm font-medium">
          Default Unit <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="defaultUnit"
          name="defaultUnit"
          className="block w-full"
          aria-describedby="defaultUnit-error"
          defaultValue={state.values.defaultUnit}
          placeholder="kg, pack, pcs..."
        />
        <FormError
          errorField={state.errors?.defaultUnit?.errors}
          errorId="defaultUnit-error"
        />
      </div>

      <div>
        <label htmlFor="cost" className="mb-2 block text-sm font-medium">
          Cost
        </label>
        <Input
          id="cost"
          name="cost"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          className="block w-full"
          aria-describedby="cost-error cost-help"
          defaultValue={state.values.cost}
          placeholder="15000"
        />
        <p id="cost-help" className="mt-1 text-xs text-muted-foreground">
          Whole rupiah amount only.
        </p>
        <FormError errorField={state.errors?.cost?.errors} errorId="cost-error" />
      </div>

      <div>
        <label htmlFor="price" className="mb-2 block text-sm font-medium">
          Price
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          className="block w-full"
          aria-describedby="price-error price-help"
          defaultValue={state.values.price}
          placeholder="20000"
        />
        <p id="price-help" className="mt-1 text-xs text-muted-foreground">
          Whole rupiah amount only.
        </p>
        <FormError
          errorField={state.errors?.price?.errors}
          errorId="price-error"
        />
      </div>

      <div>
        <label
          htmlFor="defaultFulfillmentMode"
          className="mb-2 block text-sm font-medium"
        >
          Default Fulfillment Mode
        </label>
        <select
          id="defaultFulfillmentMode"
          name="defaultFulfillmentMode"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.defaultFulfillmentMode}
          aria-describedby="defaultFulfillmentMode-error"
        >
          {PRODUCT_FULFILLMENT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {FULFILLMENT_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
        <FormError
          errorField={state.errors?.defaultFulfillmentMode?.errors}
          errorId="defaultFulfillmentMode-error"
        />
      </div>

      <div>
        <label htmlFor="trackStock" className="mb-2 block text-sm font-medium">
          Track Stock
        </label>
        <select
          id="trackStock"
          name="trackStock"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.trackStock}
          aria-describedby="trackStock-error"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <FormError
          errorField={state.errors?.trackStock?.errors}
          errorId="trackStock-error"
        />
      </div>

      <div>
        <label htmlFor="active" className="mb-2 block text-sm font-medium">
          Active
        </label>
        <select
          id="active"
          name="active"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          defaultValue={state.values.active}
          aria-describedby="active-error"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <FormError
          errorField={state.errors?.active?.errors}
          errorId="active-error"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="description"
          name="description"
          className="block w-full"
          aria-describedby="description-error"
          defaultValue={state.values.description}
        />
        <FormError
          errorField={state.errors?.description?.errors}
          errorId="description-error"
        />
      </div>
    </div>
  );
}
