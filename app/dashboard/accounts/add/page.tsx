import PageSection from "@/components/layout/page-section";
import AccountForm from "../components/account-form";

export default async function Page() {
  return (
    <PageSection
      title="Add Account"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounts", href: "/dashboard/accounts" },
        { label: "Add Account" },
      ]}
    >
      <AccountForm />
    </PageSection>
  );
}
