import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";
import CreateDraftForm from "../components/create-draft-form";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import { getInvoicePreviewService } from "@/modules/invoices/invoice.service";

function formatEventDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface InvoiceAddPageSearchParams {
  customerId?: string;
  invoiceDate?: string;
  periodEnd?: string;
  periodStart?: string;
}

export default async function Page(props: {
  searchParams?: Promise<InvoiceAddPageSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const customerId = searchParams?.customerId?.trim() ?? "";
  const periodStart = searchParams?.periodStart?.trim() ?? "";
  const periodEnd = searchParams?.periodEnd?.trim() ?? "";
  const invoiceDate =
    searchParams?.invoiceDate?.trim() ??
    new Date().toISOString().slice(0, 10);
  const customers = await getAllCustomersService();

  const preview =
    customerId && periodStart && periodEnd
      ? await getInvoicePreviewService({
          customerId,
          periodStart,
          periodEnd,
        })
      : null;

  return (
    <PageSection
      title="Create Weekly Invoice"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices", href: "/dashboard/invoices" },
        { label: "Create Weekly Invoice" },
      ]}
    >
      <div className="space-y-6">
        <DetailCard title="Review Parameters">
          <form method="GET" className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="customerId" className="mb-2 block text-sm font-medium">
                Customer
              </label>
              <select
                id="customerId"
                name="customerId"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                defaultValue={customerId}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerCode} - {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="periodStart" className="mb-2 block text-sm font-medium">
                Period Start
              </label>
              <input
                id="periodStart"
                name="periodStart"
                type="date"
                defaultValue={periodStart}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="periodEnd" className="mb-2 block text-sm font-medium">
                Period End
              </label>
              <input
                id="periodEnd"
                name="periodEnd"
                type="date"
                defaultValue={periodEnd}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="invoiceDate" className="mb-2 block text-sm font-medium">
                Invoice Date
              </label>
              <input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                defaultValue={invoiceDate}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Review Uninvoiced Items</Button>
            </div>
          </form>
        </DetailCard>

        {preview ? (
          <div className="space-y-6">
            <DetailCard title="Preview Summary">
              <div className="space-y-2 text-sm">
                <p>
                  Customer: {preview.customerCode ? `${preview.customerCode} - ` : ""}
                  {preview.customerName}
                </p>
                <p>
                  Period: {preview.periodStart} to {preview.periodEnd}
                </p>
                <p>
                  Product lines: {preview.salesLines.length} | Delivery charges:{" "}
                  {preview.deliveryCharges.length}
                </p>
                <p>
                  Product total: {formatRupiah(preview.salesLinesTotal)} | Delivery
                  charges total: {formatRupiah(preview.deliveryChargesTotal)}
                </p>
                <p className="font-medium">
                  Grand total: {formatRupiah(preview.grandTotal)}
                </p>
              </div>
            </DetailCard>

            {preview.blockedSalesLines.length > 0 ? (
              <DetailCard title="Blocked Sales Lines">
                <p className="mb-4 text-sm text-muted-foreground">
                  These delivered sales lines are missing sell prices, so the invoice
                  cannot be generated until they are fixed.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.blockedSalesLines.map((salesLine) => (
                      <TableRow key={salesLine.id}>
                        <TableCell>
                          {salesLine.productCode
                            ? `${salesLine.productCode} - ${salesLine.productName}`
                            : salesLine.productName || "-"}
                        </TableCell>
                        <TableCell>{salesLine.quantity}</TableCell>
                        <TableCell>
                          {formatEventDate(
                            salesLine.deliveryDeliveredAt ?? salesLine.deliveryRecordedAt,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DetailCard>
            ) : null}

            <DetailCard title="Product Lines">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.salesLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No uninvoiced delivered sales lines found in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.salesLines.map((salesLine) => (
                      <TableRow key={salesLine.id}>
                        <TableCell>
                          {salesLine.productCode
                            ? `${salesLine.productCode} - ${salesLine.productName}`
                            : salesLine.productName || "-"}
                        </TableCell>
                        <TableCell>{salesLine.quantity}</TableCell>
                        <TableCell>
                          {salesLine.unitSellPrice === null
                            ? "-"
                            : formatRupiah(salesLine.unitSellPrice)}
                        </TableCell>
                        <TableCell>
                          {salesLine.amount === null ? "-" : formatRupiah(salesLine.amount)}
                        </TableCell>
                        <TableCell>
                          {formatEventDate(
                            salesLine.deliveryDeliveredAt ?? salesLine.deliveryRecordedAt,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DetailCard>

            <DetailCard title="Delivery Charges">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.deliveryCharges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No uninvoiced billable delivery charges found in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.deliveryCharges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>{charge.chargeType.replaceAll("_", " ")}</TableCell>
                        <TableCell>{charge.description}</TableCell>
                        <TableCell>{formatRupiah(charge.amount)}</TableCell>
                        <TableCell>
                          {formatEventDate(
                            charge.deliveryDeliveredAt ?? charge.deliveryRecordedAt,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DetailCard>

            <DetailCard title="Create Draft">
              <CreateDraftForm
                preview={preview}
                values={{
                  customerId,
                  invoiceDate,
                  periodStart,
                  periodEnd,
                }}
              />
            </DetailCard>
          </div>
        ) : null}

        {!preview ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Choose a customer and weekly period to review uninvoiced delivered items
            and billable delivery charges.
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}
