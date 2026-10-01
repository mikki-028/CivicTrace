import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CURRENT_OFFICIAL,
  DEMO_TOTALS,
  seedEntities,
  seedEvents,
} from "./seed";
import {
  detectClusters,
  detectFlags,
  deriveStatus,
  isToday,
  type Cluster,
} from "./rules";
import type {
  CivicEntity,
  CivicEvent,
  CivicNotification,
  Flag,
  IssueType,
  StatusLevel,
  VerificationRecord,
} from "./types";

const STORAGE_KEY = "civictrace.state.v1";

interface PersistedState {
  events: CivicEvent[];
  verifications: VerificationRecord[];
  dismissedFlagIds: string[];
  readNotificationIds: string[];
}

interface CivicContextValue {
  entities: CivicEntity[];
  events: CivicEvent[];
  flags: Flag[];
  clusters: Cluster[];
  verifications: VerificationRecord[];
  notifications: CivicNotification[];
  unreadCount: number;
  ward: string;
  official: typeof CURRENT_OFFICIAL;
  totals: {
    assets: number;
    bwgs: number;
    collections: number;
    reports: number;
    flags: number;
  };
  setWard: (ward: string) => void;
  getEntity: (id: string) => CivicEntity | undefined;
  statusOf: (id: string) => StatusLevel;
  flagsFor: (id: string) => Flag[];
  recordCollection: (input: {
    entityId: string;
    worker: string;
    vehicle: string;
    route: string;
    location: string;
  }) => CivicEvent;
  submitReport: (input: {
    entityId: string;
    issueType: IssueType;
    note?: string | undefined;
    hasPhoto?: boolean | undefined;
  }) => CivicEvent;
  recordVerification: (input: {
    entityId: string;
    flagTitle: string;
    outcome: VerificationRecord["outcome"];
    note: string;
  }) => void;
  dismissFlag: (flagId: string) => void;
  markNotificationsRead: () => void;
  resetDemo: () => void;
}

const CivicContext = createContext<CivicContextValue | null>(null);

