import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { getSupplierService } from "@/modules/suppliers/supplier.service";
import EditForm from "./components/edit-form";

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditSupplierPageProps) {
  const { id } = await params;
  const supplier = await getSupplierService({ id });

  if (!supplier) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${supplier.supplierCode || supplier.name}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Suppliers", href: "/dashboard/suppliers" },
        { label: `Edit ${supplier.supplierCode || supplier.name}` },
      ]}
    >
      <EditForm supplier={supplier} />
    </PageSection>
  );
}
