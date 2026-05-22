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
import { DeliveryType } from "@/modules/delivery-types/delivery-type.types";
import { deleteDeliveryTypeAction } from "../actions";

export const columns: ColumnDef<DeliveryType>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "defaultChargeType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Default Charge" />
    ),
    cell: ({ row }) => row.original.defaultChargeType?.replaceAll("_", " ") ?? "-",
  },
  {
    accessorKey: "defaultAccountName",
    header: "Default Account",
    enableSorting: false,
    cell: ({ row }) => row.original.defaultAccountName ?? "-",
  },
  {
    accessorKey: "active",
    header: "Active",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const deliveryType = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/delivery-types", deliveryType.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableDetailHref("/dashboard/delivery-types", deliveryType.id)}>
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Deactivate delivery type ${deliveryType.name}?`}
            description="Existing deliveries keep their delivery type reference. New forms will show it as inactive."
            confirmText="Deactivate"
            pendingText="Deactivating..."
            destructive
            onConfirm={async () => {
              const res = await deleteDeliveryTypeAction(deliveryType.id);

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
