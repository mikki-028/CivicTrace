import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/civic/FilterBar";
import { PageHeader, PrototypeNote } from "@/components/civic/PageHeader";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { openReports } from "@/lib/civic/rules";
import type { BwgEntity } from "@/lib/civic/types";

export const Route = createFileRoute("/bwgs/")({
  head: () => ({
    meta: [
      { title: "Bulk Waste Generators — CivicTrace" },
      {
        name: "description",
        content:
          "Registered bulk waste generators with segregation requirements, authorised handlers and compliance history.",
      },
      { property: "og:title", content: "Bulk Waste Generators — CivicTrace" },
      {
        property: "og:description",
        content: "Registration, segregation requirements and compliance events for every registered BWG.",
      },
    ],
  }),
  component: BwgsPage,
});

function BwgsPage() {
  const { entities, events, statusOf } = useCivic();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [registration, setRegistration] = useState("all");

  const bwgs = entities.filter((e): e is BwgEntity => e.kind === "bwg");

  const rows = useMemo(
    () =>
      bwgs
        .map((bwg) => ({
          bwg,
          status: statusOf(bwg.id),
          reports: openReports(events, bwg.id).length,
        }))
        .filter((row) => {
          const haystack = `${row.bwg.id} ${row.bwg.name} ${row.bwg.bwgType} ${row.bwg.servicePoint}`.toLowerCase();
          if (query && !haystack.includes(query.toLowerCase())) return false;
          if (status !== "all" && row.status !== status) return false;
          if (registration === "verified" && !row.bwg.registrationVerified) return false;
          if (registration === "pending" && row.bwg.registrationVerified) return false;
          return true;
        }),
    [bwgs, events, statusOf, query, status, registration],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bulk Waste Generators"
        subtitle="Registered bulk waste generators, their segregation obligations and their connected compliance history."
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search BWG ID, name or type…"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "All statuses" },
              { value: "normal", label: "Compliant" },
              { value: "pending", label: "Pending" },
              { value: "attention", label: "Requires Attention" },
              { value: "priority", label: "Priority Review" },
              { value: "verification", label: "Verification Required" },
            ],
          },
          {
            id: "registration",
            label: "Registration",
            value: registration,
            onChange: setRegistration,
            options: [
              { value: "all", label: "Any registration" },
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
      />

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead>BWG ID</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Segregation</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No bulk waste generators match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ bwg, status: rowStatus, reports }) => (
              <TableRow key={bwg.id}>
                <TableCell>
                  <Link
                    to="/bwgs/$entityId"
                    params={{ entityId: bwg.id }}
                    className="mono-id font-medium hover:underline"
                  >
                    {bwg.id}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {bwg.name}
                  <span className="block text-xs text-muted-foreground">
                    {bwg.ward} · {bwg.servicePoint}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{bwg.bwgType}</TableCell>
                <TableCell className="text-sm">
                  {bwg.registrationVerified ? (
                    <span className="inline-flex items-center gap-1 text-normal">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-attention">
                      <CircleAlert className="size-3.5" /> Pending
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{bwg.segregationStreams}-stream</TableCell>
                <TableCell className="text-sm text-muted-foreground">{bwg.collectionFrequency}</TableCell>
                <TableCell className="text-sm">{reports}</TableCell>
                <TableCell>
                  <StatusBadge status={rowStatus} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/bwgs/$entityId" params={{ entityId: bwg.id }}>
                      View <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PrototypeNote />
    </div>
  );
}
