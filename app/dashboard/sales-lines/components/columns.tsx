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
import { formatRupiah } from "@/lib/utils";
import { deleteSalesLineAction } from "../actions";
import { SalesLine } from "@/modules/sales-lines/sales-line.types";

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

export const columns: ColumnDef<SalesLine>[] = [
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
    accessorKey: "productName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) =>
      row.original.productCode
        ? `${row.original.productCode} - ${row.original.productName}`
        : row.original.productName || "-",
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) => formatQuantity(row.original.quantity),
  },
  {
    accessorKey: "unitSellPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sell Price" />
    ),
    cell: ({ row }) =>
      row.original.unitSellPrice === null
        ? "-"
        : formatRupiah(row.original.unitSellPrice),
  },
  {
    accessorKey: "sourceMode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.sourceMode.replaceAll("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge>{row.original.status.replaceAll("_", " ")}</Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const salesLine = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/sales-lines", salesLine.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableDetailHref("/dashboard/sales-lines", salesLine.id)}>
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete this sales line for ${salesLine.customerName || "customer"}?`}
            description="This action will hide the sales line from normal views."
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteSalesLineAction(salesLine.id);

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
