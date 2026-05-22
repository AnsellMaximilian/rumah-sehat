import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DeliveryChargeForm from "../../components/delivery-charge-form";
import { getAllAccountsService } from "@/modules/accounts/account.service";
import { getDeliveryChargeService } from "@/modules/delivery-charges/delivery-charge.service";
import { getAllDeliveriesService } from "@/modules/deliveries/delivery.service";
import { getAllDeliveryTypesService } from "@/modules/delivery-types/delivery-type.service";

interface EditDeliveryChargePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditDeliveryChargePageProps) {
  const { id } = await params;
  const [accountOptions, deliveryCharge, deliveryOptions, deliveryTypeOptions] = await Promise.all([
    getAllAccountsService(),
    getDeliveryChargeService({ id }),
    getAllDeliveriesService(),
    getAllDeliveryTypesService(),
  ]);

  if (!deliveryCharge) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${deliveryCharge.description}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Charges", href: "/dashboard/delivery-charges" },
        { label: `Edit ${deliveryCharge.description}` },
      ]}
    >
      <DeliveryChargeForm
        accountOptions={accountOptions}
        deliveryCharge={deliveryCharge}
        deliveryOptions={deliveryOptions}
        deliveryTypeOptions={deliveryTypeOptions}
      />
    </PageSection>
  );
}
