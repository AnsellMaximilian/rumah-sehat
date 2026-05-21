import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { DeliverySortBySchema } from "@/modules/deliveries/delivery.schema";
import { getDeliveriesService } from "@/modules/deliveries/delivery.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: DeliverySortBySchema,
    defaultSortBy: "recordedAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const deliveries = await getDeliveriesService(listInput);

  return (
    <PageSection
      title="Deliveries"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Deliveries" },
      ]}
    >
      <DataTable
        columns={columns}
        data={deliveries.data}
        pagination={deliveries.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search customer, status, delivered by, notes...",
        }}
        sorting={{
          defaultSortBy: "recordedAt",
        }}
        labels={{
          resourceName: {
            singular: "delivery",
            plural: "deliveries",
          },
          updatingMessage: "Updating deliveries...",
        }}
      />
    </PageSection>
  );
}
