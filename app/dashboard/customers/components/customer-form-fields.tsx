import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { CustomerState } from "@/app/dashboard/customers/actions";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerFormFields({
  state,
}: {
  state: CustomerState;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
    <div className="md:col-span-1">
        <label
          htmlFor="customerCode"
          className="mb-2 block text-sm font-medium"
        >
          Customer Code
        </label>
        <Input
          id="customerCode"
          name="customerCode"
          className="block w-full"
          aria-describedby="customerCode-error"
          defaultValue={state.values.customerCode}
        />
        <FormError
          errorField={state.errors?.customerCode?.errors}
          errorId="customerCode-error"
        />
      </div>
      <div className="col-span-3">
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
        <FormError
          errorField={state.errors?.name?.errors}
          errorId="name-error"
        />
      </div>

      

      

      <div className="md:col-span-4">
        <label
          htmlFor="address"
          className="mb-2 block text-sm font-medium"
        >
          Address <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="address"
          name="address"
          className="block w-full"
          aria-describedby="address-error"
          defaultValue={state.values.address}
        />
        <FormError
          errorField={state.errors?.address?.errors}
          errorId="address-error"
        />
      </div>

 <div className="md:col-span-4">
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-medium"
        >
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
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