import { createHash } from "node:crypto";
import type {
  AuthRecordStatus,
  DmarcPolicy,
  DomainHealthStatus,
  DnsRecordSet,
  InboxGuardDomainRow,
  InboxGuardDomainSource,
  InboxGuardFinding,
  InboxGuardFindingRule,
  InboxGuardOptions,
  InboxGuardReport,
  InboxGuardSource
} from "./types";

const DEFAULT_EXPIRY_WARNING_DAYS = 30;
const DEFAULT_BOUNCE_RATE_WARNING = 0.05;
const DEFAULT_SPAM_RATE_WARNING = 0.01;

const STATUS_RANK: Record<DomainHealthStatus, number> = {
  red: 0,
  amber: 1,
  green: 2
};

const RULE_RANK: Record<InboxGuardFindingRule, number> = {
  "missing-auth": 0,
  "domain-expiring": 1,
  "dmarc-monitoring": 2,
  "missing-dkim": 3,
  "record-drift": 4,
  "bounce-rate": 5,
  "spam-rate": 6
};

export function buildInboxGuardReport(source: InboxGuardSource, options: InboxGuardOptions = {}): InboxGuardReport {
  const now = new Date(options.now ?? source.generatedAt);
  const expiryWarningDays = options.expiryWarningDays ?? DEFAULT_EXPIRY_WARNING_DAYS;
  const bounceRateWarningThreshold = options.bounceRateWarningThreshold ?? DEFAULT_BOUNCE_RATE_WARNING;
  const spamRateWarningThreshold = options.spamRateWarningThreshold ?? DEFAULT_SPAM_RATE_WARNING;
  const domains = sortDomains(
    source.domains.map((domain) =>
      domainRow(domain, {
        now,
        expiryWarningDays
      })
    )
  );
  const findings = sortFindings(
    domains.flatMap((domain) =>
      domainFindings(domain, {
        bounceRateWarningThreshold,
        spamRateWarningThreshold
      })
    )
  );

  const reportWithoutHash = {
    agencyName: source.agencyName,
    generatedAt: source.generatedAt,
    totals: {
      domains: domains.length,
      green: domains.filter((domain) => domain.status === "green").length,
      amber: domains.filter((domain) => domain.status === "amber").length,
      red: domains.filter((domain) => domain.status === "red").length,
      findings: findings.length
    },
    domains,
    findings
  };

  return {
    ...reportWithoutHash,
    contentHash: hashReport(reportWithoutHash)
  };
}

function domainRow(
  source: InboxGuardDomainSource,
  options: { now: Date; expiryWarningDays: number }
): InboxGuardDomainRow {
  const dmarcPolicy = parseDmarcPolicy(source.dns.dmarc);
  const spfStatus = hasSpf(source.dns.spf) ? "configured" : "missing";
  const dmarcStatus = dmarcStatusFor(dmarcPolicy);
  const dkimSelectors = configuredDkimSelectors(source.dns.dkim);
  const dkimStatus: AuthRecordStatus = dkimSelectors.length > 0 ? "configured" : "missing";
  const daysUntilExpiry = daysBetween(options.now, source.expiresAt);
  const expiryStatus = daysUntilExpiry === undefined ? "unknown" : daysUntilExpiry <= options.expiryWarningDays ? "expiring" : "ok";
  const recordChanged = source.previous ? canonicalDns(source.dns) !== canonicalDns(source.previous) : false;
  const status = healthStatus({
    spfStatus,
    dkimStatus,
    dmarcStatus,
    expiryStatus,
    recordChanged,
    bounceRate: source.bounceRate,
    spamRate: source.spamRate
  });

  return {
    id: source.id,
    locationId: source.locationId,
    locationName: source.locationName,
    domain: normalizeDomain(source.domain),
    status,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    dmarcPolicy,
    expiryStatus,
    daysUntilExpiry,
    recordChanged,
    bounceRate: source.bounceRate,
    spamRate: source.spamRate,
    spfRecord: firstRecord(source.dns.spf),
    dmarcRecord: firstRecord(source.dns.dmarc),
    dkimSelectors
  };
}

function healthStatus(input: {
  spfStatus: AuthRecordStatus;
  dkimStatus: AuthRecordStatus;
  dmarcStatus: AuthRecordStatus;
  expiryStatus: "ok" | "expiring" | "unknown";
  recordChanged: boolean;
  bounceRate?: number;
  spamRate?: number;
}): DomainHealthStatus {
  if (input.spfStatus === "missing" || input.dmarcStatus === "missing") {
    return "red";
  }

  if (
    input.dkimStatus === "missing" ||
    input.dmarcStatus === "monitoring" ||
    input.expiryStatus === "expiring" ||
    input.recordChanged ||
    (input.bounceRate ?? 0) > DEFAULT_BOUNCE_RATE_WARNING ||
    (input.spamRate ?? 0) > DEFAULT_SPAM_RATE_WARNING
  ) {
    return "amber";
  }

  return "green";
}

