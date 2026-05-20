import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { ListSearchParams } from "@/types";
import { SupplierSortBySchema } from "@/modules/suppliers/supplier.schema";
import { getSuppliersService } from "@/modules/suppliers/supplier.service";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: SupplierSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const suppliers = await getSuppliersService(listInput);

  return (
    <PageSection
      title="Suppliers"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Suppliers" },
      ]}
    >
      <DataTable
        columns={columns}
        data={suppliers.data}
        pagination={suppliers.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search name, code, contact, bank...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "supplier",
            plural: "suppliers",
          },
          updatingMessage: "Updating suppliers...",
        }}
      />
    </PageSection>
  );
}
