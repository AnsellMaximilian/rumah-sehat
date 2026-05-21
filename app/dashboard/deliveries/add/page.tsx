import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import DeliveryForm from "../components/delivery-form";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAvailableSalesLinesService } from "@/modules/sales-lines/sales-line.service";

export default async function Page() {
  const [customers, productOptions, salesLineOptions] = await Promise.all([
    getAllCustomersService(),
    getAllProductsService(),
    getAvailableSalesLinesService(),
  ]);

  return (
    <PageSection
      title="Add Delivery"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Deliveries", href: "/dashboard/deliveries" },
        { label: "Add Delivery" },
      ]}
    >
      <DeliveryForm
        customers={customers}
        productOptions={productOptions}
        salesLineOptions={salesLineOptions}
      />
    </PageSection>
  );
}
