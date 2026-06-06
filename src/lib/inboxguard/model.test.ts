import { describe, expect, it } from "vitest";
import { buildInboxGuardReport } from "./model";
import type { InboxGuardSource } from "./types";

const source: InboxGuardSource = {
  agencyName: "Radom Force",
  generatedAt: "2026-06-06T12:00:00.000Z",
  domains: [
    {
      id: "alpha",
      locationId: "loc-1",
      locationName: "Alpha Clinic",
      domain: "alpha.example",
      dns: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@alpha.example"],
        dkim: {
          default: ["v=DKIM1; k=rsa; p=alpha"]
        }
      },
      previous: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@alpha.example"],
        dkim: {
          default: ["v=DKIM1; k=rsa; p=alpha"]
        }
      },
      expiresAt: "2026-12-01T00:00:00.000Z"
    },
    {
      id: "bravo",
      locationId: "loc-2",
      locationName: "Bravo Dental",
      domain: "bravo.example",
      dns: {
        spf: [],
        dmarc: [],
        dkim: {}
      },
      expiresAt: "2026-06-20T00:00:00.000Z"
    },
    {
      id: "charlie",
      locationId: "loc-3",
      locationName: "Charlie Gym",
      domain: "charlie.example",
      dns: {
        spf: ["v=spf1 include:_spf.google.com ~all"],
        dmarc: ["v=DMARC1; p=none; rua=mailto:dmarc@charlie.example"],
        dkim: {}
      },
      previous: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@charlie.example"],
        dkim: {}
      },
      bounceRate: 0.071,
      spamRate: 0.018
    }
  ]
};

describe("buildInboxGuardReport", () => {
  it("rolls up SPF, DKIM, DMARC, record drift, expiry, and campaign signals by client domain", () => {
    const report = buildInboxGuardReport(source, { now: "2026-06-06T12:00:00.000Z" });

    expect(report.totals).toEqual({
      domains: 3,
      green: 1,
      amber: 1,
      red: 1,
      findings: 7
    });

    expect(report.domains).toEqual([
      expect.objectContaining({
        domain: "bravo.example",
        status: "red",
        spfStatus: "missing",
        dkimStatus: "missing",
        dmarcStatus: "missing",
        expiryStatus: "expiring",
        daysUntilExpiry: 14
      }),
      expect.objectContaining({
        domain: "charlie.example",
        status: "amber",
        spfStatus: "configured",
        dkimStatus: "missing",
        dmarcStatus: "monitoring",
        dmarcPolicy: "none",
        recordChanged: true,
        bounceRate: 0.071,
        spamRate: 0.018
      }),
      expect.objectContaining({
        domain: "alpha.example",
        status: "green",
        dmarcPolicy: "reject",
        daysUntilExpiry: 178
      })
    ]);

    expect(report.findings.map((finding) => finding.rule)).toEqual([
      "missing-auth",
      "domain-expiring",
      "dmarc-monitoring",
      "missing-dkim",
      "record-drift",
      "bounce-rate",
      "spam-rate"
    ]);
  });

  it("creates a stable evidence hash independent of source ordering", () => {
    const first = buildInboxGuardReport(source, { now: "2026-06-06T12:00:00.000Z" });
    const reordered = buildInboxGuardReport(
      {
        ...source,
        domains: [...source.domains].reverse()
      },
      { now: "2026-06-06T12:00:00.000Z" }
    );

    expect(first.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(reordered.contentHash).toBe(first.contentHash);
  });
}
);
