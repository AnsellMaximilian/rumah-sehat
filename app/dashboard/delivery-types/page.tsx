import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { ListSearchParams } from "@/types";
import { DeliveryTypeSortBySchema } from "@/modules/delivery-types/delivery-type.schema";
import { getDeliveryTypesService } from "@/modules/delivery-types/delivery-type.service";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: DeliveryTypeSortBySchema,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    defaultPage: 1,
    defaultLimit: 10,
  });
  const deliveryTypes = await getDeliveryTypesService(listInput);

  return (
    <PageSection
      title="Delivery Types"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Types" },
      ]}
    >
      <DataTable
        columns={columns}
        data={deliveryTypes.data}
        pagination={deliveryTypes.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{ placeholder: "Search delivery type name, charge type, notes..." }}
        sorting={{ defaultSortBy: "name" }}
        labels={{
          resourceName: { singular: "delivery type", plural: "delivery types" },
          updatingMessage: "Updating delivery types...",
        }}
      />
    </PageSection>
  );
}
