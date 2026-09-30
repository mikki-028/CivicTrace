import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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
import { fmtTime, isToday, lastCollection, openReports } from "@/lib/civic/rules";
import type { AssetEntity } from "@/lib/civic/types";

export const Route = createFileRoute("/assets/")({
  head: () => ({
    meta: [
      { title: "Waste Assets — CivicTrace" },
      {
        name: "description",
        content:
          "Searchable register of municipal waste assets with collection status, open citizen reports and maintenance state.",
      },
      { property: "og:title", content: "Waste Assets — CivicTrace" },
      {
        property: "og:description",
        content: "Every municipal waste asset with its own digital identity and event history.",
      },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const { entities, events, statusOf } = useCivic();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [ward, setWard] = useState("all");
  const [collection, setCollection] = useState("all");
  const [maintenance, setMaintenance] = useState("all");
  const [reports, setReports] = useState("all");

  const assets = entities.filter((e): e is AssetEntity => e.kind === "asset");

  const rows = useMemo(
    () =>
      assets
        .map((asset) => {
          const last = lastCollection(events, asset.id);
          return {
            asset,
            status: statusOf(asset.id),
            last,
            collectedToday: !!last && isToday(last.timestamp),
            openReportCount: openReports(events, asset.id).length,
          };
        })
        .filter((row) => {
          const haystack = `${row.asset.id} ${row.asset.servicePoint} ${row.asset.ward}`.toLowerCase();
          if (query && !haystack.includes(query.toLowerCase())) return false;
          if (status !== "all" && row.status !== status) return false;
          if (ward !== "all" && row.asset.ward !== ward) return false;
          if (collection === "collected" && !row.collectedToday) return false;
          if (collection === "pending" && row.collectedToday) return false;
          if (maintenance === "required" && !row.asset.maintenanceRequired) return false;
          if (maintenance === "none" && row.asset.maintenanceRequired) return false;
          if (reports === "open" && row.openReportCount === 0) return false;
          if (reports === "none" && row.openReportCount > 0) return false;
          return true;
        }),
    [assets, events, statusOf, query, status, ward, collection, maintenance, reports],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Waste Assets"
        subtitle="Every municipal waste asset carries a persistent digital identity. Open an asset to see its full event history."
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search asset ID or location…"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "All statuses" },
              { value: "normal", label: "Normal" },
              { value: "pending", label: "Pending" },
              { value: "attention", label: "Requires Attention" },
              { value: "priority", label: "Priority Review" },
              { value: "maintenance", label: "Maintenance Required" },
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
            id: "collection",
            label: "Collection",
            value: collection,
            onChange: setCollection,
            options: [
              { value: "all", label: "Any collection state" },
              { value: "collected", label: "Collected today" },
              { value: "pending", label: "Not collected today" },
            ],
          },
          {
            id: "maintenance",
            label: "Maintenance",
            value: maintenance,
            onChange: setMaintenance,
            options: [
              { value: "all", label: "Any maintenance" },
              { value: "required", label: "Required" },
              { value: "none", label: "None" },
            ],
          },
          {
            id: "reports",
            label: "Reports",
            value: reports,
            onChange: setReports,
            options: [
              { value: "all", label: "Any reports" },
              { value: "open", label: "Open reports" },
              { value: "none", label: "No reports" },
            ],
          },
        ]}
      />

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead>Asset ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Collection</TableHead>
              <TableHead>Open Reports</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead className="text-right">History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No assets match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ asset, status: rowStatus, last, collectedToday, openReportCount }) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <Link
                    to="/assets/$entityId"
                    params={{ entityId: asset.id }}
                    className="mono-id font-medium hover:underline"
                  >
                    {asset.id}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {asset.ward} · {asset.servicePoint}
                </TableCell>
                <TableCell>
                  <StatusBadge status={rowStatus} size="sm" />
                </TableCell>
                <TableCell className="text-sm">
                  {last ? (
                    <>
                      {fmtTime(last.timestamp)}
                      {!collectedToday && (
                        <span className="ml-1 text-xs text-muted-foreground">(earlier)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {openReportCount} report{openReportCount === 1 ? "" : "s"}
                </TableCell>
                <TableCell className="text-sm">
                  {asset.maintenanceRequired ? (
                    <span className="text-attention">Required</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/assets/$entityId" params={{ entityId: asset.id }}>
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
