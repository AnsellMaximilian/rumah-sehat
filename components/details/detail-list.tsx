import * as React from "react";
import { cn } from "@/lib/utils";

export default function DetailList({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return <dl className={cn("space-y-3", className)} {...props} />;
}