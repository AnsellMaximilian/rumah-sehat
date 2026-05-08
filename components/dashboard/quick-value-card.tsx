"use client";

import * as React from "react";
import {
  ArrowDownRightIcon,
  InfoIcon,
  ArrowUpRightIcon,
  MinusIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type QuickValueCardProps = {
  title: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  info?: React.ReactNode;
  badge?: {
    label: React.ReactNode;
    direction?: "increase" | "decrease" | "neutral";
  };
  className?: string;
};

function getBadgeVariant(direction: NonNullable<QuickValueCardProps["badge"]>["direction"]) {
  switch (direction) {
    case "increase":
      return "default";
    case "decrease":
      return "destructive";
    default:
      return "secondary";
  }
}

function TrendIcon({
  direction = "neutral",
}: {
  direction?: NonNullable<QuickValueCardProps["badge"]>["direction"];
}) {
  switch (direction) {
    case "increase":
      return <ArrowUpRightIcon className="size-3.5" />;
    case "decrease":
      return <ArrowDownRightIcon className="size-3.5" />;
    default:
      return <MinusIcon className="size-3.5" />;
  }
}

export default function QuickValueCard({
  title,
  value,
  description,
  icon,
  info,
  badge,
  className,
}: QuickValueCardProps) {
  return (
    <TooltipProvider>
      <Card
        size="sm"
        className={cn("gap-0 border border-border/70 shadow-xs", className)}
      >
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {icon ? (
              <div className="flex size-7 items-center justify-center rounded-full border border-border/70 bg-muted/30">
                <span className="text-muted-foreground [&_svg]:size-3.5">
                  {icon}
                </span>
              </div>
            ) : null}
            <span>{title}</span>
          </CardTitle>
          {info ? (
            <CardAction>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground"
                    aria-label={`More information about ${typeof title === "string" ? title : "this metric"}`}
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={8} className="max-w-64">
                  {info}
                </TooltipContent>
              </Tooltip>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            {badge ? (
              <Badge
                variant={getBadgeVariant(badge.direction)}
                className="gap-1 rounded-full"
              >
                <TrendIcon direction={badge.direction} />
                {badge.label}
              </Badge>
            ) : null}
          </div>
          {description ? (
            <div className="text-sm text-muted-foreground">{description}</div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}