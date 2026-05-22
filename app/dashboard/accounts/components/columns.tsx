"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import {
  getDataTableDetailHref,
  getDataTableEditHref,
} from "@/components/ui/data-table/utils";
import { formatRupiah } from "@/lib/utils";
import { Account } from "@/modules/accounts/account.types";
import { deleteAccountAction } from "../actions";

export const columns: ColumnDef<Account>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => row.original.type.replaceAll("_", " "),
  },
  {
    accessorKey: "currentBalance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => formatRupiah(row.original.currentBalance),
  },
  {
    accessorKey: "active",
    header: "Active",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.active ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const account = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/accounts", account.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableDetailHref("/dashboard/accounts", account.id)}>
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Deactivate account ${account.name}?`}
            description="Ledger history is preserved. The account can be reactivated from edit."
            confirmText="Deactivate"
            pendingText="Deactivating..."
            destructive
            onConfirm={async () => {
              const res = await deleteAccountAction(account.id);

              if (!res.success) {
                toast.error(res.message);
                return false;
              }

              toast.success(res.message);
              return true;
            }}
            trigger={
              <Button size="sm" variant="destructive">
                Deactivate
              </Button>
            }
          />
        </ButtonGroup>
      );
    },
  },
];
