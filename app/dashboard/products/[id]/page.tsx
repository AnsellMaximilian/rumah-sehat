import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailList from "@/components/details/detail-list";
import DetailItem from "@/components/details/detail-item";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { getProductService } from "@/modules/products/product.service";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductService({ id });

  if (!product) {
    notFound();
  }

  return (
    <PageSection
      title={product.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/dashboard/products" },
        { label: product.productCode || product.name },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Product Details">
          <DetailList>
            <DetailItem label="Code" value={product.productCode || "-"} />
            <DetailItem label="Name" value={product.name} />
            <DetailItem label="Unit" value={product.defaultUnit || "-"} />
            <DetailItem label="Cost" value={formatRupiah(product.cost)} />
            <DetailItem label="Price" value={formatRupiah(product.price)} />
            <DetailItem
              label="Fulfillment"
              value={
                <Badge variant="outline">
                  {product.defaultFulfillmentMode.replaceAll("_", " ")}
                </Badge>
              }
            />
            <DetailItem
              label="Track Stock"
              value={product.trackStock ? "Yes" : "No"}
            />
            <DetailItem label="Active" value={product.active ? "Yes" : "No"} />
            <DetailItem
              label="Description"
              value={product.description || "-"}
              valueClassName="whitespace-pre-wrap"
            />
          </DetailList>
        </DetailCard>
      </div>
    </PageSection>
  );
}
