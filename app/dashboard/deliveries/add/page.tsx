import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import DeliveryForm from "../components/delivery-form";
import { getAvailableSalesLinesService } from "@/modules/sales-lines/sales-line.service";

export default async function Page() {
  const [customers, salesLineOptions] = await Promise.all([
    getAllCustomersService(),
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
      <DeliveryForm customers={customers} salesLineOptions={salesLineOptions} />
    </PageSection>
  );
}
