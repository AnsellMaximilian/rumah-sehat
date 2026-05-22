import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getAllAccountsService } from "@/modules/accounts/account.service";
import { getDeliveryTypeService } from "@/modules/delivery-types/delivery-type.service";
import DeliveryTypeForm from "../../components/delivery-type-form";

interface EditDeliveryTypePageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: EditDeliveryTypePageProps) {
  const { id } = await params;
  const [accountOptions, deliveryType] = await Promise.all([
    getAllAccountsService(),
    getDeliveryTypeService({ id }),
  ]);

  if (!deliveryType) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${deliveryType.name}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Types", href: "/dashboard/delivery-types" },
        { label: `Edit ${deliveryType.name}` },
      ]}
    >
      <DeliveryTypeForm accountOptions={accountOptions} deliveryType={deliveryType} />
    </PageSection>
  );
}
