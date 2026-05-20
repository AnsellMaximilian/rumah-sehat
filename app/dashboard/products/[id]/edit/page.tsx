import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getProductService } from "@/modules/products/product.service";
import EditForm from "./components/edit-form";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductService({ id });

  if (!product) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${product.productCode || product.name}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/dashboard/products" },
        { label: `Edit ${product.productCode || product.name}` },
      ]}
    >
      <EditForm product={product} />
    </PageSection>
  );
}
