import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InsightDialog } from "@/components/civic/InsightDialog";
import { DetectVerifyActNote, PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { VerificationModal } from "@/components/civic/VerificationModal";
import { useCivic } from "@/lib/civic/store";
import { fmtDateTime, severityToStatus } from "@/lib/civic/rules";
import type { CivicEntity, Flag, FlagSeverity } from "@/lib/civic/types";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Attention Queue — CivicTrace" },
      {
        name: "description",
        content:
          "Operational queue of priority reviews, attention flags, verification requests and maintenance needs across the ward.",
      },
      { property: "og:title", content: "Attention Queue — CivicTrace" },
      {
        property: "og:description",
        content: "Review signals raised by rule-based pattern detection, ready for MCD verification.",
      },
    ],
  }),
  component: QueuePage,
});

const SECTIONS: { severity: FlagSeverity; title: string; note: string }[] = [
  { severity: "priority", title: "Priority Review", note: "Multiple signals with supporting evidence." },
  { severity: "attention", title: "Requires Attention", note: "Recurring patterns detected today." },
  { severity: "verification", title: "Verification Required", note: "Awaiting an MCD field check." },
  { severity: "maintenance", title: "Maintenance Required", note: "Repeated repairs on the asset." },
];

function QueuePage() {
  const { flags, getEntity, dismissFlag, verifications } = useCivic();
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{ entity: CivicEntity; flag: Flag } | null>(null);

  const scheduled = new Set(
    verifications.filter((v) => v.outcome === "scheduled").map((v) => v.entityId),
  );

  const bucket = (severity: FlagSeverity) =>
    flags.filter((flag) =>
      severity === "verification"
        ? scheduled.has(flag.entityId)
        : flag.severity === severity && !scheduled.has(flag.entityId),
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attention Queue"
        subtitle="Every card is a review signal raised by a transparent rule — not a determination of fault."
      />
      <DetectVerifyActNote />

      {SECTIONS.map((section) => {
        const items = bucket(section.severity);
        return (
          <section key={section.severity} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <StatusBadge status={severityToStatus(section.severity)} size="sm" />
              <span className="text-xs text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"} · {section.note}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nothing in this queue.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((flag) => {
                  const entity = getEntity(flag.entityId);
                  const isBwg = flag.entityId.startsWith("BWG");
                  return (
                    <div key={flag.id} data-tour={`flag-${flag.id}`} className="panel p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="mono-id">{flag.entityId}</p>
                          <h3 className="mt-0.5 text-sm font-semibold">{flag.title}</h3>
                        </div>
                        <StatusBadge status={severityToStatus(flag.severity)} size="sm" />
                      </div>

                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {flag.evidence.slice(0, 3).map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
                            {line}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                        <p>
                          <span className="text-muted-foreground">Detected: </span>
                          {fmtDateTime(flag.detectedAt)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Suggested review: </span>
                          {flag.suggestedReview}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link
                            to={isBwg ? "/bwgs/$entityId" : "/assets/$entityId"}
                            params={{ entityId: flag.entityId }}
                          >
                            View
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setActiveFlag(flag)}>
                          Why flagged?
                        </Button>
                        {entity && (
                          <Button size="sm" onClick={() => setVerifyTarget({ entity, flag })}>
                            {section.severity === "verification" ? "Verify" : "Assign"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            dismissFlag(flag.id);
                            toast.success("Signal dismissed from the queue", {
                              description: `${flag.entityId} · ${flag.title}`,
                            });
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <PrototypeNote />

      <InsightDialog
        flag={activeFlag}
        open={!!activeFlag}
        onOpenChange={(open) => !open && setActiveFlag(null)}
      />
      {verifyTarget && (
        <VerificationModal
          entity={verifyTarget.entity}
          flag={verifyTarget.flag}
          open
          onOpenChange={(open) => !open && setVerifyTarget(null)}
        />
      )}
    </div>
  );
}
