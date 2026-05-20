import FormError from "@/components/forms/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductCategoryState } from "@/app/dashboard/product-categories/actions";

export default function ProductCategoryFormFields({
  state,
}: {
  state: ProductCategoryState;
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
