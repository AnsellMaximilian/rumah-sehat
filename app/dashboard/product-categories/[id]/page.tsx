import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import { getProductCategoryService } from "@/modules/product-categories/product-category.service";

interface ProductCategoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: ProductCategoryDetailPageProps) {
  const { id } = await params;
  const productCategory = await getProductCategoryService({ id });

  if (!productCategory) {
    notFound();
  }

  return (
    <PageSection
      title={productCategory.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Product Categories", href: "/dashboard/product-categories" },
        { label: productCategory.name },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Category Details">
          <DetailList>
            <DetailItem label="Name" value={productCategory.name} />
            <DetailItem
              label="Active"
              value={productCategory.active ? "Yes" : "No"}
            />
            <DetailItem
              label="Description"
              value={productCategory.description || "-"}
              valueClassName="whitespace-pre-wrap"
            />
          </DetailList>
        </DetailCard>
      </div>
    </PageSection>
  );
}
