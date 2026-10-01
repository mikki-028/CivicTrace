import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  Megaphone,
  PackageCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventTimeline } from "@/components/civic/EventTimeline";
import { EventDetailDialog } from "@/components/civic/EventDetailDialog";
import { InsightCard } from "@/components/civic/InsightCard";
import { InsightDialog } from "@/components/civic/InsightDialog";
import { KpiCard } from "@/components/civic/KpiCard";
import { OverviewMap } from "@/components/civic/OverviewMap";
import { DetectVerifyActNote, PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { useCivic } from "@/lib/civic/store";
import { isToday } from "@/lib/civic/rules";
import type { CivicEvent, Flag } from "@/lib/civic/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Waste Intelligence Overview — CivicTrace" },
      {
        name: "description",
        content:
          "Connected ground-level activity across municipal waste assets and bulk waste generators in Ward 142.",
      },
      { property: "og:title", content: "Waste Intelligence Overview — CivicTrace" },
      {
        property: "og:description",
        content:
          "Digital identity, structured events, rule-based pattern detection and GIS for municipal waste management.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { totals, flags, events, clusters } = useCivic();
  const [activeEvent, setActiveEvent] = useState<CivicEvent | null>(null);
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);

  const todayEvents = events
    .filter((e) => isToday(e.timestamp))
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Intelligence Overview"
        subtitle="Connected ground-level activity across municipal waste assets and bulk waste generators."
        actions={
          <Button asChild variant="secondary">
            <Link to="/queue">
              <TriangleAlert className="size-4" /> Attention Queue
            </Link>
          </Button>
        }
      />

      <DetectVerifyActNote />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Municipal Waste Assets"
          value={totals.assets}
          caption="Active assets"
          icon={Trash2}
        />
        <KpiCard
          label="Registered BWGs"
          value={totals.bwgs}
          caption="Registered entities"
          icon={Building2}
        />
        <KpiCard
          label="Collection Events"
          value={totals.collections}
          caption="Recorded events"
          icon={PackageCheck}
          tone="positive"
        />
        <KpiCard
          label="Citizen Reports"
          value={totals.reports}
          caption="Reports received"
          icon={Megaphone}
          tone="attention"
        />
        <KpiCard
          label="Attention Flags"
          value={totals.flags}
          caption="Require review"
          icon={TriangleAlert}
          tone="priority"
        />
      </section>
      <PrototypeNote />

      <OverviewMap />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Requires Attention</h2>
            <p className="text-sm text-muted-foreground">
              Rule-Based Pattern Detection across today's recorded events.
            </p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to="/queue">View all</Link>
          </Button>
        </div>
        {flags.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {flags.slice(0, 4).map((flag) => (
              <InsightCard key={flag.id} flag={flag} onOpenInsight={setActiveFlag} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No active attention flags for this ward.
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Recent Activity</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/events">
                <ClipboardList className="size-4" /> Event history
              </Link>
            </Button>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every event is clickable and opens the entity's complete history.
          </p>
          <div className="mt-3">
            <EventTimeline events={todayEvents} onSelect={setActiveEvent} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-base font-semibold">Ward 142 — Activity Summary</h2>
            <dl className="mt-3 divide-y divide-border text-sm">
              {[
                ["Municipal Waste Assets", totals.assets],
                ["Registered BWGs", totals.bwgs],
                ["Collection Events", totals.collections],
                ["Citizen Reports", totals.reports],
                ["Active Attention Flags", totals.flags],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <PrototypeNote className="mt-3" />
          </div>

          <div className="panel p-4">
            <h2 className="text-base font-semibold">Geographic concentration</h2>
            {clusters.length ? (
              <ul className="mt-3 space-y-3">
                {clusters.map((cluster) => (
                  <li key={cluster.servicePoint} className="rounded-md bg-surface-muted p-3">
                    <p className="text-sm font-medium">
                      {cluster.servicePoint} · {cluster.ward}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{cluster.note}</p>
                    <p className="mono-id mt-2 text-muted-foreground">
                      {cluster.entityIds.join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No geographic concentration detected right now.
              </p>
            )}
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link to="/map" search={{}}>Open GIS map</Link>
            </Button>
          </div>
        </div>
      </section>

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
