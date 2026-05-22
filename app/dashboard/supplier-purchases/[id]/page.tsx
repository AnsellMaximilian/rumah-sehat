import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import { Badge } from "@/components/ui/badge";
import {
  SupplierPurchaseDetail,
} from "@/modules/supplier-purchases/supplier-purchase.types";
import {
  getSupplierPurchaseItemWorkflowHint,
  getSupplierPurchaseStatusWorkflowHint,
} from "@/modules/supplier-purchases/supplier-purchase-workflow";
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


function getAllocatedQuantityByItem(purchase: SupplierPurchaseDetail) {
  const allocatedByItemId = new Map<string, number>();

  for (const allocation of purchase.allocations) {
    allocatedByItemId.set(
      allocation.supplierPurchaseItemId,
      (allocatedByItemId.get(allocation.supplierPurchaseItemId) ?? 0) +
        allocation.allocatedQuantity,
    );
  }

  return allocatedByItemId;
}

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
  const allocatedQuantityByItem = getAllocatedQuantityByItem(purchase);

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
              <DetailItem
                label="Workflow Effect"
                value={getSupplierPurchaseStatusWorkflowHint(purchase.status)}
                valueClassName="whitespace-pre-wrap"
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
                <TableHead>Workflow Effect</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Allocated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => {
                const lineTotal =
                  item.unitCost === null
                    ? null
                    : Math.round(item.quantity * item.unitCost);
                const workflowHint = getSupplierPurchaseItemWorkflowHint({
                  customerId: item.customerId,
                  destinationType: item.destinationType,
                  status: purchase.status,
                });
                const allocatedQuantity = allocatedQuantityByItem.get(item.id) ?? 0;

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
                    <TableCell className="max-w-xs whitespace-normal">
                      {workflowHint.summary}
                    </TableCell>
                    <TableCell>
                      {item.customerCode
                        ? `${item.customerCode} - ${item.customerName}`
                        : item.customerName || "-"}
                    </TableCell>
                    <TableCell>
                      {lineTotal === null ? "-" : formatRupiah(lineTotal)}
                    </TableCell>
                    <TableCell>
                      {allocatedQuantity > 0
                        ? `${allocatedQuantity} / ${item.quantity}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DetailCard>

        <DetailCard title="Allocations">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase Item</TableHead>
                <TableHead>Sales Line</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Allocated Qty</TableHead>
                <TableHead>Sales Line Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.allocations.length > 0 ? (
                purchase.allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      {allocation.productCode
                        ? `${allocation.productCode} - ${allocation.productName}`
                        : allocation.productName || "-"}
                    </TableCell>
                    <TableCell>{allocation.salesLineId}</TableCell>
                    <TableCell>
                      {allocation.customerCode
                        ? `${allocation.customerCode} - ${allocation.customerName}`
                        : allocation.customerName || "-"}
                    </TableCell>
                    <TableCell>{allocation.allocatedQuantity}</TableCell>
                    <TableCell>
                      {allocation.salesLineStatus ? (
                        <Badge variant="outline">
                          {allocation.salesLineStatus.replaceAll("_", " ")}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No allocations yet. Customer-linked purchase items materialize allocations when their workflow status creates sales lines.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DetailCard>

      </div>
    </PageSection>
  );
}
