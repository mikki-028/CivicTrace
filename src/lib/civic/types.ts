export type EntityKind = "asset" | "bwg";

export type StatusLevel =
  | "normal"
  | "pending"
  | "attention"
  | "priority"
  | "verification"
  | "maintenance";

export type EventType =
  | "collection"
  | "report"
  | "inspection"
  | "maintenance"
  | "replacement"
  | "compliance"
  | "verification"
  | "installation";

export type IssueType =
  | "Overflowing"
  | "Waste not collected"
  | "Mixed waste observed"
  | "Improper dumping"
  | "Other";

export type VerificationStatus = "unverified" | "attention" | "priority" | "verified" | "dismissed";

export interface CivicEvent {
  id: string;
  entityId: string;
  type: EventType;
  /** ISO timestamp */
  timestamp: string;
  actor: string;
  title: string;
  detail?: string;
  location?: string;
  issueType?: IssueType;
  hasPhoto?: boolean;
  verification?: VerificationStatus;
}

export interface BaseEntity {
  id: string;
  kind: EntityKind;
  name: string;
  servicePoint: string;
  ward: string;
  lat: number;
  lng: number;
  installedOn?: string;
}

export interface AssetEntity extends BaseEntity {
  kind: "asset";
  capacityLitres: number;
  expectedCollectionTime: string; // "HH:MM"
  maintenanceRequired: boolean;
  historicalSimilarIncidents: number;
  lifetime: {
    collections: number;
    reports: number;
    repairs: number;
    maintenance: number;
  };
  replacedById?: string;
  replacesId?: string;
  replacementReason?: string;
  replacementDate?: string;
}

export interface BwgEntity extends BaseEntity {
  kind: "bwg";
  bwgType: string;
  registrationVerified: boolean;
  segregationStreams: number;
  collectionFrequency: string;
  authorisedHandler: string;
  segregationIssues: number;
  inspectionIssue: boolean;
}

export type CivicEntity = AssetEntity | BwgEntity;

export type FlagSeverity = "priority" | "attention" | "verification" | "maintenance";

export interface Flag {
  id: string;
  entityId: string;
  title: string;
  ruleId: string;
  ruleName: string;
  severity: FlagSeverity;
  evidence: string[];
  historicalSimilarIncidents?: number;
  suggestedReview: string;
  detectedAt: string;
}

export interface VerificationRecord {
  id: string;
  entityId: string;
  flagTitle: string;
  outcome: "scheduled" | "verified" | "dismissed";
  note: string;
  createdAt: string;
  actor: string;
}

export interface CivicNotification {
  id: string;
  message: string;
  entityId: string;
  createdAt: string;
  severity: FlagSeverity | "info";
}
