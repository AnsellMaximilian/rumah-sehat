import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import DeliveryForm from "../../components/delivery-form";
import { getDeliveryService } from "@/modules/deliveries/delivery.service";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAvailableSalesLinesService } from "@/modules/sales-lines/sales-line.service";

interface EditDeliveryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditDeliveryPageProps) {
  const { id } = await params;
  const delivery = await getDeliveryService({ id });

  if (!delivery) {
    notFound();
  }

  const [customers, productOptions, salesLineOptions] = await Promise.all([
    getAllCustomersService(),
    getAllProductsService(),
    getAvailableSalesLinesService({
      includeIds: delivery.items.map((item) => item.salesLineId),
    }),
  ]);

  return (
    <PageSection
      title={`Edit ${delivery.id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Deliveries", href: "/dashboard/deliveries" },
        { label: `Edit ${delivery.id}` },
      ]}
    >
      <DeliveryForm
        customers={customers}
        delivery={delivery}
        productOptions={productOptions}
        salesLineOptions={salesLineOptions}
      />
    </PageSection>
  );
}
