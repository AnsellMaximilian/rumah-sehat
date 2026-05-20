import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { getSalesLineService } from "@/modules/sales-lines/sales-line.service";

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function Page(
  props: PageProps<"/dashboard/sales-lines/[id]">,
) {
  const { id } = await props.params;
  const salesLine = await getSalesLineService({ id });

  if (!salesLine) {
    notFound();
  }

  const lineTotal =
    salesLine.unitSellPrice === null
      ? null
      : Math.round(salesLine.quantity * salesLine.unitSellPrice);

  return (
    <PageSection
      title={salesLine.productName || "Sales Line"}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sales Lines", href: "/dashboard/sales-lines" },
        { label: salesLine.id },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Sales Line Details">
          <DetailList>
            <DetailItem
              label="Customer"
              value={
                salesLine.customerCode
                  ? `${salesLine.customerCode} - ${salesLine.customerName}`
                  : salesLine.customerName || "-"
              }
            />
            <DetailItem
              label="Product"
              value={
                salesLine.productCode
                  ? `${salesLine.productCode} - ${salesLine.productName}`
                  : salesLine.productName || "-"
              }
            />
            <DetailItem label="Quantity" value={formatQuantity(salesLine.quantity)} />
            <DetailItem
              label="Sell Price"
              value={
                salesLine.unitSellPrice === null
                  ? "-"
                  : formatRupiah(salesLine.unitSellPrice)
              }
            />
            <DetailItem
              label="Line Total"
              value={lineTotal === null ? "-" : formatRupiah(lineTotal)}
            />
            <DetailItem
              label="Source"
              value={
                <Badge variant="outline">
                  {salesLine.sourceMode.replaceAll("_", " ")}
                </Badge>
              }
            />
            <DetailItem
              label="Supplier"
              value={salesLine.supplierName || "-"}
            />
            <DetailItem
              label="Status"
              value={<Badge>{salesLine.status.replaceAll("_", " ")}</Badge>}
            />
            <DetailItem
              label="Notes"
              value={salesLine.notes || "-"}
              valueClassName="whitespace-pre-wrap"
            />
          </DetailList>
        </DetailCard>
      </div>
    </PageSection>
  );
}
