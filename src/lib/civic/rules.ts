import type {
  AssetEntity,
  BwgEntity,
  CivicEntity,
  CivicEvent,
  Flag,
  FlagSeverity,
  StatusLevel,
  VerificationRecord,
} from "./types";

export const RULES = [
  {
    id: "R1",
    name: "Recurring post-collection overflow",
    condition:
      "IF a collection event exists AND multiple overflow reports occur shortly after that collection AND similar incidents exist historically",
    outcome: "Flag: Recurring post-collection overflow",
    suggestedReview: "Collection frequency / bin capacity",
  },
  {
    id: "R2",
    name: "Missed / overdue collection",
    condition: "IF the expected collection time has passed AND no collection event exists today",
    outcome: "Flag: Collection overdue",
    suggestedReview: "Route adherence / worker allocation",
  },
  {
    id: "R3",
    name: "High-maintenance asset",
    condition: "IF the asset has repeated repair or maintenance events",
    outcome: "Flag: High-maintenance asset",
    suggestedReview: "Asset replacement / service point capacity",
  },
  {
    id: "R4",
    name: "Repeated compliance concern",
    condition:
      "IF multiple segregation issues or citizen reports exist AND/OR an inspection issue exists",
    outcome: "Flag: Repeated compliance concern",
    suggestedReview: "Schedule MCD verification / inspection",
  },
  {
    id: "R5",
    name: "Geographic concentration",
    condition: "IF multiple flagged entities are located within the same ward or service point",
    outcome: "Show: Geographic concentration detected",
    suggestedReview: "Area-level operational review",
  },
] as const;

export const ruleById = (id: string) => RULES.find((r) => r.id === id);

const SEVERITY_ORDER: Record<FlagSeverity, number> = {
  priority: 4,
  attention: 3,
  verification: 2,
  maintenance: 1,
};

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  );
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}

