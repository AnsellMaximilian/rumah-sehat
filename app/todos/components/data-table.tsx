"use client"

import {
  ColumnDef,
  flexRender,
  type OnChangeFn,
  getCoreRowModel,
  SortingState,
  type Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table/view-options"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  TodoPagination,
  TodoSortBy,
  TodoSortOrder,
} from "@/modules/todos/todo.types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "use-debounce"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination: TodoPagination
  query: string
  sortBy: TodoSortBy
  sortOrder: TodoSortOrder
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  query,
  sortBy,
  sortOrder,
}: DataTableProps<TData, TValue>) {
  "use no memo";

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [queryInput, setQueryInput] = useState(query)
  const [debouncedQueryInput] = useDebounce(queryInput, 300)

  const sorting: SortingState = [
    {
      id: sortBy,
      desc: sortOrder === "desc",
    },
  ]

  function getNextHref(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key)
        return
      }

      params.set(key, String(value))
    })

    const nextQuery = params.toString()

    return nextQuery ? `${pathname}?${nextQuery}` : pathname
  }

  function updateQueryParams(
    updates: Record<string, string | number | undefined>,
    navigation: "push" | "replace"
  ) {
    const href = getNextHref(updates)

    startTransition(() => {
      if (navigation === "replace") {
        router.replace(href)
        return
      }

      router.push(href)
    })
  }

  const handleSortingChange: OnChangeFn<SortingState> = (
    updaterOrValue: Updater<SortingState>
  ) => {
    const nextSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue

    const nextSort = nextSorting[0]
    const nextSortBy = (nextSort?.id as TodoSortBy | undefined) ?? "id"
    const nextSortOrder: TodoSortOrder = nextSort
      ? nextSort.desc
        ? "desc"
        : "asc"
      : "desc"

    updateQueryParams(
      {
        page: 1,
        sortBy: nextSort ? nextSortBy : "id",
        sortOrder: nextSortOrder,
      },
      "push"
    )
  }

  useEffect(() => {
    setQueryInput(query)
  }, [query])

  useEffect(() => {
    setRowSelection({})
  }, [data])

  useEffect(() => {
    const normalizedQuery = debouncedQueryInput.trim()

    if (normalizedQuery === query) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    if (normalizedQuery) {
      params.set("query", normalizedQuery)
    } else {
      params.delete("query")
    }

    params.set("page", "1")

    const nextQuery = params.toString()
    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname

    startTransition(() => {
      router.replace(href)
    })
  }, [debouncedQueryInput, query, pathname, router, searchParams, startTransition])

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
      sorting,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Search titles..."
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {table.getSelectedRowModel().rows.length} of{" "}
          {table.getRowModel().rows.length} row(s) selected on this page.
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="overflow-hidden rounded-md border">
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
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        pagination={pagination}
        onPageChange={(page) => updateQueryParams({ page }, "push")}
        onPageSizeChange={(limit) =>
          updateQueryParams(
            {
              limit,
              page: 1,
            },
            "push"
          )
        }
      />
      {isPending ? (
        <p className="mt-2 text-sm text-muted-foreground">Updating todos...</p>
      ) : null}
    </div>
  )
}
