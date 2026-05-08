import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { CustomerSortBySchema } from "@/modules/customers/customer.schema";
import { getCustomersService } from "@/modules/customers/customer.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";


export default async function Page(props: {
    searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
    const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: CustomerSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const customers = await getCustomersService(listInput)
    return <PageSection
    title="Customers"
    breadcrumbItems={[
        {label: "Dashboard", href: "/dashboard"},
        {label: "Customers"}
    ]}
    >
        <DataTable
        columns={columns}
        data={customers.data}
        pagination={customers.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search code, name, address...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "customer",
            plural: "customers",
          },
          updatingMessage: "Updating customers...",
        }}
        />

    </PageSection>
}