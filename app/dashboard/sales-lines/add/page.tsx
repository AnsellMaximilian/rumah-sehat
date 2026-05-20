import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import { getAllProductsService } from "@/modules/products/product.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";
import CreateForm from "../components/create-form";

export default async function Page() {
  const [customers, products, suppliers] = await Promise.all([
    getAllCustomersService(),
    getAllProductsService(),
    getAllSuppliersService(),
  ]);

  return (
    <PageSection
      title="Add Sales Line"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sales Lines", href: "/dashboard/sales-lines" },
        { label: "Add Sales Line" },
      ]}
    >
      <CreateForm customers={customers} products={products} suppliers={suppliers} />
    </PageSection>
  );
}