function domainFindings(
  domain: InboxGuardDomainRow,
  options: { bounceRateWarningThreshold: number; spamRateWarningThreshold: number }
): InboxGuardFinding[] {
  const findings: InboxGuardFinding[] = [];

  if (domain.spfStatus === "missing" || domain.dmarcStatus === "missing") {
    findings.push({
      id: `${domain.id}-missing-auth`,
      rule: "missing-auth",
      severity: "critical",
      title: "Missing sender authentication",
      summary: missingAuthSummary(domain),
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if (domain.expiryStatus === "expiring") {
    findings.push({
      id: `${domain.id}-domain-expiring`,
      rule: "domain-expiring",
      severity: "warning",
      title: "Sending domain expires soon",
      summary: `${domain.domain} expires in ${domain.daysUntilExpiry ?? "an unknown number of"} days.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if (domain.dmarcStatus === "monitoring") {
    findings.push({
      id: `${domain.id}-dmarc-monitoring`,
      rule: "dmarc-monitoring",
      severity: "warning",
      title: "DMARC is monitoring only",
      summary: `${domain.domain} uses p=none, so spoofed mail is reported but not quarantined or rejected.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if (domain.status !== "red" && domain.dkimStatus === "missing") {
    findings.push({
      id: `${domain.id}-missing-dkim`,
      rule: "missing-dkim",
      severity: "warning",
      title: "No DKIM selector found",
      summary: `${domain.domain} has SPF and DMARC, but no tested DKIM selector returned a key.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if (domain.recordChanged) {
    findings.push({
      id: `${domain.id}-record-drift`,
      rule: "record-drift",
      severity: "warning",
      title: "DNS record drift detected",
      summary: `${domain.domain} changed SPF, DKIM, or DMARC records since the previous scan.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if ((domain.bounceRate ?? 0) > options.bounceRateWarningThreshold) {
    findings.push({
      id: `${domain.id}-bounce-rate`,
      rule: "bounce-rate",
      severity: "warning",
      title: "Bounce rate needs review",
      summary: `${domain.domain} has a ${(domain.bounceRate! * 100).toFixed(1)}% recent bounce-rate signal.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  if ((domain.spamRate ?? 0) > options.spamRateWarningThreshold) {
    findings.push({
      id: `${domain.id}-spam-rate`,
      rule: "spam-rate",
      severity: "warning",
      title: "Spam complaint signal needs review",
      summary: `${domain.domain} has a ${(domain.spamRate! * 100).toFixed(1)}% recent spam-rate signal.`,
      domain: domain.domain,
      locationName: domain.locationName
    });
  }

  return findings;
}

function missingAuthSummary(domain: InboxGuardDomainRow): string {
  const missing = [
    domain.spfStatus === "missing" ? "SPF" : undefined,
    domain.dmarcStatus === "missing" ? "DMARC" : undefined
  ].filter(Boolean);

  return `${domain.domain} is missing ${missing.join(" and ")}. Fix before the next client broadcast.`;
}

function parseDmarcPolicy(records: string[]): DmarcPolicy {
  const record = records.find((item) => item.trim().toLowerCase().startsWith("v=dmarc1"));
  if (!record) {
    return "missing";
  }

  const policy = record
    .split(";")
    .map((part) => part.trim().toLowerCase())
    .find((part) => part.startsWith("p="))
    ?.slice(2);

  if (policy === "none" || policy === "quarantine" || policy === "reject") {
    return policy;
  }

  return "unknown";
}

function dmarcStatusFor(policy: DmarcPolicy): AuthRecordStatus {
  if (policy === "missing") {
    return "missing";
  }

  if (policy === "none") {
    return "monitoring";
  }

  return policy === "unknown" ? "review" : "configured";
}

function hasSpf(records: string[]): boolean {
  return records.some((record) => record.trim().toLowerCase().startsWith("v=spf1"));
}

function configuredDkimSelectors(records: Record<string, string[]>): string[] {
  return Object.entries(records)
    .filter(([, values]) => values.some((value) => value.trim().toLowerCase().startsWith("v=dkim1")))
    .map(([selector]) => selector)
    .sort((left, right) => left.localeCompare(right));
}

function firstRecord(records: string[]): string | undefined {
  return records.find((record) => record.trim().length > 0);
}

function daysBetween(now: Date, future?: string): number | undefined {
  if (!future) {
    return undefined;
  }

  const target = new Date(future);
  if (Number.isNaN(target.getTime())) {
    return undefined;
  }

  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

  return Math.round((end - start) / 86_400_000);
}

function canonicalDns(dns: DnsRecordSet): string {
  return JSON.stringify({
    spf: normalizeRecords(dns.spf),
    dmarc: normalizeRecords(dns.dmarc),
    dkim: Object.fromEntries(
      Object.entries(dns.dkim)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([selector, records]) => [selector.toLowerCase(), normalizeRecords(records)])
    )
  });
}

function normalizeRecords(records: string[]): string[] {
  return records.map((record) => record.trim().toLowerCase()).sort((left, right) => left.localeCompare(right));
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

function sortDomains(domains: InboxGuardDomainRow[]): InboxGuardDomainRow[] {
  return [...domains].sort((left, right) => {
    const statusDelta = STATUS_RANK[left.status] - STATUS_RANK[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.domain.localeCompare(right.domain);
  });
}

function sortFindings(findings: InboxGuardFinding[]): InboxGuardFinding[] {
  return [...findings].sort((left, right) => {
    const ruleDelta = RULE_RANK[left.rule] - RULE_RANK[right.rule];
    if (ruleDelta !== 0) {
      return ruleDelta;
    }

    return `${left.domain}-${left.id}`.localeCompare(`${right.domain}-${right.id}`);
  });
}

function hashReport(report: Omit<InboxGuardReport, "contentHash">): string {
  return createHash("sha256").update(JSON.stringify(report)).digest("hex");
}
