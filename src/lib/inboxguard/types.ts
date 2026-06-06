export type AuthRecordStatus = "configured" | "missing" | "monitoring" | "review";
export type DomainHealthStatus = "red" | "amber" | "green";
export type DmarcPolicy = "none" | "quarantine" | "reject" | "missing" | "unknown";
export type FindingSeverity = "critical" | "warning" | "info";

export type DnsRecordSet = {
  spf: string[];
  dmarc: string[];
  dkim: Record<string, string[]>;
};

export type InboxGuardDomainSource = {
  id: string;
  locationId: string;
  locationName: string;
  domain: string;
  dns: DnsRecordSet;
  previous?: DnsRecordSet;
  expiresAt?: string;
  bounceRate?: number;
  spamRate?: number;
};

export type InboxGuardSource = {
  agencyName: string;
  generatedAt: string;
  domains: InboxGuardDomainSource[];
};

export type InboxGuardOptions = {
  now?: string;
  expiryWarningDays?: number;
  bounceRateWarningThreshold?: number;
  spamRateWarningThreshold?: number;
};

export type InboxGuardDomainRow = {
  id: string;
  locationId: string;
  locationName: string;
  domain: string;
  status: DomainHealthStatus;
  spfStatus: AuthRecordStatus;
  dkimStatus: AuthRecordStatus;
  dmarcStatus: AuthRecordStatus;
  dmarcPolicy: DmarcPolicy;
  expiryStatus: "ok" | "expiring" | "unknown";
  daysUntilExpiry?: number;
  recordChanged: boolean;
  bounceRate?: number;
  spamRate?: number;
  spfRecord?: string;
  dmarcRecord?: string;
  dkimSelectors: string[];
};

export type InboxGuardFindingRule =
  | "missing-auth"
  | "domain-expiring"
  | "dmarc-monitoring"
  | "missing-dkim"
  | "record-drift"
  | "bounce-rate"
  | "spam-rate";

export type InboxGuardFinding = {
  id: string;
  rule: InboxGuardFindingRule;
  severity: FindingSeverity;
  title: string;
  summary: string;
  domain: string;
  locationName: string;
};

export type InboxGuardReport = {
  agencyName: string;
  generatedAt: string;
  totals: {
    domains: number;
    green: number;
    amber: number;
    red: number;
    findings: number;
  };
  domains: InboxGuardDomainRow[];
  findings: InboxGuardFinding[];
  contentHash: string;
};
