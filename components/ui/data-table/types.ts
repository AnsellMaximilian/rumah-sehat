export type DataTableSortOrder = "asc" | "desc"

export interface DataTablePaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DataTableQueryParamKeys {
  query: string
  page: string
  limit: string
  sortBy: string
  sortOrder: string
}

export interface DataTableSearchConfig {
  placeholder?: string
  debounceMs?: number
  paramKey?: string
}

export interface DataTableSortingConfig {
  defaultSortBy: string
  sortByParamKey?: string
  sortOrderParamKey?: string
}

export interface DataTableLabels {
  rowLabel?: string
  rowsPerPageLabel?: string
  emptyMessage?: string
  updatingMessage?: string
  selectedRowsMessage?: (selectedCount: number, visibleCount: number) => string
}
