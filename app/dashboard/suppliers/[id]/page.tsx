import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import DetailCard from "@/components/layout/detail-card";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import { getSupplierService } from "@/modules/suppliers/supplier.service";

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: SupplierDetailPageProps) {
  const { id } = await params;
  const supplier = await getSupplierService({ id });

  if (!supplier) {
    notFound();
  }

  return (
    <PageSection
      title={supplier.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Suppliers", href: "/dashboard/suppliers" },
        { label: supplier.supplierCode || supplier.name },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Supplier Details">
          <DetailList>
            <DetailItem label="Code" value={supplier.supplierCode || "-"} />
            <DetailItem label="Name" value={supplier.name} />
            <DetailItem label="Bank" value={supplier.bankName || "-"} />
            <DetailItem
              label="Account Name"
              value={supplier.bankAccountName || "-"}
            />
            <DetailItem
              label="Account Number"
              value={supplier.bankAccountNumber || "-"}
            />
            <DetailItem label="Active" value={supplier.active ? "Yes" : "No"} />
            <DetailItem
              label="Contact Info"
              value={supplier.contactInfo || "-"}
              valueClassName="whitespace-pre-wrap"
            />
            <DetailItem
              label="Notes"
              value={supplier.notes || "-"}
              valueClassName="whitespace-pre-wrap"
            />
          </DetailList>
        </DetailCard>
      </div>
    </PageSection>
  );
}
