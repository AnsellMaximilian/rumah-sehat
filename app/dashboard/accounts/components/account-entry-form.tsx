"use client";

import { useActionState } from "react";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_ENTRY_TYPES } from "@/modules/accounts/account.types";
import {
  AccountEntryState,
  createAccountEntryAction,
} from "../actions";

function getDateTimeLocalValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

  return now.toISOString().slice(0, 16);
}

export default function AccountEntryForm({ accountId }: { accountId: string }) {
  const initialState: AccountEntryState = {
    errors: {},
    message: "",
    values: {
      accountId,
      amountDelta: "",
      entryType: "top_up",
      sourceType: "",
      sourceId: "",
      description: "",
      occurredAt: getDateTimeLocalValue(),
    },
  };
  const action = createAccountEntryAction.bind(null, accountId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title="Unable to create account entry"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="amountDelta" className="mb-2 block text-sm font-medium">
            Amount Delta
          </label>
          <Input
            id="amountDelta"
            name="amountDelta"
            type="number"
            step="1"
            defaultValue={state.values.amountDelta}
            aria-describedby="amountDelta-error amountDelta-help"
            placeholder="300000 or -25000"
          />
          <p id="amountDelta-help" className="mt-1 text-xs text-muted-foreground">
            Positive adds to the account. Negative reduces it.
          </p>
          <FormError
            errorField={state.errors?.amountDelta?.errors}
            errorId="amountDelta-error"
          />
        </div>

        <div>
          <label htmlFor="entryType" className="mb-2 block text-sm font-medium">
            Entry Type
          </label>
          <select
            id="entryType"
            name="entryType"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.entryType}
            aria-describedby="entryType-error"
          >
            {ACCOUNT_ENTRY_TYPES.map((entryType) => (
              <option key={entryType} value={entryType}>
                {entryType.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors?.entryType?.errors}
            errorId="entryType-error"
          />
        </div>

        <div>
          <label htmlFor="occurredAt" className="mb-2 block text-sm font-medium">
            Occurred At
          </label>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            defaultValue={state.values.occurredAt}
            aria-describedby="occurredAt-error"
          />
          <FormError
            errorField={state.errors?.occurredAt?.errors}
            errorId="occurredAt-error"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            name="description"
            defaultValue={state.values.description}
            aria-describedby="description-error"
            placeholder="Weekly top-up, manual correction..."
          />
          <FormError
            errorField={state.errors?.description?.errors}
            errorId="description-error"
          />
        </div>
      </div>

      <input name="sourceType" type="hidden" value={state.values.sourceType} />
      <input name="sourceId" type="hidden" value={state.values.sourceId} />

      <Button disabled={pending} type="submit">
        {pending ? "Adding..." : "Add Entry"}
      </Button>
    </form>
  );
}
