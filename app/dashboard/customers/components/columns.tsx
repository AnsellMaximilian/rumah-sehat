"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import {
  getDataTableDetailHref,
  getDataTableEditHref,
} from "@/components/ui/data-table/utils";
import { Customer } from "@/modules/customers/customer.types";
import { deleteCustomerAction } from "../actions";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";
// import { deleteCustomerAction } from "@/app/dashboard/customers/actions";

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "customerCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Code" />
    ),
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const customer = row.original;

      return (
        
        

        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link href={getDataTableEditHref("/dashboard/customers", customer.id)}>
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableDetailHref("/dashboard/customers", customer.id)}
            >
              View
            </Link>
          </Button>
          

           <ConfirmationDialog 
          title={`Are you sure you want to delete customer ${customer.customerCode}?`}
          description="This action is permanent"
          destructive
          onConfirm={async () => {
              const res = await deleteCustomerAction(customer.id);

              if (!res.success) {
                toast.error(res.message);
              }else {
                toast.success(res.message)
              }
            }}
          trigger={
            <Button
            size="sm"
            variant="destructive"
            
          >
            Delete
          </Button>
          }
        />
        </ButtonGroup>

       
      );
    },
  },
];