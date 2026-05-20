import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { ListSearchParams } from "@/types";
import { ProductCategorySortBySchema } from "@/modules/product-categories/product-category.schema";
import { getProductCategoriesService } from "@/modules/product-categories/product-category.service";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: ProductCategorySortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });

  const productCategories = await getProductCategoriesService(listInput);

  return (
    <PageSection
      title="Product Categories"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Product Categories" },
      ]}
    >
      <DataTable
        columns={columns}
        data={productCategories.data}
        pagination={productCategories.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search name or description...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "category",
            plural: "categories",
          },
          updatingMessage: "Updating categories...",
        }}
      />
    </PageSection>
  );
}
