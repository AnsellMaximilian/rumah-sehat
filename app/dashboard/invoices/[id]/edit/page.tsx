import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import UpdateInvoiceForm from "../../components/update-invoice-form";
import { getInvoiceService } from "@/modules/invoices/invoice.service";

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditInvoicePageProps) {
  const { id } = await params;
  const invoice = await getInvoiceService({ id });

  if (!invoice) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${invoice.invoiceNumber || invoice.id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Invoices", href: "/dashboard/invoices" },
        { label: `Edit ${invoice.invoiceNumber || invoice.id}` },
      ]}
    >
      <UpdateInvoiceForm invoice={invoice} />
    </PageSection>
  );
}
