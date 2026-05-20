import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { SupplierPurchaseSortBySchema } from "@/modules/supplier-purchases/supplier-purchase.schema";
import { getSupplierPurchasesService } from "@/modules/supplier-purchases/supplier-purchase.service";
import { ListSearchParams } from "@/types";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: SupplierPurchaseSortBySchema,
    defaultSortBy: "purchaseDate",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const supplierPurchases = await getSupplierPurchasesService(listInput);

  return (
    <PageSection
      title="Supplier Purchases"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Supplier Purchases" },
      ]}
    >
      <DataTable
        columns={columns}
        data={supplierPurchases.data}
        pagination={supplierPurchases.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search supplier, reference, status, notes...",
        }}
        sorting={{
          defaultSortBy: "purchaseDate",
        }}
        labels={{
          resourceName: {
            singular: "supplier purchase",
            plural: "supplier purchases",
          },
          addLabel: "Add supplier purchase",
          updatingMessage: "Updating supplier purchases...",
        }}
      />
    </PageSection>
  );
}
