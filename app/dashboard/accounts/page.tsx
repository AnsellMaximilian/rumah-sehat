import PageSection from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table/data-table";
import { parseListSearchParams } from "@/lib/utils";
import { ListSearchParams } from "@/types";
import { AccountSortBySchema } from "@/modules/accounts/account.schema";
import { getAccountsService } from "@/modules/accounts/account.service";
import { columns } from "./components/columns";

export default async function Page(props: {
  searchParams?: Promise<ListSearchParams<Record<string, never>>>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: AccountSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });
  const accounts = await getAccountsService(listInput);

  return (
    <PageSection
      title="Accounts"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounts" },
      ]}
    >
      <DataTable
        columns={columns}
        data={accounts.data}
        pagination={accounts.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
        search={{
          placeholder: "Search account name, type, owner, notes...",
        }}
        sorting={{
          defaultSortBy: "createdAt",
        }}
        labels={{
          resourceName: {
            singular: "account",
            plural: "accounts",
          },
          updatingMessage: "Updating accounts...",
        }}
      />
    </PageSection>
  );
}
