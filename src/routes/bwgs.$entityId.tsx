import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, CircleAlert, Map as MapIcon, Megaphone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventDetailDialog } from "@/components/civic/EventDetailDialog";
import { EventTimeline } from "@/components/civic/EventTimeline";
import { InsightCard } from "@/components/civic/InsightCard";
import { InsightDialog } from "@/components/civic/InsightDialog";
import { DetectVerifyActNote, PrototypeNote } from "@/components/civic/PageHeader";
import { QrCode } from "@/components/civic/QrCode";
import { ReportModal } from "@/components/civic/ReportModal";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { VerificationModal } from "@/components/civic/VerificationModal";
import { useCivic } from "@/lib/civic/store";
import { eventsFor, fmtDateTime, openReports } from "@/lib/civic/rules";
import type { BwgEntity, CivicEvent, Flag } from "@/lib/civic/types";

export const Route = createFileRoute("/bwgs/$entityId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.entityId} — Bulk Waste Generator · CivicTrace` },
      {
        name: "description",
        content: `Registration, segregation requirements, inspections, citizen reports and compliance history for bulk waste generator ${params.entityId}.`,
      },
      { property: "og:title", content: `${params.entityId} — Bulk Waste Generator · CivicTrace` },
      {
        property: "og:description",
        content: `Connected compliance history and MCD verification trail for ${params.entityId}.`,
      },
    ],
  }),
  component: BwgDetail,
});

function BwgDetail() {
  const { entityId } = Route.useParams();
  const { getEntity, events, statusOf, flagsFor, verifications } = useCivic();
  const entity = getEntity(entityId);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CivicEvent | null>(null);
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);

  if (!entity || entity.kind !== "bwg") throw notFound();
  const bwg = entity as BwgEntity;

  const status = statusOf(bwg.id);
  const flags = flagsFor(bwg.id);
  const history = eventsFor(events, bwg.id);
  const reportCount = openReports(events, bwg.id).length;
  const trail = verifications.filter((v) => v.entityId === bwg.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/bwgs" className="hover:underline">
              BWGs
            </Link>
            <span>/</span>
            <span className="mono-id">{bwg.id}</span>
          </nav>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-semibold">
            <span className="font-mono">{bwg.id}</span>
            <StatusBadge status={status} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bwg.name} · {bwg.bwgType} · {bwg.servicePoint}, {bwg.ward}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setVerifyOpen(true)}>
            <ShieldCheck className="size-4" /> Assign Verification
          </Button>
          <Button variant="secondary" onClick={() => setReportOpen(true)}>
            <Megaphone className="size-4" /> Report Issue
          </Button>
          <Button asChild variant="outline">
            <Link to="/map" search={{ entity: bwg.id }}>
              <MapIcon className="size-4" /> Open on Map
            </Link>
          </Button>
        </div>
      </div>

      <DetectVerifyActNote />

      <section data-tour="bwg-profile" className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel p-4">
          <h2 className="text-base font-semibold">Registration & obligations</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Registration status</dt>
              <dd className="mt-0.5 font-medium">
                {bwg.registrationVerified ? (
                  <span className="inline-flex items-center gap-1 text-normal">
                    <BadgeCheck className="size-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-attention">
                    <CircleAlert className="size-4" /> Pending
                  </span>
                )}
              </dd>
            </div>
            {[
              ["Entity type", bwg.bwgType],
              ["Ward", bwg.ward],
              ["Segregation requirement", `${bwg.segregationStreams}-stream`],
              ["Required collection frequency", bwg.collectionFrequency],
              ["Authorised handler", bwg.authorisedHandler],
              ["Segregation issues on record", `${bwg.segregationIssues}`],
              ["Citizen reports", `${reportCount}`],
              ["Recent inspection", bwg.inspectionIssue ? "Issue observed" : "No issue recorded"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel p-4">
          <h2 className="text-base font-semibold">Entity QR</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Handover points at this BWG carry the same QR identity layer.
          </p>
          <div className="mx-auto mt-3 max-w-[180px] rounded-lg border border-border p-2">
            <QrCode value={`civictrace://${bwg.id}`} />
          </div>
        </div>
      </section>

      {flags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Compliance signals</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {flags.map((flag) => (
              <InsightCard
                key={flag.id}
                flag={flag}
                onOpenInsight={setActiveFlag}
                actions={
                  <Button size="sm" onClick={() => setVerifyOpen(true)}>
                    Assign Verification
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {trail.length > 0 && (
        <section className="panel p-4">
          <h2 className="text-base font-semibold">MCD verification trail</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {trail.map((record) => (
              <li key={record.id} className="rounded-md bg-surface-muted px-3 py-2">
                <p className="font-medium">
                  {record.outcome === "scheduled"
                    ? "Inspection scheduled"
                    : record.outcome === "verified"
                      ? "Verified non-compliance — routed to existing enforcement workflow"
                      : "Reviewed — no issue found"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {record.note} · {record.actor} · {fmtDateTime(record.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            No penalty is created by CivicTrace. The enforcement decision remains with the municipal
            authority.
          </p>
        </section>
      )}

      <section className="panel p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Connected history</h2>
            <p className="text-xs text-muted-foreground">
              Collections, inspections, segregation events, citizen reports and verifications.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{history.length} events</span>
        </div>
        <div className="mt-3">
          <EventTimeline events={history} onSelect={setActiveEvent} showEntity={false} />
        </div>
        <PrototypeNote className="mt-3" />
      </section>

      <VerificationModal
        entity={bwg}
        flag={flags[0]}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
      />
      <ReportModal entity={bwg} open={reportOpen} onOpenChange={setReportOpen} />
      <EventDetailDialog
        event={activeEvent}
        open={!!activeEvent}
        onOpenChange={(open) => !open && setActiveEvent(null)}
      />
      <InsightDialog
        flag={activeFlag}
        open={!!activeFlag}
        onOpenChange={(open) => !open && setActiveFlag(null)}
      />
    </div>
  );
}
