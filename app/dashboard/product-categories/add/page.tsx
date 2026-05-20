import PageSection from "@/components/layout/page-section";
import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Product Category"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Product Categories", href: "/dashboard/product-categories" },
        { label: "Add Product Category" },
      ]}
    >
      <CreateForm />
    </PageSection>
  );
}
