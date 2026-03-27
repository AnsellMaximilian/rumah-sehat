import {
  DataTableLabels,
  DataTableResolvedLabels,
} from "@/components/ui/data-table/types";

const DEFAULT_RESOURCE_NAME = {
  singular: "resource",
  plural: "resources",
} as const;

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === "/") {
    return "";
  }

  return basePath.replace(/\/+$/, "");
}

export function resolveDataTableResourceName(
  resourceName?: DataTableLabels["resourceName"],
): DataTableResolvedLabels["resourceName"] {
  const singular = resourceName?.singular || DEFAULT_RESOURCE_NAME.singular;
  const plural = resourceName?.plural || `${singular}s`;

  return {
    singular,
    plural,
  };
}

export function resolveDataTableLabels(
  labels?: DataTableLabels,
): DataTableResolvedLabels {
  const resourceName = resolveDataTableResourceName(labels?.resourceName);

  return {
    resourceName,
    rowLabel: labels?.rowLabel ?? `${resourceName.singular}(s)`,
    addLabel: labels?.addLabel ?? `Add ${resourceName.singular}`,
    rowsPerPageLabel: labels?.rowsPerPageLabel ?? "Rows per page",
    emptyMessage: labels?.emptyMessage ?? `No ${resourceName.plural} found.`,
    updatingMessage:
      labels?.updatingMessage ?? `Updating ${resourceName.plural}...`,
    selectedRowsMessage:
      labels?.selectedRowsMessage ??
      ((selectedCount, visibleCount) =>
        `${selectedCount} of ${visibleCount} selected on this page.`),
  };
}

export function getDataTableAddHref(basePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath);

  return `${normalizedBasePath}/add`;
}

export function getDataTableEditHref(
  basePath: string,
  resourceId: string | number,
) {
  const normalizedBasePath = normalizeBasePath(basePath);

  return `${normalizedBasePath}/${resourceId}/edit`;
}

export function getDataTableDetailHref(
  basePath: string,
  resourceId: string | number,
) {
  const normalizedBasePath = normalizeBasePath(basePath);

  return `${normalizedBasePath}/${resourceId}`;
}
