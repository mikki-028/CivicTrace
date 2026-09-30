import {
  ClipboardCheck,
  Megaphone,
  PackageCheck,
  Repeat,
  ScrollText,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fmtDate, fmtTime, isToday } from "@/lib/civic/rules";
import type { CivicEvent, EventType } from "@/lib/civic/types";

const ICONS: Record<EventType, typeof PackageCheck> = {
  collection: PackageCheck,
  report: Megaphone,
  inspection: Search,
  maintenance: Wrench,
  replacement: Repeat,
  compliance: ClipboardCheck,
  verification: ShieldCheck,
  installation: ScrollText,
};

const TONES: Record<EventType, string> = {
  collection: "bg-normal-soft text-normal",
  report: "bg-pending-soft text-pending",
  inspection: "bg-verification-soft text-verification",
  maintenance: "bg-attention-soft text-attention",
  replacement: "bg-verification-soft text-verification",
  compliance: "bg-attention-soft text-attention",
  verification: "bg-normal-soft text-normal",
  installation: "bg-surface-muted text-muted-foreground",
};

export const eventTypeLabel: Record<EventType, string> = {
  collection: "Collection",
  report: "Citizen Report",
  inspection: "Inspection",
  maintenance: "Maintenance",
  replacement: "Replacement",
  compliance: "Compliance",
  verification: "Verification",
  installation: "Installation",
};

export function EventTimeline({
  events,
  onSelect,
  showEntity = true,
  emptyLabel = "No events recorded yet.",
}: {
  events: CivicEvent[];
  onSelect?: (event: CivicEvent) => void;
  showEntity?: boolean;
  emptyLabel?: string;
}) {
  if (!events.length) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ol className="relative space-y-1">
      <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border" aria-hidden />
      {events.map((event) => {
        const Icon = ICONS[event.type];
        return (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onSelect?.(event)}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
                onSelect ? "hover:bg-surface-muted" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface",
                  TONES[event.type],
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{event.title}</span>
                  {showEntity && <span className="mono-id text-muted-foreground">{event.entityId}</span>}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {isToday(event.timestamp)
                    ? `Today · ${fmtTime(event.timestamp)}`
                    : `${fmtDate(event.timestamp)} · ${fmtTime(event.timestamp)}`}
                  {" · "}
                  {event.actor}
                  {event.detail ? ` · ${event.detail}` : ""}
                </span>
              </span>
              {event.hasPhoto && (
                <span className="mt-1 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  PHOTO
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
