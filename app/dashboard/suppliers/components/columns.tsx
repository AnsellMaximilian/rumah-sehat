"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import {
  getDataTableDetailHref,
  getDataTableEditHref,
} from "@/components/ui/data-table/utils";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";
import { toast } from "sonner";
import { deleteSupplierAction } from "../actions";
import { Supplier } from "@/modules/suppliers/supplier.types";

export const columns: ColumnDef<Supplier>[] = [
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
    accessorKey: "supplierCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => row.original.supplierCode || "-",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bank" />
    ),
    cell: ({ row }) => row.original.bankName || "-",
  },
  {
    accessorKey: "bankAccountNumber",
    header: "Account Number",
    enableSorting: false,
    cell: ({ row }) => row.original.bankAccountNumber || "-",
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
      const supplier = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/suppliers", supplier.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableDetailHref("/dashboard/suppliers", supplier.id)}
            >
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete supplier ${supplier.name}?`}
            description="This action is permanent"
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteSupplierAction(supplier.id);

              if (!res.success) {
                toast.error(res.message);
                return false;
              }

              toast.success(res.message);
              return true;
            }}
            trigger={
              <Button size="sm" variant="destructive">
                Delete
              </Button>
            }
          />
        </ButtonGroup>
      );
    },
  },
];
