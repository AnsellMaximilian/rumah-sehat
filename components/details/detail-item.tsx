import * as React from "react";
import { cn } from "@/lib/utils";

type DetailItemProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export default function DetailItem({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: DetailItemProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-2", className)}>
      <dt className={cn("text-sm font-light text-muted-foreground", labelClassName)}>
        {label}
      </dt>
      <dd className={cn("sm:col-span-3 font-bold", valueClassName)}>{value}</dd>
    </div>
  );
}