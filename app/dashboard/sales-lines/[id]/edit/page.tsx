import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getAllCustomersService } from "@/modules/customers/customer.service";
import { getAllProductsService } from "@/modules/products/product.service";
import { getSalesLineService } from "@/modules/sales-lines/sales-line.service";
import { getAllSuppliersService } from "@/modules/suppliers/supplier.service";
import EditForm from "./components/edit-form";

interface EditSalesLinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditSalesLinePageProps) {
  const { id } = await params;
  const [salesLine, customers, products, suppliers] = await Promise.all([
    getSalesLineService({ id }),
    getAllCustomersService(),
    getAllProductsService(),
    getAllSuppliersService(),
  ]);

  if (!salesLine) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${salesLine.id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sales Lines", href: "/dashboard/sales-lines" },
        { label: `Edit ${salesLine.id}` },
      ]}
    >
      <EditForm
        customers={customers}
        products={products}
        salesLine={salesLine}
        suppliers={suppliers}
      />
    </PageSection>
  );
}
