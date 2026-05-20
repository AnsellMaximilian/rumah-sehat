import PageSection from "@/components/layout/page-section";
import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Product"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/dashboard/products" },
        { label: "Add Product" },
      ]}
    >
      <CreateForm />
    </PageSection>
  );
}
