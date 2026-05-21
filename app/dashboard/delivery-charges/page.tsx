import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { DeliveryChargeSortBySchema } from "@/modules/delivery-charges/delivery-charge.schema";
import { getDeliveryChargesService } from "@/modules/delivery-charges/delivery-charge.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: DeliveryChargeSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const deliveryCharges = await getDeliveryChargesService(listInput);

  return (
    <PageSection
      title="Delivery Charges"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Charges" },
      ]}
    >
      <DataTable
        columns={columns}
        data={deliveryCharges.data}
        pagination={deliveryCharges.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search customer, type, description, notes...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "delivery charge",
            plural: "delivery charges",
          },
          addLabel: "Add delivery charge",
          updatingMessage: "Updating delivery charges...",
        }}
      />
    </PageSection>
  );
}
