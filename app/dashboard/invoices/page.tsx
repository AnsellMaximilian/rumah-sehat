import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { InvoiceSortBySchema } from "@/modules/invoices/invoice.schema";
import { getInvoicesService } from "@/modules/invoices/invoice.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: InvoiceSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const invoices = await getInvoicesService(listInput);

  return (
    <PageSection
      title="Invoices"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices" },
      ]}
    >
      <DataTable
        columns={columns}
        data={invoices.data}
        pagination={invoices.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search customer, invoice number, status, sync, notes...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "invoice",
            plural: "invoices",
          },
          addLabel: "Create weekly invoice",
          updatingMessage: "Updating invoices...",
        }}
      />
    </PageSection>
  );
}
