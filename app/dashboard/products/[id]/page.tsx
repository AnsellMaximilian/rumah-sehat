import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailList from "@/components/details/detail-list";
import DetailItem from "@/components/details/detail-item";
import { Badge } from "@/components/ui/badge";
import StockMovementForm from "./components/stock-movement-form";
import { formatQuantity, formatRupiah } from "@/lib/utils";
import {
  getProductService,
  getProductStockMovementsService,
} from "@/modules/products/product.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getStockMovementTypeLabel(movementType: string) {
  return movementType.replaceAll("_", " ");
}

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductService({ id });

  if (!product) {
    notFound();
  }

  const stockMovements = product.trackStock
    ? await getProductStockMovementsService({ productId: product.id })
    : [];

  return (
    <PageSection
      title={product.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/dashboard/products" },
        { label: product.productCode || product.name },
      ]}
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Product Details">
            <DetailList>
              <DetailItem label="Code" value={product.productCode || "-"} />
              <DetailItem label="Name" value={product.name} />
              <DetailItem label="Supplier" value={product.supplierName || "-"} />
              <DetailItem label="Category" value={product.categoryName || "-"} />
              <DetailItem label="Unit" value={product.defaultUnit || "-"} />
              <DetailItem label="Cost" value={formatRupiah(product.cost)} />
              <DetailItem label="Price" value={formatRupiah(product.price)} />
              <DetailItem
                label="Fulfillment"
                value={
                  <Badge variant="outline">
                    {product.defaultFulfillmentMode.replaceAll("_", " ")}
                  </Badge>
                }
              />
              <DetailItem
                label="Track Stock"
                value={product.trackStock ? "Yes" : "No"}
              />
              <DetailItem
                label="Stock Tracking Started"
                value={
                  product.stockTrackingStartedAt
                    ? product.stockTrackingStartedAt.toLocaleString("id-ID")
                    : "-"
                }
              />
              <DetailItem label="Active" value={product.active ? "Yes" : "No"} />
              <DetailItem
                label="Description"
                value={product.description || "-"}
                valueClassName="whitespace-pre-wrap"
              />
            </DetailList>
          </DetailCard>

          <DetailCard title="Stock Summary">
            <DetailList>
              <DetailItem
                label="Current Stock"
                value={
                  product.trackStock && product.currentStock !== null
                    ? formatQuantity(product.currentStock)
                    : "Not tracked"
                }
              />
              <DetailItem
                label="Movement Count"
                value={
                  product.trackStock ? String(stockMovements.length) : "Not tracked"
                }
              />
            </DetailList>
          </DetailCard>
        </div>

        {product.trackStock ? (
          <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <DetailCard title="Add Stock Movement">
              <StockMovementForm productId={product.id} />
            </DetailCard>

            <DetailCard title="Stock Movement History">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.length > 0 ? (
                  stockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.occurredAt.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStockMovementTypeLabel(movement.movementType)}</TableCell>
                      <TableCell>
                        {movement.quantityDelta > 0 ? "+" : ""}
                        {formatQuantity(movement.quantityDelta)}
                      </TableCell>
                      <TableCell>
                        {movement.sourceType ? movement.sourceType.replaceAll("_", " ") : "-"}
                      </TableCell>
                      <TableCell>{movement.createdByName || "-"}</TableCell>
                      <TableCell>{movement.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No stock movements yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </DetailCard>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}