export function eventsFor(events: CivicEvent[], entityId: string): CivicEvent[] {
  return events
    .filter((e) => e.entityId === entityId)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export function lastCollection(events: CivicEvent[], entityId: string): CivicEvent | undefined {
  return eventsFor(events, entityId).find((e) => e.type === "collection");
}

export function openReports(events: CivicEvent[], entityId: string): CivicEvent[] {
  return eventsFor(events, entityId).filter(
    (e) => e.type === "report" && e.verification !== "verified" && e.verification !== "dismissed",
  );
}

function assetFlags(asset: AssetEntity, events: CivicEvent[]): Flag[] {
  const flags: Flag[] = [];
  const own = eventsFor(events, asset.id);
  const collectionsToday = own.filter((e) => e.type === "collection" && isToday(e.timestamp));
  const lastToday = collectionsToday[0];

  // Rule 1 — recurring post-collection overflow
  if (lastToday) {
    const after = own
      .filter(
        (e) =>
          e.type === "report" &&
          isToday(e.timestamp) &&
          +new Date(e.timestamp) > +new Date(lastToday.timestamp) &&
          (e.issueType === "Overflowing" || e.issueType === "Waste not collected"),
      )
      .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

    if (after.length >= 2 && asset.historicalSimilarIncidents >= 1) {
      const withEvidence = after.some((e) => e.hasPhoto);
      flags.push({
        id: `${asset.id}:R1`,
        entityId: asset.id,
        title: "Recurring post-collection overflow",
        ruleId: "R1",
        ruleName: "Recurring post-collection overflow",
        severity: after.length >= 3 && withEvidence ? "priority" : "attention",
        evidence: [
          `Collection recorded at ${fmtTime(lastToday.timestamp)}`,
          ...after.map(
            (e) => `Citizen report at ${fmtTime(e.timestamp)}${e.hasPhoto ? " (photo attached)" : ""}`,
          ),
          `Similar incidents recorded in previous weeks: ${asset.historicalSimilarIncidents}`,
        ],
        historicalSimilarIncidents: asset.historicalSimilarIncidents,
        suggestedReview: "Collection frequency / bin capacity",
        detectedAt: after[after.length - 1]!.timestamp,
      });
    }
  }

  // Rule 2 — overdue collection
  const [eh, em] = asset.expectedCollectionTime.split(":").map(Number);
  const expected = new Date();
  expected.setHours(eh ?? 0, em ?? 0, 0, 0);
  if (!lastToday && Date.now() > +expected) {
    flags.push({
      id: `${asset.id}:R2`,
      entityId: asset.id,
      title: "Collection overdue",
      ruleId: "R2",
      ruleName: "Missed / overdue collection",
      severity: "attention",
      evidence: [
        `Expected collection time: ${asset.expectedCollectionTime}`,
        "No collection event recorded for today",
      ],
      suggestedReview: "Route adherence / worker allocation",
      detectedAt: expected.toISOString(),
    });
  }

  // Rule 3 — high-maintenance asset
  const repairEvents = own.filter((e) => e.type === "maintenance").length;
  if (asset.lifetime.repairs + asset.lifetime.maintenance >= 7 || repairEvents >= 3) {
    flags.push({
      id: `${asset.id}:R3`,
      entityId: asset.id,
      title: "High-maintenance asset",
      ruleId: "R3",
      ruleName: "High-maintenance asset",
      severity: "maintenance",
      evidence: [
        `Lifetime repairs recorded: ${asset.lifetime.repairs}`,
        `Lifetime maintenance events: ${asset.lifetime.maintenance}`,
      ],
      suggestedReview: "Asset replacement / service point capacity",
      detectedAt: own.find((e) => e.type === "maintenance")?.timestamp ?? new Date().toISOString(),
    });
  }

  return flags;
}

function bwgFlags(bwg: BwgEntity, events: CivicEvent[]): Flag[] {
  const own = eventsFor(events, bwg.id);
  const reports = own.filter((e) => e.type === "report");
  const complianceEvents = own.filter((e) => e.type === "compliance" || e.type === "inspection");
  const segregationIssues =
    bwg.segregationIssues + own.filter((e) => e.type === "compliance").length * 0;

  const triggers = (segregationIssues >= 2 ? 1 : 0) + (bwg.inspectionIssue ? 1 : 0) + (reports.length >= 2 ? 1 : 0);
  if (triggers < 2) return [];

  return [
    {
      id: `${bwg.id}:R4`,
      entityId: bwg.id,
      title: "Repeated compliance concern",
      ruleId: "R4",
      ruleName: "Repeated compliance concern",
      severity: triggers >= 3 ? "priority" : "attention",
      evidence: [
        `Segregation issues on record: ${segregationIssues}`,
        `Citizen reports: ${reports.length}`,
        bwg.inspectionIssue ? "Recent inspection: issue observed" : "No inspection issue on record",
        `Compliance / inspection events: ${complianceEvents.length}`,
      ],
      suggestedReview: "Schedule MCD verification / inspection",
      detectedAt: own[0]?.timestamp ?? new Date().toISOString(),
    },
  ];
}

export interface Cluster {
  servicePoint: string;
  ward: string;
  entityIds: string[];
  note: string;
}

export function detectFlags(
  entities: CivicEntity[],
  events: CivicEvent[],
  dismissedFlagIds: string[] = [],
): Flag[] {
  const all = entities.flatMap((e) =>
    e.kind === "asset" ? assetFlags(e, events) : bwgFlags(e, events),
  );
  return all
    .filter((f) => !dismissedFlagIds.includes(f.id))
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}

export function detectClusters(entities: CivicEntity[], flags: Flag[]): Cluster[] {
  const byPoint = new Map<string, string[]>();
  for (const flag of flags) {
    const entity = entities.find((e) => e.id === flag.entityId);
    if (!entity) continue;
    const key = `${entity.servicePoint}|${entity.ward}`;
    const list = byPoint.get(key) ?? [];
    if (!list.includes(entity.id)) list.push(entity.id);
    byPoint.set(key, list);
  }
  return [...byPoint.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .map(([key, ids]) => {
      const [servicePoint, ward] = key.split("|");
      return {
        servicePoint: servicePoint ?? "",
        ward: ward ?? "",
        entityIds: ids,
        note: "Multiple waste-management issues are concentrated within this area.",
      };
    })
    .sort((a, b) => b.entityIds.length - a.entityIds.length);
}

export function severityToStatus(severity: FlagSeverity): StatusLevel {
  if (severity === "priority") return "priority";
  if (severity === "attention") return "attention";
  if (severity === "maintenance") return "maintenance";
  return "verification";
}

export function deriveStatus(
  entity: CivicEntity,
  events: CivicEvent[],
  flags: Flag[],
  verifications: VerificationRecord[] = [],
): StatusLevel {
  const pendingVerification = verifications
    .filter((v) => v.entityId === entity.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  if (pendingVerification?.outcome === "scheduled") return "verification";

  const own = flags.filter((f) => f.entityId === entity.id);
  if (own.length) {
    const worst = own.reduce((a, b) => (SEVERITY_ORDER[b.severity] > SEVERITY_ORDER[a.severity] ? b : a));
    return severityToStatus(worst.severity);
  }
  if (openReports(events, entity.id).length > 0) return "pending";
  if (entity.kind === "asset") {
    const collected = eventsFor(events, entity.id).some(
      (e) => e.type === "collection" && isToday(e.timestamp),
    );
    if (!collected) return "pending";
  }
  return "normal";
}

/** Citizen report verification state from the report volume + evidence on an entity. */
export function reportStatusFor(events: CivicEvent[], entityId: string): StatusLevel {
  const reports = openReports(events, entityId);
  if (reports.length === 0) return "normal";
  const withEvidence = reports.filter((r) => r.hasPhoto).length;
  if (reports.length >= 3 && withEvidence >= 1) return "priority";
  if (reports.length >= 2) return "attention";
  return "pending";
}
