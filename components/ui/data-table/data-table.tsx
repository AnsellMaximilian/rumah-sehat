"use client";

import {
  ColumnDef,
  flexRender,
  type OnChangeFn,
  getCoreRowModel,
  SortingState,
  type Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/ui/data-table/view-options";
import { DataTablePagination } from "@/components/ui/data-table/pagination";
import {
  DataTableLabels,
  DataTablePaginationState,
  DataTableQueryParamKeys,
  DataTableSearchConfig,
  DataTableSortOrder,
  DataTableSortingConfig,
} from "@/components/ui/data-table/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

const DEFAULT_QUERY_PARAM_KEYS: DataTableQueryParamKeys = {
  query: "query",
  page: "page",
  limit: "limit",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: DataTablePaginationState;
  query: string;
  sortBy: string;
  sortOrder: DataTableSortOrder;
  queryParamKeys?: Partial<DataTableQueryParamKeys>;
  search?: DataTableSearchConfig;
  sorting: DataTableSortingConfig;
  labels?: DataTableLabels;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  query,
  sortBy,
  sortOrder,
  queryParamKeys,
  search,
  sorting,
  labels,
}: DataTableProps<TData, TValue>) {
  "use no memo";

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramKeys = {
    ...DEFAULT_QUERY_PARAM_KEYS,
    ...queryParamKeys,
  };
  const queryParamKey = search?.paramKey ?? paramKeys.query;
  const sortByParamKey = sorting.sortByParamKey ?? paramKeys.sortBy;
  const sortOrderParamKey = sorting.sortOrderParamKey ?? paramKeys.sortOrder;
  const [isPending, startTransition] = useTransition();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [queryInput, setQueryInput] = useState(query);
  const [debouncedQueryInput] = useDebounce(
    queryInput,
    search?.debounceMs ?? 300,
  );

  const tableSorting: SortingState = [
    {
      id: sortBy,
      desc: sortOrder === "desc",
    },
  ];

  function getNextHref(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const nextQuery = params.toString();

    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }

  function updateQueryParams(
    updates: Record<string, string | number | undefined>,
    navigation: "push" | "replace",
  ) {
    const href = getNextHref(updates);

    startTransition(() => {
      if (navigation === "replace") {
        router.replace(href);
        return;
      }

      router.push(href);
    });
  }

  const handleSortingChange: OnChangeFn<SortingState> = (
    updaterOrValue: Updater<SortingState>,
  ) => {
    const nextSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(tableSorting)
        : updaterOrValue;

    const nextSort = nextSorting[0];
    const nextSortBy = nextSort?.id ?? sorting.defaultSortBy;
    const nextSortOrder: DataTableSortOrder = nextSort
      ? nextSort.desc
        ? "desc"
        : "asc"
      : "desc";

    updateQueryParams(
      {
        [paramKeys.page]: 1,
        [sortByParamKey]: nextSort ? nextSortBy : sorting.defaultSortBy,
        [sortOrderParamKey]: nextSortOrder,
      },
      "push",
    );
  };

  useEffect(() => {
    setQueryInput(query);
  }, [query]);

  useEffect(() => {
    setRowSelection({});
  }, [data]);

  useEffect(() => {
    const normalizedQuery = debouncedQueryInput.trim();

    if (normalizedQuery === query) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (normalizedQuery) {
      params.set(queryParamKey, normalizedQuery);
    } else {
      params.delete(queryParamKey);
    }

    params.set(paramKeys.page, "1");

    const nextQuery = params.toString();
    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startTransition(() => {
      router.replace(href);
    });
  }, [
    debouncedQueryInput,
    query,
    pathname,
    queryParamKey,
    router,
    searchParams,
    startTransition,
    paramKeys.page,
  ]);

  // TanStack Table is intentionally used here as a headless state/rendering layer.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: false,
    pageCount: pagination.totalPages,
    rowCount: pagination.total,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: tableSorting,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder={search?.placeholder ?? "Search..."}
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {labels?.selectedRowsMessage?.(
            table.getSelectedRowModel().rows.length,
            table.getRowModel().rows.length,
          ) ??
            `${table.getSelectedRowModel().rows.length} of ${table.getRowModel().rows.length} selected on this page.`}
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="overflow-hidden rounded-md border mb-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    index % 2 === 0 ? "bg-muted" : "bg-transparent",
                  )}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {labels?.emptyMessage ?? "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        pagination={pagination}
        onPageChange={(page) =>
          updateQueryParams({ [paramKeys.page]: page }, "push")
        }
        onPageSizeChange={(limit) =>
          updateQueryParams(
            {
              [paramKeys.limit]: limit,
              [paramKeys.page]: 1,
            },
            "push",
          )
        }
        rowLabel={labels?.rowLabel}
        rowsPerPageLabel={labels?.rowsPerPageLabel}
      />
      {isPending ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {labels?.updatingMessage ?? "Updating..."}
        </p>
      ) : null}
    </div>
  );
}
