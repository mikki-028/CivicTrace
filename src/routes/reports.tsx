import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";

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
import { FilterBar } from "@/components/civic/FilterBar";
import { PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { fmtDateTime, reportStatusFor } from "@/lib/civic/rules";
import type { CivicEvent } from "@/lib/civic/types";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Citizen Reports — CivicTrace" },
      {
        name: "description",
        content:
          "Citizen reports linked to municipal waste entities, with unverified, requires-attention and priority-review states.",
      },
      { property: "og:title", content: "Citizen Reports — CivicTrace" },
      {
        property: "og:description",
        content: "CivicTrace detects patterns in citizen reports. MCD verifies and acts.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { events, entities } = useCivic();
  const [query, setQuery] = useState("");
  const [issue, setIssue] = useState("all");
  const [activeEvent, setActiveEvent] = useState<CivicEvent | null>(null);

  const rows = useMemo(
    () =>
      events
        .filter((e) => e.type === "report")
        .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
        .filter((e) => {
          if (issue !== "all" && e.issueType !== issue) return false;
          if (query && !`${e.entityId} ${e.issueType} ${e.location}`.toLowerCase().includes(query.toLowerCase()))
            return false;
          return true;
        }),
    [events, issue, query],
  );

  const counts = useMemo(() => {
    const per = entities.map((entity) => reportStatusFor(events, entity.id));
    return {
      unverified: per.filter((s) => s === "pending").length,
      attention: per.filter((s) => s === "attention").length,
      priority: per.filter((s) => s === "priority").length,
    };
  }, [entities, events]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Citizen Reports"
        subtitle="Reports are linked to an entity by its QR identity. A single report is never treated as a proven failure."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StateCard
          status="pending"
          label="Unverified"
          count={counts.unverified}
          note="One report on an entity — recorded, awaiting review."
        />
        <StateCard
          status="attention"
          label="Requires Attention"
          count={counts.attention}
          note="Repeated reports or a recurring pattern on the same entity."
        />
        <StateCard
          status="priority"
          label="Priority Review"
          count={counts.priority}
          note="Multiple reports with supporting photo evidence."
        />
      </div>

      <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-xs font-medium">
        CivicTrace detects patterns. MCD verifies.
      </div>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search entity or location…"
        filters={[
          {
            id: "issue",
            label: "Issue type",
            value: issue,
            onChange: setIssue,
            options: [
              { value: "all", label: "All issue types" },
              { value: "Overflowing", label: "Overflowing" },
              { value: "Waste not collected", label: "Waste not collected" },
              { value: "Mixed waste observed", label: "Mixed waste observed" },
              { value: "Improper dumping", label: "Improper dumping" },
              { value: "Other", label: "Other" },
            ],
          },
        ]}
      />

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead>Timestamp</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Entity report status</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No citizen reports match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="text-sm">{fmtDateTime(report.timestamp)}</TableCell>
                <TableCell>
                  <Link
                    to={report.entityId.startsWith("BWG") ? "/bwgs/$entityId" : "/assets/$entityId"}
                    params={{ entityId: report.entityId }}
                    className="mono-id hover:underline"
                  >
                    {report.entityId}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{report.issueType}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {report.hasPhoto ? (
                    <span className="inline-flex items-center gap-1">
                      <Camera className="size-3.5" /> Photo
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={reportStatusFor(events, report.entityId)}
                    label={
                      reportStatusFor(events, report.entityId) === "pending" ? "Unverified" : undefined
                    }
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setActiveEvent(report)}>
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

function StateCard({
  status,
  label,
  count,
  note,
}: {
  status: "pending" | "attention" | "priority";
  label: string;
  count: number;
  note: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={status} label={label} size="sm" />
        <span className="text-2xl font-semibold tabular-nums">{count}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
