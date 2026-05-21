import PageSection from "@/components/layout/page-section";
import { getAllDeliveriesService } from "@/modules/deliveries/delivery.service";
import DeliveryChargeForm from "../components/delivery-charge-form";

export default async function Page() {
  const deliveryOptions = await getAllDeliveriesService();

  return (
    <PageSection
      title="Add Delivery Charge"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Charges", href: "/dashboard/delivery-charges" },
        { label: "Add Delivery Charge" },
      ]}
    >
      <DeliveryChargeForm deliveryOptions={deliveryOptions} />
    </PageSection>
  );
}
