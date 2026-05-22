import { notFound } from "next/navigation";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import PageSection from "@/components/layout/page-section";
import ChangeLogList from "@/components/details/change-log-list";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { getDeliveryChargeService } from "@/modules/delivery-charges/delivery-charge.service";
import { getEntityChangeLogsService } from "@/modules/change-logs/change-log.service";

export default async function Page(
  props: PageProps<"/dashboard/delivery-charges/[id]">,
) {
  const { id } = await props.params;
  const [deliveryCharge, changeLogs] = await Promise.all([
    getDeliveryChargeService({ id }),
    getEntityChangeLogsService({ entityId: id, entityType: "delivery_charge" }),
  ]);

  if (!deliveryCharge) {
    notFound();
  }

  return (
    <PageSection
      title={deliveryCharge.description}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Charges", href: "/dashboard/delivery-charges" },
        { label: deliveryCharge.description },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Charge Details">
          <DetailList>
            <DetailItem
              label="Customer"
              value={
                deliveryCharge.customerCode
                  ? `${deliveryCharge.customerCode} - ${deliveryCharge.customerName}`
                  : deliveryCharge.customerName || "-"
              }
            />
            <DetailItem
              label="Delivery"
              value={
                deliveryCharge.deliveryRecordedAt
                  ? new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(deliveryCharge.deliveryRecordedAt))
                  : "-"
              }
            />
            <DetailItem
              label="Delivery Status"
              value={
                deliveryCharge.deliveryStatus ? (
                  <Badge>{deliveryCharge.deliveryStatus.replaceAll("_", " ")}</Badge>
                ) : (
                  "-"
                )
              }
            />
            <DetailItem
              label="Charge Type"
              value={<Badge>{deliveryCharge.chargeType.replaceAll("_", " ")}</Badge>}
            />
            <DetailItem
              label="Amount"
              value={formatRupiah(deliveryCharge.amount)}
            />
            <DetailItem
              label="Bill To Customer"
              value={deliveryCharge.billToCustomer ? "Yes" : "No"}
            />
            <DetailItem
              label="Account"
              value={deliveryCharge.accountName || "-"}
            />
            <DetailItem
              label="Notes"
              value={deliveryCharge.notes || "-"}
              valueClassName="whitespace-pre-wrap"
            />
          </DetailList>
        </DetailCard>

        <DetailCard title="Change History">
          <ChangeLogList logs={changeLogs} />
        </DetailCard>
      </div>
    </PageSection>
  );
}
