import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";
import SupplierPurchaseForm from "../components/supplier-purchase-form";

export default async function Page() {
  const [suppliers, productOptions, customers] = await Promise.all([
    getAllSuppliersService(),
    getAllProductsService(),
    getAllCustomersService(),
  ]);

  return (
    <PageSection
      title="Add Supplier Purchase"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Supplier Purchases", href: "/dashboard/supplier-purchases" },
        { label: "Add Supplier Purchase" },
      ]}
    >
      <SupplierPurchaseForm
        customers={customers}
        defaultPurchaseDate={new Date().toISOString().slice(0, 10)}
        productOptions={productOptions}
        suppliers={suppliers}
      />
    </PageSection>
  );
}
