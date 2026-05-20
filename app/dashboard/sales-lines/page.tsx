import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { SalesLineSortBySchema } from "@/modules/sales-lines/sales-line.schema";
import { getSalesLinesService } from "@/modules/sales-lines/sales-line.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: SalesLineSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const salesLines = await getSalesLinesService(listInput);

  return (
    <PageSection
      title="Sales Lines"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sales Lines" },
      ]}
    >
      <DataTable
        columns={columns}
        data={salesLines.data}
        pagination={salesLines.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search customer, product, supplier, source, status...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "sales line",
            plural: "sales lines",
          },
          addLabel: "Add sales line",
          updatingMessage: "Updating sales lines...",
        }}
      />
    </PageSection>
  );
}
