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
import { deleteDeliveryAction } from "../actions";
import { Delivery } from "@/modules/deliveries/delivery.types";

export const columns: ColumnDef<Delivery>[] = [
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
    accessorKey: "recordedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recorded At" />
    ),
    cell: ({ row }) =>
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(row.original.recordedAt)),
  },
  {
    accessorKey: "deliveredAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Delivered At" />
    ),
    cell: ({ row }) =>
      row.original.deliveredAt
        ? new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(row.original.deliveredAt))
        : "-",
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
      const delivery = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/deliveries", delivery.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableDetailHref("/dashboard/deliveries", delivery.id)}>
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete delivery ${delivery.id}?`}
            description="This action will hide the delivery from normal views."
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteDeliveryAction(delivery.id);

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
