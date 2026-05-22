import PageSection from "@/components/layout/page-section";
import { getAllAccountsService } from "@/modules/accounts/account.service";
import DeliveryTypeForm from "../components/delivery-type-form";

export default async function Page() {
  const accountOptions = await getAllAccountsService();

  return (
    <PageSection
      title="Add Delivery Type"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Types", href: "/dashboard/delivery-types" },
        { label: "Add Delivery Type" },
      ]}
    >
      <DeliveryTypeForm accountOptions={accountOptions} />
    </PageSection>
  );
}
