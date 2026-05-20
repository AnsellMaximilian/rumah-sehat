import PageSection from "@/components/layout/page-section";
import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Supplier"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Suppliers", href: "/dashboard/suppliers" },
        { label: "Add Supplier" },
      ]}
    >
      <CreateForm />
    </PageSection>
  );
}
