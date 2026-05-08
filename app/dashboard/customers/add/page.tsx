import PageSection from "@/components/layout/page-section";
import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Customer"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Customers", href: "/dashboard/customers" },
        { label: "Add Customer" },
      ]}
    >
      <CreateForm />
    </PageSection>
  );
}