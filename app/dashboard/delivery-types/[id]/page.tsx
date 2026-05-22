import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/layout/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeliveryTypeService } from "@/modules/delivery-types/delivery-type.service";

interface DeliveryTypePageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: DeliveryTypePageProps) {
  const { id } = await params;
  const deliveryType = await getDeliveryTypeService({ id });

  if (!deliveryType) {
    notFound();
  }

  return (
    <PageSection
      title={deliveryType.name}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Delivery Types", href: "/dashboard/delivery-types" },
        { label: deliveryType.name },
      ]}
    >
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href={`/dashboard/delivery-types/${deliveryType.id}/edit`}>Edit</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Default Charge Type</p>
          <p className="mt-1 font-medium">
            {deliveryType.defaultChargeType?.replaceAll("_", " ") ?? "No default"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Default Account</p>
          <p className="mt-1 font-medium">{deliveryType.defaultAccountName ?? "No account"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Bill Customer By Default</p>
          <p className="mt-1 font-medium">{deliveryType.defaultBillToCustomer ? "Yes" : "No"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Requires Manual Amount</p>
          <p className="mt-1 font-medium">{deliveryType.requiresManualAmount ? "Yes" : "No"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="mt-1">
            {deliveryType.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
        <div className="rounded-lg border p-4 md:col-span-2">
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="mt-1 whitespace-pre-wrap">{deliveryType.notes || "No notes"}</p>
        </div>
      </div>
    </PageSection>
  );
}
