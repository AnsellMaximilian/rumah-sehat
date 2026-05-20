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
import { deleteSupplierPurchaseAction } from "../actions";
import { SupplierPurchase } from "@/modules/supplier-purchases/supplier-purchase.types";

export const columns: ColumnDef<SupplierPurchase>[] = [
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
    accessorKey: "purchaseDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purchase Date" />
    ),
  },
  {
    accessorKey: "referenceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => row.original.referenceNumber || "-",
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    enableSorting: false,
    cell: ({ row }) => row.original.supplierName || "-",
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.status.replaceAll("_", " ")}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const supplierPurchase = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableEditHref(
                "/dashboard/supplier-purchases",
                supplierPurchase.id,
              )}
            >
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableDetailHref(
                "/dashboard/supplier-purchases",
                supplierPurchase.id,
              )}
            >
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete supplier purchase ${supplierPurchase.referenceNumber || supplierPurchase.id}?`}
            description="This action is permanent"
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteSupplierPurchaseAction(supplierPurchase.id);

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