let idCounter = 0;
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${(idCounter++).toString(36).toUpperCase()}`;

export function CivicProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CivicEvent[]>(seedEvents);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [dismissedFlagIds, setDismissedFlagIds] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [ward, setWard] = useState(CURRENT_OFFICIAL.ward);
  const [hydrated, setHydrated] = useState(false);

  // Restore demo state after hydration (keeps SSR output stable).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (Array.isArray(parsed.events) && parsed.events.length) setEvents(parsed.events);
        setVerifications(parsed.verifications ?? []);
        setDismissedFlagIds(parsed.dismissedFlagIds ?? []);
        setReadNotificationIds(parsed.readNotificationIds ?? []);
      }
    } catch {
      /* ignore corrupt demo state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ events, verifications, dismissedFlagIds, readNotificationIds }),
      );
    } catch {
      /* storage unavailable — prototype still works in memory */
    }
  }, [hydrated, events, verifications, dismissedFlagIds, readNotificationIds]);

  const entities = seedEntities;

  const flags = useMemo(
    () => detectFlags(entities, events, dismissedFlagIds),
    [entities, events, dismissedFlagIds],
  );
  const clusters = useMemo(() => detectClusters(entities, flags), [entities, flags]);

  const statusOf = useCallback(
    (id: string) => {
      const entity = entities.find((e) => e.id === id);
      if (!entity) return "normal" as StatusLevel;
      return deriveStatus(entity, events, flags, verifications);
    },
    [entities, events, flags, verifications],
  );

  const flagsFor = useCallback((id: string) => flags.filter((f) => f.entityId === id), [flags]);

  const recordCollection: CivicContextValue["recordCollection"] = useCallback((input) => {
    const event: CivicEvent = {
      id: newId("EVT"),
      entityId: input.entityId,
      type: "collection",
      timestamp: new Date().toISOString(),
      actor: input.worker,
      title: "Collection recorded",
      detail: `${input.route} · Vehicle ${input.vehicle}`,
      location: input.location,
    };
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const submitReport: CivicContextValue["submitReport"] = useCallback((input) => {
    const event: CivicEvent = {
      id: newId("EVT"),
      entityId: input.entityId,
      type: "report",
      timestamp: new Date().toISOString(),
      actor: "Citizen (QR)",
      title: `Citizen report — ${input.issueType}`,
      detail: input.note,
      hasPhoto: input.hasPhoto,
      issueType: input.issueType,
      verification: "unverified",
    };
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const recordVerification: CivicContextValue["recordVerification"] = useCallback((input) => {
    const record: VerificationRecord = {
      id: newId("VER"),
      entityId: input.entityId,
      flagTitle: input.flagTitle,
      outcome: input.outcome,
      note: input.note,
      createdAt: new Date().toISOString(),
      actor: CURRENT_OFFICIAL.name,
    };
    setVerifications((prev) => [...prev, record]);
    setEvents((prev) => [
      ...prev,
      {
        id: newId("EVT"),
        entityId: input.entityId,
        type: "verification",
        timestamp: record.createdAt,
        actor: CURRENT_OFFICIAL.name,
        title:
          input.outcome === "scheduled"
            ? "MCD verification scheduled"
            : input.outcome === "verified"
              ? "Verified by MCD — routed to existing enforcement workflow"
              : "Reviewed by MCD — no issue found",
        detail: input.note,
      },
    ]);
    if (input.outcome !== "scheduled") {
      setDismissedFlagIds((prev) => [...new Set([...prev, `${input.entityId}:R4`])]);
    }
  }, []);

  const dismissFlag = useCallback((flagId: string) => {
    setDismissedFlagIds((prev) => [...new Set([...prev, flagId])]);
  }, []);

  const notifications = useMemo<CivicNotification[]>(() => {
    const fromFlags = flags.slice(0, 6).map((f) => ({
      id: `ntf-${f.id}`,
      entityId: f.entityId,
      severity: f.severity,
      createdAt: f.detectedAt,
      message:
        f.ruleId === "R1"
          ? `${f.entityId} has repeated post-collection overflow reports.`
          : f.ruleId === "R4"
            ? `${f.entityId} requires MCD verification.`
            : f.ruleId === "R2"
              ? `${f.entityId} collection is overdue for today.`
              : `${f.entityId} is flagged as a high-maintenance asset.`,
    }));
    const replacement: CivicNotification = {
      id: "ntf-replacement-0081",
      entityId: "BIN-0081",
      severity: "info",
      createdAt: new Date().toISOString(),
      message: "BIN-0081 replacement recorded at the Residential Market service point.",
    };
    return [...fromFlags, replacement];
  }, [flags]);

  const totals = useMemo(() => {
    const extraCollections = events.filter(
      (e) => e.type === "collection" && isToday(e.timestamp) && !seedEvents.some((s) => s.id === e.id),
    ).length;
    const extraReports = events.filter(
      (e) => e.type === "report" && !seedEvents.some((s) => s.id === e.id),
    ).length;
    return {
      assets: DEMO_TOTALS.assets,
      bwgs: DEMO_TOTALS.bwgs,
      collections: DEMO_TOTALS.collections + extraCollections,
      reports: DEMO_TOTALS.reports + extraReports,
      flags: flags.length,
    };
  }, [events, flags]);

  const resetDemo = useCallback(() => {
    setEvents(seedEvents);
    setVerifications([]);
    setDismissedFlagIds([]);
    setReadNotificationIds([]);
  }, []);

  const value: CivicContextValue = {
    entities,
    events,
    flags,
    clusters,
    verifications,
    notifications,
    unreadCount: notifications.filter((n) => !readNotificationIds.includes(n.id)).length,
    ward,
    official: CURRENT_OFFICIAL,
    totals,
    setWard,
    getEntity: (id) => entities.find((e) => e.id === id),
    statusOf,
    flagsFor,
    recordCollection,
    submitReport,
    recordVerification,
    dismissFlag,
    markNotificationsRead: () => setReadNotificationIds(notifications.map((n) => n.id)),
    resetDemo,
  };

  // Demo data depends on the viewer's local clock/timezone, so render only in the browser
  // to avoid server/client mismatches.
  return (
    <CivicContext.Provider value={value}>
      {hydrated ? (
        children
      ) : (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading CivicTrace…
        </div>
      )}
    </CivicContext.Provider>
  );
}

export function useCivic() {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error("useCivic must be used inside CivicProvider");
  return ctx;
}
