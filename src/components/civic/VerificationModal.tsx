import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCivic } from "@/lib/civic/store";
import type { CivicEntity, Flag, VerificationRecord } from "@/lib/civic/types";

export function VerificationModal({
  entity,
  flag,
  open,
  onOpenChange,
}: {
  entity: CivicEntity;
  flag?: Flag | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { recordVerification } = useCivic();
  const [outcome, setOutcome] = useState<VerificationRecord["outcome"] | null>(null);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(() => setOutcome(null), 200);
  };

  const act = (next: VerificationRecord["outcome"], note: string) => {
    recordVerification({
      entityId: entity.id,
      flagTitle: flag?.title ?? "Review requested",
      outcome: next,
      note,
    });
    setOutcome(next);
    toast.success(
      next === "scheduled"
        ? "Inspection scheduled"
        : next === "verified"
          ? "Verified by MCD"
          : "Case dismissed — no issue found",
      { description: `${entity.id} · recorded by MCD Official` },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {outcome ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-normal" />
            <h2 className="mt-3 text-lg font-semibold">
              {outcome === "scheduled"
                ? "Inspection scheduled"
                : outcome === "verified"
                  ? "Verified by MCD"
                  : "No issue found"}
            </h2>
            <p className="mono-id mt-2">{entity.id}</p>
            {outcome === "verified" && (
              <div className="mt-4 rounded-md border border-border bg-surface-muted px-3 py-3 text-sm">
                <p className="font-semibold">Route to Existing Enforcement Workflow</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No penalty has been created. The enforcement decision remains with the municipal
                  authority under existing MCD processes.
                </p>
              </div>
            )}
            <Button className="mt-4 w-full" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-normal" /> MCD Verification
              </DialogTitle>
              <DialogDescription>
                CivicTrace records the review signal. The verification decision is made by MCD.
              </DialogDescription>
            </DialogHeader>

            <dl className="divide-y divide-border rounded-md border border-border text-sm">
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-muted-foreground">Case</dt>
                <dd className="mono-id">{entity.id}</dd>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="font-medium">{flag?.title ?? "Review requested"}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs text-muted-foreground uppercase">Evidence</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {(flag?.evidence ?? ["Manual review requested by ward official"]).map((line) => (
                  <li key={line} className="flex gap-2 text-muted-foreground">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => act("scheduled", "Field inspection scheduled by ward official")}
              >
                Schedule Inspection
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => act("verified", "Non-compliance verified by MCD official")}
              >
                Mark as Verified Non-Compliance
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => act("dismissed", "Reviewed — no issue found")}
              >
                Dismiss / No Issue Found
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              No penalty is created automatically. Municipal authority remains responsible for the
              enforcement decision.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
