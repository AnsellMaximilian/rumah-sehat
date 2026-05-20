import PageSection from "@/components/layout/page-section";
import { getAllProductCategoriesService } from "@/modules/product-categories/product-category.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";
import CreateForm from "../components/create-form";

export default async function Page() {
  const [suppliers, categories] = await Promise.all([
    getAllSuppliersService(),
    getAllProductCategoriesService(),
  ]);

  return (
    <PageSection
      title="Add Product"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/dashboard/products" },
        { label: "Add Product" },
      ]}
    >
      <CreateForm categories={categories} suppliers={suppliers} />
    </PageSection>
  );
}
