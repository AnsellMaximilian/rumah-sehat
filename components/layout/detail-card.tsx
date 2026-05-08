import * as React from "react";
import { cn } from "@/lib/utils";

type DetailCardProps = React.ComponentProps<"section"> & {
  title: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
};

export default function DetailCard({
  title,
  children,
  className,
  contentClassName,
  ...props
}: DetailCardProps) {
  return (
    <section
      className={cn("overflow-hidden rounded-md border border-border", className)}
      {...props}
    >
      <header className="border-b border-border p-2">
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <div className={cn("p-2", contentClassName)}>{children}</div>
    </section>
  );
}