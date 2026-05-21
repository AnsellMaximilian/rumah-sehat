import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import DeliveryForm from "../components/delivery-form";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAvailableSalesLinesService } from "@/modules/sales-lines/sales-line.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";

export default async function Page() {
  const [customers, productOptions, salesLineOptions, suppliers] = await Promise.all([
    getAllCustomersService(),
    getAllProductsService(),
    getAvailableSalesLinesService(),
    getAllSuppliersService(),
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
        suppliers={suppliers}
      />
    </PageSection>
  );
}
