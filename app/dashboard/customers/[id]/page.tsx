import { notFound } from "next/navigation";
import {
  Clock3Icon,
  FileClockIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
} from "lucide-react";
import DetailItem from "@/components/details/detail-item";
import DetailList from "@/components/details/detail-list";
import QuickValueCard from "@/components/dashboard/quick-value-card";
import DetailCard from "@/components/layout/detail-card";
import PageSection from "@/components/layout/page-section";
import {
  getCustomerService,
} from "@/modules/customers/customer.service";

export default async function Page(
  props: PageProps<"/dashboard/customers/[id]">,
) {
  const { id } = await props.params;
  const customer = await getCustomerService({ id });

  if (!customer) {
    notFound();
  }

  return (
    <PageSection
      title={(customer.name)}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Customers", href: "/dashboard/customers" },
        { label: customer.customerCode },
      ]}
    >
      <div className="space-y-6">
        
        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Customer Details">
            <DetailList>
              <DetailItem label="Code" value={customer.customerCode} />
              <DetailItem label="Name" value={customer.name} />
              <DetailItem label="Address" value={customer.address || "-"} />
              <DetailItem
                label="Notes"
                value={customer.notes || "-"}
              />
            </DetailList>
          </DetailCard>
          
        </div>
      </div>
    </PageSection>
  );
}