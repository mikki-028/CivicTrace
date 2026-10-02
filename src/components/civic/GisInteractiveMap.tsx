import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import type { Map as LeafletMap, MarkerClusterGroup } from "leaflet";
import type {} from "leaflet.markercluster";

import { Button } from "@/components/ui/button";
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

export function GisInteractiveMap({
  entities,
  statusOf,
  selectedId,
  onSelect,
  className,
}: {
  entities: CivicEntity[];
  statusOf: (id: string) => StatusLevel;
  selectedId?: string | null;
  onSelect: (entity: CivicEntity) => void;
  className?: string;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [mapReady, setMapReady] = useState(false);

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

  useEffect(() => {
    const node = mapNodeRef.current;
    if (!node || mapRef.current) return;

    let disposed = false;
    void Promise.all([import("leaflet"), import("leaflet.markercluster")]).then(([L]) => {
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

      const clusterLayer = L.markerClusterGroup({
        maxClusterRadius: 48,
        disableClusteringAtZoom: 18,
        showCoverageOnHover: true,
        spiderfyOnMaxZoom: true,
        spiderfyDistanceMultiplier: 1.35,
        iconCreateFunction: (cluster) =>
          L.divIcon({
            className: "civic-map-cluster-wrap",
            html: `<span class="civic-map-cluster">${cluster.getChildCount()}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          }),
      }).addTo(map);

      mapRef.current = map;
      clusterRef.current = clusterLayer;
      setMapReady(true);
    });

    return () => {
      disposed = true;
      clusterRef.current?.clearLayers();
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const clusterLayer = clusterRef.current;
    if (!mapReady || !clusterLayer) return;

    clusterLayer.clearLayers();
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed) return;
      const markers = visibleEntities.map((entity) => {
        const status = statusOf(entity.id);
        const selected = selectedId === entity.id;
        const icon = L.divIcon({
          className: "civic-map-icon",
          html: `<span class="civic-map-marker civic-map-marker--${status} civic-map-marker--${entity.kind}${selected ? " civic-map-marker--selected" : ""}" aria-hidden="true"></span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const marker = L.marker([entity.lat, entity.lng], {
          icon,
          title: `${entity.id} — ${entity.servicePoint}`,
          keyboard: true,
        });
        marker.on("click", () => onSelect(entity));
        marker.bindTooltip(`${entity.id} · ${entity.servicePoint}`, {
          direction: "top",
          offset: [0, -13],
        });
        return marker;
      });
      clusterLayer.addLayers(markers);
    });

    return () => {
      disposed = true;
    };
  }, [mapReady, onSelect, selectedId, statusOf, visibleEntities]);

  const resetMap = () => {
    mapRef.current?.setView(DELHI_CENTER, DELHI_ZOOM, { animate: true });
    const defaultEntity = entities.find((entity) => entity.id === "BIN-0037");
    if (defaultEntity) onSelect(defaultEntity);
  };

  return (
    <div className={cn("panel relative overflow-hidden", className)}>
      <div
        ref={mapNodeRef}
        className="h-full w-full"
        aria-label="Interactive clustered map of CivicTrace entities in Ward 142"
      />

      <div className="absolute top-3 left-12 z-[500] flex max-w-[calc(100%-7.75rem)] flex-wrap items-center gap-1 rounded-md border border-border bg-surface/95 p-1 shadow-panel backdrop-blur-sm">
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

      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-3 right-3 z-[500] size-9 shadow-raised"
        onClick={resetMap}
        aria-label="Reset map view"
        title="Reset map view"
      >
        <LocateFixed className="size-4" />
      </Button>

      <div className="pointer-events-none absolute right-3 bottom-7 z-[500] rounded-md border border-border bg-surface/95 px-2 py-1 text-[10px] font-medium shadow-panel backdrop-blur-sm">
        {visibleEntities.length} location{visibleEntities.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}