import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventTimeline } from "@/components/civic/EventTimeline";
import { InsightCard } from "@/components/civic/InsightCard";
import { InsightDialog } from "@/components/civic/InsightDialog";
import { MapCanvas, MapLegend } from "@/components/civic/MapCanvas";
import { PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { eventsFor, fmtDateTime, openReports } from "@/lib/civic/rules";
import type { CivicEntity, Flag } from "@/lib/civic/types";

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>): { entity?: string | undefined } => ({
    entity: typeof search["entity"] === "string" ? (search["entity"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "GIS Waste Intelligence — CivicTrace" },
      {
        name: "description",
        content:
          "Ward-level GIS view of municipal waste assets and bulk waste generators, with drill-down from city to entity event history.",
      },
      { property: "og:title", content: "GIS Waste Intelligence — CivicTrace" },
      {
        property: "og:description",
        content: "City → Ward → Location → Entity → Event History, on one connected map.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { entity: entityParam } = Route.useSearch();
  const { entities, events, statusOf, flagsFor, clusters, totals } = useCivic();
  const [selectedId, setSelectedId] = useState<string | null>(entityParam ?? "BIN-0037");
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);

  const selected = entities.find((e) => e.id === (selectedId ?? "")) ?? null;
  const select = (entity: CivicEntity) => setSelectedId(entity.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="GIS Waste Intelligence"
        subtitle="Delhi → Ward 142 → Service point → Entity → Event history. Click any marker to open its entity."
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-3">
          <MapCanvas
            entities={entities}
            statusOf={statusOf}
            selectedId={selectedId}
            onSelect={select}
            className="h-[420px] sm:h-[520px]"
          />
          <div className="panel p-3">
            <MapLegend />
          </div>
        </div>

        <div className="space-y-4">
          {selected ? (
            <SelectedPanel entity={selected} onOpenInsight={setActiveFlag} />
          ) : (
            <div className="panel p-6 text-center text-sm text-muted-foreground">
              Select a marker to view the entity.
            </div>
          )}

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

          {clusters.length > 0 && (
            <div className="panel p-4">
              <h2 className="text-base font-semibold">Geographic concentration detected</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {clusters.map((cluster) => (
                  <li key={cluster.servicePoint} className="rounded-md bg-surface-muted p-3">
                    <p className="font-medium">
                      {cluster.servicePoint} · {cluster.ward}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{cluster.note}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cluster.entityIds.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedId(id)}
                          className="mono-id rounded border border-border px-1.5 py-0.5 hover:bg-surface"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <InsightDialog
        flag={activeFlag}
        open={!!activeFlag}
        onOpenChange={(open) => !open && setActiveFlag(null)}
      />
    </div>
  );
}

function SelectedPanel({
  entity,
  onOpenInsight,
}: {
  entity: CivicEntity;
  onOpenInsight: (flag: Flag) => void;
}) {
  const { events, statusOf, flagsFor } = useCivic();
  const history = eventsFor(events, entity.id);
  const latest = history[0];
  const flags = flagsFor(entity.id);
  const isBwg = entity.kind === "bwg";

  return (
    <div className="panel p-4">
      <nav className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        <span>Delhi</span>
        <ChevronRight className="size-3" />
        <span>{entity.ward}</span>
        <ChevronRight className="size-3" />
        <span>{entity.servicePoint}</span>
        <ChevronRight className="size-3" />
        <span className="mono-id text-foreground">{entity.id}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-lg font-semibold">{entity.id}</h2>
        <StatusBadge status={statusOf(entity.id)} size="sm" />
      </div>
      <p className="text-xs text-muted-foreground">
        {isBwg ? `${entity.bwgType} · ${entity.name}` : "Municipal Waste Asset"} ·{" "}
        {entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}
      </p>

      <dl className="mt-3 divide-y divide-border text-sm">
        <div className="flex justify-between gap-3 py-2">
          <dt className="text-muted-foreground">Latest event</dt>
          <dd className="text-right font-medium">
            {latest ? latest.title : "—"}
            {latest && (
              <span className="block text-xs font-normal text-muted-foreground">
                {fmtDateTime(latest.timestamp)}
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt className="text-muted-foreground">Open reports</dt>
          <dd className="font-medium">{openReports(events, entity.id).length}</dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt className="text-muted-foreground">Historical pattern</dt>
          <dd className="text-right font-medium">
            {entity.kind === "asset"
              ? `${entity.historicalSimilarIncidents} similar incidents`
              : `${entity.segregationIssues} segregation issues`}
          </dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt className="text-muted-foreground">Suggested review</dt>
          <dd className="text-right font-medium">{flags[0]?.suggestedReview ?? "No review needed"}</dd>
        </div>
      </dl>

      {flags[0] && (
        <div className="mt-3">
          <InsightCard flag={flags[0]} onOpenInsight={onOpenInsight} />
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Recent event history</p>
        <div className="mt-2">
          <EventTimeline events={history.slice(0, 4)} showEntity={false} />
        </div>
      </div>

      <Button asChild className="mt-3 w-full">
        <Link
          to={isBwg ? "/bwgs/$entityId" : "/assets/$entityId"}
          params={{ entityId: entity.id }}
        >
          Open full entity record
        </Link>
      </Button>
    </div>
  );
}
