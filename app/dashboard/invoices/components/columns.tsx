"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import {
  getDataTableDetailHref,
  getDataTableEditHref,
} from "@/components/ui/data-table/utils";
import { Invoice } from "@/modules/invoices/invoice.types";
import { deleteInvoiceAction } from "../actions";

export const columns: ColumnDef<Invoice>[] = [
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
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) =>
      row.original.customerCode
        ? `${row.original.customerCode} - ${row.original.customerName}`
        : row.original.customerName || "-",
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice Number" />
    ),
    cell: ({ row }) => row.original.invoiceNumber || "-",
  },
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice Date" />
    ),
  },
  {
    id: "period",
    header: "Period",
    cell: ({ row }) => `${row.original.periodStart} to ${row.original.periodEnd}`,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <Badge>{row.original.status.replaceAll("_", " ")}</Badge>,
  },
  {
    accessorKey: "syncStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sync" />
    ),
    cell: ({ row }) => <Badge>{row.original.syncStatus.replaceAll("_", " ")}</Badge>,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const invoice = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/invoices", invoice.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableDetailHref("/dashboard/invoices", invoice.id)}>
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete invoice ${invoice.invoiceNumber || invoice.id}?`}
            description="Only draft invoices can be deleted."
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteInvoiceAction(invoice.id);

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
