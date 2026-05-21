import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DeliveryChargeForm from "../../components/delivery-charge-form";
import { getDeliveryChargeService } from "@/modules/delivery-charges/delivery-charge.service";
import { getAllDeliveriesService } from "@/modules/deliveries/delivery.service";

interface EditDeliveryChargePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditDeliveryChargePageProps) {
  const { id } = await params;
  const [deliveryCharge, deliveryOptions] = await Promise.all([
    getDeliveryChargeService({ id }),
    getAllDeliveriesService(),
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
        deliveryCharge={deliveryCharge}
        deliveryOptions={deliveryOptions}
      />
    </PageSection>
  );
}
