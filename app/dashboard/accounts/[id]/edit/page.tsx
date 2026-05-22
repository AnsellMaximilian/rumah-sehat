import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getAccountService } from "@/modules/accounts/account.service";
import AccountForm from "../../components/account-form";

interface EditAccountPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditAccountPageProps) {
  const { id } = await params;
  const account = await getAccountService({ id });

  if (!account) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${account.name}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounts", href: "/dashboard/accounts" },
        { label: `Edit ${account.name}` },
      ]}
    >
      <AccountForm account={account} />
    </PageSection>
  );
}
