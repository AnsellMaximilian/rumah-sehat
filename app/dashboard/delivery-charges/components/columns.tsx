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
import { formatRupiah } from "@/lib/utils";
import { DeliveryCharge } from "@/modules/delivery-charges/delivery-charge.types";
import { deleteDeliveryChargeAction } from "../actions";

export const columns: ColumnDef<DeliveryCharge>[] = [
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
    accessorKey: "deliveryRecordedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Delivery" />
    ),
    cell: ({ row }) =>
      row.original.deliveryRecordedAt
        ? new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(row.original.deliveryRecordedAt))
        : "-",
  },
  {
    accessorKey: "chargeType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Charge Type" />
    ),
    cell: ({ row }) => <Badge>{row.original.chargeType.replaceAll("_", " ")}</Badge>,
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => formatRupiah(row.original.amount),
  },
  {
    accessorKey: "billToCustomer",
    header: "Bill To Customer",
    cell: ({ row }) => (row.original.billToCustomer ? "Yes" : "No"),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const deliveryCharge = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableEditHref(
                "/dashboard/delivery-charges",
                deliveryCharge.id,
              )}
            >
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableDetailHref(
                "/dashboard/delivery-charges",
                deliveryCharge.id,
              )}
            >
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete ${deliveryCharge.description}?`}
            description="This action will hide the delivery charge from normal views."
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteDeliveryChargeAction(deliveryCharge.id);

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
