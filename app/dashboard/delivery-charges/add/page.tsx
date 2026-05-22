import PageSection from "@/components/layout/page-section";
import { getAllAccountsService } from "@/modules/accounts/account.service";
import { getAllDeliveriesService } from "@/modules/deliveries/delivery.service";
import { getAllDeliveryTypesService } from "@/modules/delivery-types/delivery-type.service";
import DeliveryChargeForm from "../components/delivery-charge-form";

export default async function Page() {
  const [accountOptions, deliveryOptions, deliveryTypeOptions] = await Promise.all([
    getAllAccountsService(),
    getAllDeliveriesService(),
    getAllDeliveryTypesService(),
  ]);

  return (
    <PageSection
      title="Add Delivery Charge"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Charges", href: "/dashboard/delivery-charges" },
        { label: "Add Delivery Charge" },
      ]}
    >
      <DeliveryChargeForm
        accountOptions={accountOptions}
        deliveryOptions={deliveryOptions}
        deliveryTypeOptions={deliveryTypeOptions}
      />
    </PageSection>
  );
}
