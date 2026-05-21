import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
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
import { getDeliveryChargesByDeliveryService } from "@/modules/delivery-charges/delivery-charge.service";
import { getDeliveryService } from "@/modules/deliveries/delivery.service";

export default async function Page(props: PageProps<"/dashboard/deliveries/[id]">) {
  const { id } = await props.params;
  const [delivery, deliveryCharges] = await Promise.all([
    getDeliveryService({ id }),
    getDeliveryChargesByDeliveryService({ deliveryId: id }),
  ]);

  if (!delivery) {
    notFound();
  }

  return (
    <PageSection
      title={delivery.customerName || "Delivery"}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Deliveries", href: "/dashboard/deliveries" },
        { label: delivery.id },
      ]}
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Delivery Details">
            <DetailList>
              <DetailItem
                label="Customer"
                value={
                  delivery.customerCode
                    ? `${delivery.customerCode} - ${delivery.customerName}`
                    : delivery.customerName || "-"
                }
              />
              <DetailItem
                label="Recorded At"
                value={new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(delivery.recordedAt))}
              />
              <DetailItem
                label="Delivered At"
                value={
                  delivery.deliveredAt
                    ? new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(delivery.deliveredAt))
                    : "-"
                }
              />
              <DetailItem
                label="Delivered By"
                value={delivery.deliveredBy || "-"}
              />
              <DetailItem
                label="Status"
                value={<Badge>{delivery.status.replaceAll("_", " ")}</Badge>}
              />
              <DetailItem label="Created By" value={delivery.createdByName || "-"} />
              <DetailItem
                label="Notes"
                value={delivery.notes || "-"}
                valueClassName="whitespace-pre-wrap"
              />
            </DetailList>
          </DetailCard>
        </div>

        <DetailCard title="Delivery Items">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Sales Line Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.items.map((item) => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.productCode
                        ? `${item.productCode} - ${item.productName}`
                        : item.productName || "-"}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.unitSellPrice === null ? "-" : formatRupiah(item.unitSellPrice)}
                    </TableCell>
                    <TableCell>{item.sourceMode.replaceAll("_", " ")}</TableCell>
                    <TableCell>{item.salesLineStatus || "-"}</TableCell>
                  </TableRow>
                );
              })}
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
                <TableHead>Bill To Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No delivery charges recorded.
                  </TableCell>
                </TableRow>
              ) : (
                deliveryCharges.map((deliveryCharge) => (
                  <TableRow key={deliveryCharge.id}>
                    <TableCell>
                      <Badge>
                        {deliveryCharge.chargeType.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{deliveryCharge.description}</TableCell>
                    <TableCell>{formatRupiah(deliveryCharge.amount)}</TableCell>
                    <TableCell>
                      {deliveryCharge.billToCustomer ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DetailCard>
      </div>
    </PageSection>
  );
}
