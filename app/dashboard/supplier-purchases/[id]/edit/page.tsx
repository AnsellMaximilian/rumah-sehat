import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";
import { getSupplierPurchaseService } from "@/modules/supplier-purchases/supplier-purchase.service";
import SupplierPurchaseForm from "../../components/supplier-purchase-form";

interface EditSupplierPurchasePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditSupplierPurchasePageProps) {
  const { id } = await params;
  const [purchase, suppliers, productOptions, customers] = await Promise.all([
    getSupplierPurchaseService({ id }),
    getAllSuppliersService(),
    getAllProductsService(),
    getAllCustomersService(),
  ]);

  if (!purchase) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${purchase.referenceNumber || purchase.id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Supplier Purchases", href: "/dashboard/supplier-purchases" },
        { label: `Edit ${purchase.referenceNumber || purchase.id}` },
      ]}
    >
      <SupplierPurchaseForm
        customers={customers}
        defaultPurchaseDate={purchase.purchaseDate}
        productOptions={productOptions}
        purchase={purchase}
        suppliers={suppliers}
      />
    </PageSection>
  );
}
