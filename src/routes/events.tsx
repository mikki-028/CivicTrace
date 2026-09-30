import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventDetailDialog } from "@/components/civic/EventDetailDialog";
import { eventTypeLabel } from "@/components/civic/EventTimeline";
import { FilterBar } from "@/components/civic/FilterBar";
import { PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { fmtDateTime, isToday } from "@/lib/civic/rules";
import type { CivicEvent, EventType } from "@/lib/civic/types";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Event History — CivicTrace" },
      {
        name: "description",
        content:
          "Global municipal waste event log: collections, citizen reports, inspections, maintenance, replacements, compliance and verifications.",
      },
      { property: "og:title", content: "Event History — CivicTrace" },
      {
        property: "og:description",
        content: "One connected event log across every municipal waste entity in the ward.",
      },
    ],
  }),
  component: EventsPage,
});

const TYPES: EventType[] = [
  "collection",
  "report",
  "inspection",
  "maintenance",
  "replacement",
  "compliance",
  "verification",
  "installation",
];

function EventsPage() {
  const { events, statusOf } = useCivic();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [ward, setWard] = useState("all");
  const [day, setDay] = useState("all");
  const [activeEvent, setActiveEvent] = useState<CivicEvent | null>(null);

  const rows = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
        .filter((event) => {
          if (type !== "all" && event.type !== type) return false;
          if (ward !== "all" && !(event.location ?? "").includes(ward)) return false;
          if (day === "today" && !isToday(event.timestamp)) return false;
          if (day === "earlier" && isToday(event.timestamp)) return false;
          if (
            query &&
            !`${event.entityId} ${event.title} ${event.actor} ${event.location ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase())
          )
            return false;
          return true;
        }),
    [events, type, ward, day, query],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Event History"
        subtitle="The full structured event log. Every row opens the complete record and links back to its entity."
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search entity, actor or location…"
        filters={[
          {
            id: "type",
            label: "Event type",
            value: type,
            onChange: setType,
            options: [
              { value: "all", label: "All event types" },
              ...TYPES.map((t) => ({ value: t, label: eventTypeLabel[t] })),
            ],
          },
          {
            id: "ward",
            label: "Ward",
            value: ward,
            onChange: setWard,
            options: [
              { value: "all", label: "All wards" },
              { value: "Ward 142", label: "Ward 142" },
            ],
          },
          {
            id: "day",
            label: "Date",
            value: day,
            onChange: setDay,
            options: [
              { value: "all", label: "All dates" },
              { value: "today", label: "Today" },
              { value: "earlier", label: "Earlier" },
            ],
          },
        ]}
      />

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead>Timestamp</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Entity Status</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No events match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {fmtDateTime(event.timestamp)}
                </TableCell>
                <TableCell>
                  <Link
                    to={event.entityId.startsWith("BWG") ? "/bwgs/$entityId" : "/assets/$entityId"}
                    params={{ entityId: event.entityId }}
                    className="mono-id hover:underline"
                  >
                    {event.entityId}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{eventTypeLabel[event.type]}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{event.actor}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{event.location ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={statusOf(event.entityId)} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setActiveEvent(event)}>
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PrototypeNote />

      <EventDetailDialog
        event={activeEvent}
        open={!!activeEvent}
        onOpenChange={(open) => !open && setActiveEvent(null)}
      />
    </div>
  );
}
