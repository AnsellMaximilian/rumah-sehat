import { notFound } from "next/navigation";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import PageSection from "@/components/layout/page-section";
import ChangeLogList from "@/components/details/change-log-list";
import { Badge } from "@/components/ui/badge";
import {
  getAccountEntriesService,
  getAccountService,
} from "@/modules/accounts/account.service";
import { formatRupiah } from "@/lib/utils";
import { getEntityChangeLogsService } from "@/modules/change-logs/change-log.service";
import AccountEntryForm from "../components/account-entry-form";

interface AccountDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: AccountDetailPageProps) {
  const { id } = await params;
  const [account, entries, changeLogs] = await Promise.all([
    getAccountService({ id }),
    getAccountEntriesService({ accountId: id }),
    getEntityChangeLogsService({ entityId: id, entityType: "account" }),
  ]);

  if (!account) {
    notFound();
  }

  return (
    <PageSection
      title={account.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounts", href: "/dashboard/accounts" },
        { label: account.name },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <DetailCard title="Account Details">
            <DetailList>
              <DetailItem label="Name" value={account.name} />
              <DetailItem
                label="Type"
                value={<Badge>{account.type.replaceAll("_", " ")}</Badge>}
              />
              <DetailItem
                label="Current Balance"
                value={formatRupiah(account.currentBalance)}
              />
              <DetailItem
                label="Active"
                value={account.active ? "Yes" : "No"}
              />
              <DetailItem label="Owner Type" value={account.ownerType || "-"} />
              <DetailItem
                label="Notes"
                value={account.notes || "-"}
                valueClassName="whitespace-pre-wrap"
              />
            </DetailList>
          </DetailCard>

          <DetailCard title="Entries">
            {entries.data.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {entries.data.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-2 p-4 text-sm md:grid-cols-[160px_1fr_140px]"
                  >
                    <div className="text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.occurredAt))}
                    </div>
                    <div>
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-muted-foreground">
                        {entry.entryType.replaceAll("_", " ")}
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {formatRupiah(entry.amountDelta)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            )}
          </DetailCard>

          <DetailCard title="Change History">
            <ChangeLogList logs={changeLogs} />
          </DetailCard>
        </div>

        <DetailCard title="Add Entry">
          <AccountEntryForm accountId={account.id} />
        </DetailCard>
      </div>
    </PageSection>
  );
}
