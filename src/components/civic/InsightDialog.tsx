import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { fmtDateTime, ruleById, severityToStatus } from "@/lib/civic/rules";
import type { Flag } from "@/lib/civic/types";

export function InsightDialog({
  flag,
  open,
  onOpenChange,
}: {
  flag: Flag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!flag) return null;
  const rule = ruleById(flag.ruleId);
  const isBwg = flag.entityId.startsWith("BWG");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Why was this flagged?</DialogTitle>
          <DialogDescription>
            Rule-Based Pattern Detection — deterministic rules, fully visible to the reviewing official.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Entity</p>
            <p className="mono-id">{flag.entityId}</p>
          </div>
          <StatusBadge status={severityToStatus(flag.severity)} size="sm" />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Evidence</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {flag.evidence.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Rule triggered</p>
          <p className="mt-1 font-medium">
            {rule?.id} — {flag.ruleName}
          </p>
          {rule && <p className="mt-1 text-xs text-muted-foreground">{rule.condition}</p>}
          <p className="mt-2 text-xs">
            <span className="text-muted-foreground">Suggested review: </span>
            <span className="font-medium">{flag.suggestedReview}</span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Detected {fmtDateTime(flag.detectedAt)}
          </p>
        </div>

        <p className="rounded-md bg-attention-soft px-3 py-2 text-xs font-medium text-attention">
          This is an administrative review signal, not a final determination. CivicTrace detects
          patterns. MCD verifies.
        </p>

        <DialogFooter>
          <Button asChild>
            <Link
              to={isBwg ? "/bwgs/$entityId" : "/assets/$entityId"}
              params={{ entityId: flag.entityId }}
              onClick={() => onOpenChange(false)}
            >
              Open entity
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
