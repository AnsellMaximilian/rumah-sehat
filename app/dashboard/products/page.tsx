import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { ListSearchParams } from "@/types";
import { ProductSortBySchema } from "@/modules/products/product.schema";
import { getProductsService } from "@/modules/products/product.service";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: ProductSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const products = await getProductsService(listInput);

  return (
    <PageSection
      title="Products"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products" },
      ]}
    >
      <DataTable
        columns={columns}
        data={products.data}
        pagination={products.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search name, code, description, unit...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "product",
            plural: "products",
          },
          updatingMessage: "Updating products...",
        }}
      />
    </PageSection>
  );
}
