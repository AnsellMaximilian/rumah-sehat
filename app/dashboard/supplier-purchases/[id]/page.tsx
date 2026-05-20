import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import { Badge } from "@/components/ui/badge";
import {
  SupplierPurchaseDetail,
} from "@/modules/supplier-purchases/supplier-purchase.types";
import { getSupplierPurchaseService } from "@/modules/supplier-purchases/supplier-purchase.service";
import { formatRupiah } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getPurchaseGrandTotal(purchase: SupplierPurchaseDetail) {
  return purchase.items.reduce((total, item) => {
    if (item.unitCost === null) {
      return total;
    }

    return total + Math.round(item.quantity * item.unitCost);
  }, 0);
}

export default async function Page(
  props: PageProps<"/dashboard/supplier-purchases/[id]">,
) {
  const { id } = await props.params;
  const purchase = await getSupplierPurchaseService({ id });

  if (!purchase) {
    notFound();
  }

  const grandTotal = getPurchaseGrandTotal(purchase);

  return (
    <PageSection
      title={purchase.referenceNumber || purchase.supplierName || "Supplier Purchase"}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Supplier Purchases", href: "/dashboard/supplier-purchases" },
        { label: purchase.referenceNumber || purchase.id },
      ]}
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Purchase Details">
            <DetailList>
              <DetailItem label="Supplier" value={purchase.supplierName || "-"} />
              <DetailItem label="Purchase Date" value={purchase.purchaseDate} />
              <DetailItem
                label="Reference"
                value={purchase.referenceNumber || "-"}
              />
              <DetailItem
                label="Status"
                value={
                  <Badge variant="outline">
                    {purchase.status.replaceAll("_", " ")}
                  </Badge>
                }
              />
              <DetailItem label="Created By" value={purchase.createdByName || "-"} />
              <DetailItem
                label="Notes"
                value={purchase.notes || "-"}
                valueClassName="whitespace-pre-wrap"
              />
            </DetailList>
          </DetailCard>

          <DetailCard title="Summary">
            <DetailList>
              <DetailItem label="Item Count" value={String(purchase.items.length)} />
              <DetailItem
                label="Grand Total"
                value={grandTotal > 0 ? formatRupiah(grandTotal) : "-"}
              />
            </DetailList>
          </DetailCard>
        </div>

        <DetailCard title="Purchase Items">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => {
                const lineTotal =
                  item.unitCost === null
                    ? null
                    : Math.round(item.quantity * item.unitCost);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.productCode
                        ? `${item.productCode} - ${item.productName}`
                        : item.productName || "-"}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.unitCost === null ? "-" : formatRupiah(item.unitCost)}
                    </TableCell>
                    <TableCell>{item.destinationType.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      {item.customerCode
                        ? `${item.customerCode} - ${item.customerName}`
                        : item.customerName || "-"}
                    </TableCell>
                    <TableCell>
                      {lineTotal === null ? "-" : formatRupiah(lineTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DetailCard>
      </div>
    </PageSection>
  );
}
