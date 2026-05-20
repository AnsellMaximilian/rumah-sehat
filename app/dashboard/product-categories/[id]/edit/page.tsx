import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getProductCategoryService } from "@/modules/product-categories/product-category.service";
import EditForm from "./components/edit-form";

interface EditProductCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditProductCategoryPageProps) {
  const { id } = await params;
  const productCategory = await getProductCategoryService({ id });

  if (!productCategory) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${productCategory.name}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Product Categories", href: "/dashboard/product-categories" },
        { label: `Edit ${productCategory.name}` },
      ]}
    >
      <EditForm productCategory={productCategory} />
    </PageSection>
  );
}
