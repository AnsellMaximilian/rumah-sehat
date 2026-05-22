"use client";

import { useActionState } from "react";
import Link from "next/link";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_TYPES, Account } from "@/modules/accounts/account.types";
import {
  AccountState,
  createAccountAction,
  updateAccountAction,
} from "../actions";

export default function AccountForm({ account }: { account?: Account }) {
  const initialState: AccountState = {
    errors: {},
    message: "",
    values: account
      ? {
          name: account.name,
          type: account.type,
          ownerType: account.ownerType ?? "",
          ownerId: account.ownerId ?? "",
          active: account.active ? "true" : "false",
          notes: account.notes ?? "",
        }
      : {
          name: "",
          type: "staff_cash",
          ownerType: "",
          ownerId: "",
          active: "true",
          notes: "",
        },
  };
  const action = account
    ? updateAccountAction.bind(null, account.id)
    : createAccountAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to save account" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={state.values.name}
            aria-describedby="name-error"
          />
          <FormError errorField={state.errors?.name?.errors} errorId="name-error" />
        </div>

        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.type}
            aria-describedby="type-error"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FormError errorField={state.errors?.type?.errors} errorId="type-error" />
        </div>

        <div>
          <label htmlFor="ownerType" className="mb-2 block text-sm font-medium">
            Owner Type <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="ownerType"
            name="ownerType"
            defaultValue={state.values.ownerType}
            aria-describedby="ownerType-error"
            placeholder="staff, supplier, other"
          />
          <FormError
            errorField={state.errors?.ownerType?.errors}
            errorId="ownerType-error"
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

        <input name="ownerId" type="hidden" value={state.values.ownerId} />

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
          <FormError
            errorField={state.errors?.notes?.errors}
            errorId="notes-error"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/accounts">Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : account ? "Update Account" : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
