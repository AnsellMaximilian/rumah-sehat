import { notFound } from "next/navigation";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import PageSection from "@/components/layout/page-section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";
import { getInvoiceService } from "@/modules/invoices/invoice.service";
import DraftInvoiceActions from "../components/draft-invoice-actions";
import ReissueInvoiceActions from "../components/reissue-invoice-actions";
import ManualInvoiceItemForm from "../components/manual-invoice-item-form";

export default async function Page(props: PageProps<"/dashboard/invoices/[id]">) {
  const { id } = await props.params;
  const invoice = await getInvoiceService({ id });

  if (!invoice) {
    notFound();
  }

  return (
    <PageSection
      title={invoice.invoiceNumber || invoice.id}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices", href: "/dashboard/invoices" },
        { label: invoice.invoiceNumber || invoice.id },
      ]}
    >
      <div className="space-y-6">
        {invoice.status === "draft" ? (
          <div className="flex justify-end">
            <DraftInvoiceActions id={invoice.id} />
          </div>
        ) : null}

        {invoice.status === "issued" || invoice.status === "paid" ? (
          <div className="flex justify-end">
            <ReissueInvoiceActions id={invoice.id} />
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Invoice Details">
            <DetailList>
              <DetailItem
                label="Customer"
                value={
                  invoice.customerCode
                    ? `${invoice.customerCode} - ${invoice.customerName}`
                    : invoice.customerName || "-"
                }
              />
              <DetailItem label="Invoice Number" value={invoice.invoiceNumber || "-"} />
              <DetailItem label="Invoice Date" value={invoice.invoiceDate} />
              <DetailItem
                label="Period"
                value={`${invoice.periodStart} to ${invoice.periodEnd}`}
              />
              <DetailItem
                label="Status"
                value={<Badge>{invoice.status.replaceAll("_", " ")}</Badge>}
              />
              <DetailItem
                label="Sync Status"
                value={<Badge>{invoice.syncStatus.replaceAll("_", " ")}</Badge>}
              />
              <DetailItem
                label="Draft Sync"
                value={
                  invoice.status === "draft"
                    ? invoice.syncStatus === "needs_review"
                      ? "Draft can be regenerated from current uninvoiced sources"
                      : "Draft is current"
                    : "-"
                }
              />
              <DetailItem
                label="Correction Path"
                value={
                  invoice.status === "draft"
                    ? "Regenerate draft"
                    : invoice.status === "issued"
                      ? "Void and reissue, or later adjustment workflow"
                      : invoice.status === "paid"
                        ? "Void and reissue is available, but adjustment is usually safer"
                        : "-"
                }
              />
              <DetailItem
                label="Created By"
                value={invoice.createdByName || "-"}
              />
              <DetailItem
                label="Notes"
                value={invoice.notes || "-"}
                valueClassName="whitespace-pre-wrap"
              />
              <DetailItem
                label="Total"
                value={formatRupiah(invoice.totalAmount)}
              />
            </DetailList>
          </DetailCard>
        </div>

        {invoice.status !== "void" ? (
          <DetailCard title="Manual Adjustment / Misc Charge">
            <ManualInvoiceItemForm invoiceId={invoice.id} />
          </DetailCard>
        ) : null}

        <DetailCard title="Invoice Items">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge>{item.lineType.replaceAll("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity ?? "-"}</TableCell>
                  <TableCell>
                    {item.unitPrice === null ? "-" : formatRupiah(item.unitPrice)}
                  </TableCell>
                  <TableCell>{formatRupiah(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailCard>
      </div>
    </PageSection>
  );
}
