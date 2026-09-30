import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "attention" | "priority";
}) {
  const toneClass = {
    neutral: "text-muted-foreground bg-surface-muted",
    positive: "text-normal bg-normal-soft",
    attention: "text-attention bg-attention-soft",
    priority: "text-priority bg-priority-soft",
  }[tone];

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className={cn("flex size-7 items-center justify-center rounded-md", toneClass)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
