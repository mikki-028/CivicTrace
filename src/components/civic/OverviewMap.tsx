import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { eventsFor, openReports } from "@/lib/civic/rules";
import { useCivic } from "@/lib/civic/store";
import type { CivicEntity, StatusLevel } from "@/lib/civic/types";
import { cn } from "@/lib/utils";

type MapFilter = "all" | "assets" | "bwgs" | "issues" | "attention";

const FILTERS: { value: MapFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "assets", label: "Assets" },
  { value: "bwgs", label: "BWGs" },
  { value: "issues", label: "Issues" },
  { value: "attention", label: "Attention" },
];

const DELHI_CENTER: [number, number] = [28.6421, 77.2198];
const DELHI_ZOOM = 16;

export function OverviewMap() {
  const { entities, events, flagsFor, statusOf } = useCivic();
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<ReturnType<typeof import("leaflet")["layerGroup"]> | null>(null);
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>("BIN-0037");

  const visibleEntities = useMemo(
    () =>
      entities.filter((entity) => {
        const status = statusOf(entity.id);
        if (filter === "assets") return entity.kind === "asset";
        if (filter === "bwgs") return entity.kind === "bwg";
        if (filter === "issues") return status === "priority";
        if (filter === "attention") return status === "attention" || status === "maintenance";
        return true;
      }),
    [entities, filter, statusOf],
  );

  const selected = entities.find((entity) => entity.id === selectedId) ?? null;

  useEffect(() => {
    const node = mapNodeRef.current;
    if (!node || mapRef.current) return;

    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !mapNodeRef.current) return;

      const map = L.map(mapNodeRef.current, {
        center: DELHI_CENTER,
        zoom: DELHI_ZOOM,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.rectangle(
        [
          [28.6378, 77.2141],
          [28.6471, 77.2261],
        ],
        {
          className: "civic-map-ward",
          color: "var(--color-primary)",
          fillColor: "var(--color-primary)",
          fillOpacity: 0.06,
          weight: 2,
          dashArray: "6 5",
          interactive: false,
        },
      ).addTo(map);

      L.tooltip({ permanent: true, direction: "top", className: "civic-map-ward-label" })
        .setLatLng([28.6467, 77.215])
        .setContent("Ward 142")
        .addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      markerLayerRef.current = markerLayer;
    });

    return () => {
      disposed = true;
      markerLayerRef.current?.clearLayers();
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      markerRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) {
      const timer = window.setTimeout(() => setFilter((current) => current), 40);
      return () => window.clearTimeout(timer);
    }

    markerLayer.clearLayers();
    markerRefs.current.clear();

    void import("leaflet").then((L) => {
      visibleEntities.forEach((entity) => {
        const status = statusOf(entity.id);
        const icon = L.divIcon({
          className: "civic-map-icon",
          html: `<span class="civic-map-marker civic-map-marker--${status} civic-map-marker--${entity.kind}" aria-hidden="true"></span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const marker = L.marker([entity.lat, entity.lng], {
          icon,
          title: `${entity.id} — ${entity.servicePoint}`,
          keyboard: true,
        }).addTo(markerLayer);
        marker.on("click", () => setSelectedId(entity.id));
        marker.bindTooltip(entity.id, { direction: "top", offset: [0, -13] });
        markerRefs.current.set(entity.id, marker);
      });
    });
  }, [filter, statusOf, visibleEntities]);

  const resetMap = () => {
    mapRef.current?.setView(DELHI_CENTER, DELHI_ZOOM, { animate: true });
    setSelectedId("BIN-0037");
  };

  return (
    <section className="space-y-3" aria-labelledby="overview-map-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="overview-map-title" className="text-lg font-semibold">
            GIS Waste Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Illustrative prototype data — map locations are demo coordinates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-surface p-1">
          {FILTERS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "secondary" : "ghost"}
              className="h-7 px-2.5"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="relative h-[350px] sm:h-[390px]">
          <div ref={mapNodeRef} className="h-full w-full" aria-label="Interactive map of CivicTrace entities in Ward 142" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 z-[500] shadow-raised"
            onClick={resetMap}
          >
            <LocateFixed className="size-4" /> Reset
          </Button>
          <div className="pointer-events-none absolute bottom-7 left-3 z-[500] rounded-md border border-border bg-surface/95 px-2.5 py-2 shadow-panel backdrop-blur-sm">
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium">
              {[
                ["normal", "Normal / Compliant"],
                ["pending", "Pending"],
                ["attention", "Attention / Maintenance"],
                ["priority", "Issue / Non-Compliant"],
                ["verification", "Verification Required"],
              ].map(([status, label]) => (
                <li key={status} className="flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", markerColor(status as StatusLevel))} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selected ? (
          <EntitySnapshot entity={selected} />
        ) : (
          <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Select a marker to view its CivicTrace status.
          </p>
        )}
      </div>
    </section>
  );
}

function EntitySnapshot({ entity }: { entity: CivicEntity }) {
  const { events, flagsFor, statusOf } = useCivic();
  const status = statusOf(entity.id);
  const reports = openReports(events, entity.id);
  const latestReport = eventsFor(events, entity.id).find((event) => event.type === "report");
  const issue = flagsFor(entity.id)[0]?.title ?? latestReport?.issueType ?? "No active issue";
  const isBwg = entity.kind === "bwg";

  return (
    <div className="grid gap-3 border-t border-border bg-surface px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mono-id font-semibold text-foreground">{entity.id}</p>
          <StatusBadge status={status} size="sm" />
        </div>
        <p className="mt-1 text-sm font-medium">
          {entity.servicePoint} · {entity.ward}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isBwg ? `Issue: ${issue}` : `${reports.length} open report${reports.length === 1 ? "" : "s"}`}
        </p>
      </div>
      <Button asChild size="sm" className="w-full sm:w-auto">
        <Link
          to={isBwg ? "/bwgs/$entityId" : "/assets/$entityId"}
          params={{ entityId: entity.id }}
        >
          {isBwg ? "Review Case" : "View Entity"}
        </Link>
      </Button>
    </div>
  );
}

function markerColor(status: StatusLevel) {
  if (status === "normal") return "bg-normal";
  if (status === "pending") return "bg-pending";
  if (status === "priority") return "bg-priority";
  if (status === "verification") return "bg-verification";
  return "bg-attention";
}