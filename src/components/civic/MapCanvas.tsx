import { Building2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusLabel } from "@/components/civic/StatusBadge";
import type { CivicEntity, StatusLevel } from "@/lib/civic/types";

const DOT: Record<StatusLevel, string> = {
  normal: "bg-normal border-normal",
  pending: "bg-pending border-pending",
  attention: "bg-attention border-attention",
  maintenance: "bg-attention border-attention",
  priority: "bg-priority border-priority",
  verification: "bg-verification border-verification",
};

const BOUNDS = { minLat: 28.6375, maxLat: 28.6475, minLng: 77.2135, maxLng: 77.2265 };

export function MapCanvas({
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
  const pos = (entity: CivicEntity) => ({
    left: `${((entity.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100}%`,
    top: `${(1 - (entity.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100}%`,
  });

  return (
    <div
      className={cn(
        "map-grid relative overflow-hidden rounded-lg border border-border bg-surface-muted",
        className,
      )}
    >
      {/* Simulated ward road network */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute top-[22%] left-0 h-3 w-full bg-border/70" />
        <div className="absolute top-0 left-[38%] h-full w-3 bg-border/70" />
        <div className="absolute top-[68%] left-0 h-2 w-full bg-border/50" />
        <div className="absolute top-0 left-[72%] h-full w-2 bg-border/50" />
        <div className="absolute top-[30%] left-[44%] size-28 rounded-md bg-normal/10" />
        <div className="absolute bottom-[8%] left-[8%] size-24 rounded-md bg-pending/10" />
      </div>

      <div className="absolute top-3 left-3 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-panel">
        <p className="font-semibold">Delhi · Ward 142</p>
        <p className="text-muted-foreground">Simulated GIS canvas — no API key required</p>
      </div>

      {entities.map((entity) => {
        const status = statusOf(entity.id);
        const selected = selectedId === entity.id;
        const Icon = entity.kind === "bwg" ? Building2 : Trash2;
        return (
          <button
            key={entity.id}
            type="button"
            onClick={() => onSelect(entity)}
            style={pos(entity)}
            title={`${entity.id} — ${statusLabel(status)}`}
            className={cn(
              "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface p-0 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected && "scale-110 ring-2 ring-foreground ring-offset-2",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full border text-background shadow-raised",
                entity.kind === "bwg" ? "size-7" : "size-6",
                DOT[status],
              )}
            >
              <Icon className="size-3.5 text-surface" />
            </span>
            <span className="mono-id pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded border border-border bg-surface px-1 py-0.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
              {entity.id}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="grid gap-3 text-[11px] sm:grid-cols-2">
      <div>
        <p className="mb-1.5 font-semibold">Municipal Waste Assets</p>
        <ul className="space-y-1 text-muted-foreground">
          {[
            ["normal", "Normal / Collected"],
            ["pending", "Pending"],
            ["priority", "Issue reported"],
            ["attention", "Maintenance required"],
          ].map(([status, label]) => (
            <li key={label} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", DOT[status as StatusLevel])} />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 font-semibold">Bulk Waste Generators</p>
        <ul className="space-y-1 text-muted-foreground">
          {[
            ["normal", "Registered & compliant"],
            ["attention", "Requires attention"],
            ["priority", "Non-compliant"],
            ["verification", "Verification required"],
          ].map(([status, label]) => (
            <li key={label} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", DOT[status as StatusLevel])} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
