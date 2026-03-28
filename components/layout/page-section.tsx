import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import React from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default async function PageSection({
  children,
  title,
  breadcrumbItems,
}: {
  children: React.ReactNode;
  title: string;
  breadcrumbItems: BreadcrumbItem[];
}) {
  return (
    <div>
      <header className="mb-4 space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem key={index}>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-bold">{title}</h1>
        <Separator />
      </header>
      {children}
    </div>
  );
}
