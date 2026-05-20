import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SupplierState } from "@/app/dashboard/suppliers/actions";

export default function SupplierFormFields({
  state,
}: {
  state: SupplierState;
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
        <label htmlFor="supplierCode" className="mb-2 block text-sm font-medium">
          Supplier Code <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="supplierCode"
          name="supplierCode"
          className="block w-full"
          aria-describedby="supplierCode-error"
          defaultValue={state.values.supplierCode}
        />
        <FormError
          errorField={state.errors?.supplierCode?.errors}
          errorId="supplierCode-error"
        />
      </div>

      <div>
        <label htmlFor="bankName" className="mb-2 block text-sm font-medium">
          Bank Name <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="bankName"
          name="bankName"
          className="block w-full"
          aria-describedby="bankName-error"
          defaultValue={state.values.bankName}
        />
        <FormError
          errorField={state.errors?.bankName?.errors}
          errorId="bankName-error"
        />
      </div>

      <div>
        <label
          htmlFor="bankAccountName"
          className="mb-2 block text-sm font-medium"
        >
          Account Name <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="bankAccountName"
          name="bankAccountName"
          className="block w-full"
          aria-describedby="bankAccountName-error"
          defaultValue={state.values.bankAccountName}
        />
        <FormError
          errorField={state.errors?.bankAccountName?.errors}
          errorId="bankAccountName-error"
        />
      </div>

      <div>
        <label
          htmlFor="bankAccountNumber"
          className="mb-2 block text-sm font-medium"
        >
          Account Number <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="bankAccountNumber"
          name="bankAccountNumber"
          inputMode="numeric"
          className="block w-full"
          aria-describedby="bankAccountNumber-error"
          defaultValue={state.values.bankAccountNumber}
        />
        <FormError
          errorField={state.errors?.bankAccountNumber?.errors}
          errorId="bankAccountNumber-error"
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
        <label htmlFor="contactInfo" className="mb-2 block text-sm font-medium">
          Contact Info <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="contactInfo"
          name="contactInfo"
          className="block w-full"
          aria-describedby="contactInfo-error"
          defaultValue={state.values.contactInfo}
        />
        <FormError
          errorField={state.errors?.contactInfo?.errors}
          errorId="contactInfo-error"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="notes"
          name="notes"
          className="block w-full"
          aria-describedby="notes-error"
          defaultValue={state.values.notes}
        />
        <FormError
          errorField={state.errors?.notes?.errors}
          errorId="notes-error"
        />
      </div>
    </div>
  );
}
