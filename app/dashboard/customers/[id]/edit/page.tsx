import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getCustomerService } from "@/modules/customers/customer.service";
import EditForm from "./components/edit-form";

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerService({ id });

  if (!customer) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${customer.customerCode}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Customers", href: "/dashboard/customers" },
        { label: `Edit ${customer.customerCode}` },
      ]}
    >
      <EditForm customer={customer} />
    </PageSection>
  );
}