import PageSection from "@/components/layout/page-section";
import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Todo"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Todos", href: "/dashboard/todos" },
        { label: "Add Todo" },
      ]}
    >
      <CreateForm />
    </PageSection>
  );
}
