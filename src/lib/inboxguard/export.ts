import type { InboxGuardFinding, InboxGuardReport } from "./types";

export function toInboxGuardCsv(report: InboxGuardReport): string {
  return [
    ["location", "domain", "status", "spf", "dkim", "dmarc", "policy", "expiry", "record_changed", "bounce_rate", "spam_rate"],
    ...report.domains.map((domain) => [
      domain.locationName,
      domain.domain,
      domain.status,
      domain.spfStatus,
      domain.dkimStatus,
      domain.dmarcStatus,
      domain.dmarcPolicy,
      domain.expiryStatus,
      String(domain.recordChanged),
      domain.bounceRate === undefined ? "" : domain.bounceRate.toFixed(3),
      domain.spamRate === undefined ? "" : domain.spamRate.toFixed(3)
    ])
  ]
    .map(csvRow)
    .join("\n");
}

export function toInboxGuardFindingsCsv(report: InboxGuardReport): string {
  return [
    ["severity", "rule", "title", "domain", "location", "summary"],
    ...report.findings.map((finding) => findingRow(finding))
  ]
    .map(csvRow)
    .join("\n");
}

function findingRow(finding: InboxGuardFinding): string[] {
  return [finding.severity, finding.rule, finding.title, finding.domain, finding.locationName, finding.summary];
}

function csvRow(values: string[]): string {
  return values.map(escapeCsv).join(",");
}

function escapeCsv(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
