import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { fmtTime, severityToStatus } from "@/lib/civic/rules";
import type { Flag } from "@/lib/civic/types";

export function InsightCard({
  flag,
  onOpenInsight,
  actions,
}: {
  flag: Flag;
  onOpenInsight?: (flag: Flag) => void;
  actions?: React.ReactNode;
}) {
  const isBwg = flag.entityId.startsWith("BWG");
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-attention-soft text-attention">
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">{flag.title}</h3>
            <p className="mono-id mt-0.5 text-muted-foreground">{flag.entityId}</p>
          </div>
        </div>
        <StatusBadge status={severityToStatus(flag.severity)} size="sm" />
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
        {flag.evidence.slice(0, 4).map((line) => (
          <div key={line} className="flex gap-2 text-muted-foreground">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
            <span>{line}</span>
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-xs">
        <p className="text-muted-foreground">Suggested review</p>
        <p className="mt-0.5 font-medium">{flag.suggestedReview}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link
            to={isBwg ? "/bwgs/$entityId" : "/assets/$entityId"}
            params={{ entityId: flag.entityId }}
          >
            {isBwg ? "Review Case" : "View Entity"}
          </Link>
        </Button>
        {onOpenInsight && (
          <Button size="sm" variant="ghost" onClick={() => onOpenInsight(flag)}>
            Why was this flagged?
          </Button>
        )}
        {actions}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Detected {fmtTime(flag.detectedAt)}
        </span>
      </div>
    </div>
  );
}
