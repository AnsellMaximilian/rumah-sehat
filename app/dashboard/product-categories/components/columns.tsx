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
import { deleteProductCategoryAction } from "../actions";
import { ProductCategory } from "@/modules/product-categories/product-category.types";

export const columns: ColumnDef<ProductCategory>[] = [
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
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    cell: ({ row }) => row.original.description || "-",
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
      const productCategory = row.original;

      return (
        <ButtonGroup>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableEditHref(
                "/dashboard/product-categories",
                productCategory.id,
              )}
            >
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={getDataTableDetailHref(
                "/dashboard/product-categories",
                productCategory.id,
              )}
            >
              View
            </Link>
          </Button>
          <ConfirmationDialog
            title={`Are you sure you want to delete category ${productCategory.name}?`}
            description="This action is permanent"
            confirmText="Delete"
            pendingText="Deleting..."
            destructive
            onConfirm={async () => {
              const res = await deleteProductCategoryAction(productCategory.id);

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
