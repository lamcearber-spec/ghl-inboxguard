import { buildInboxGuardReport } from "./model";
import type { InboxGuardSource } from "./types";

export const demoInboxGuardSource: InboxGuardSource = {
  agencyName: "Radom Force",
  generatedAt: "2026-06-06T12:00:00.000Z",
  domains: [
    {
      id: "bravo",
      locationId: "loc-2",
      locationName: "Bravo Dental",
      domain: "bravo-dental.example",
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
      domain: "charlie-gym.example",
      dns: {
        spf: ["v=spf1 include:_spf.google.com ~all"],
        dmarc: ["v=DMARC1; p=none; rua=mailto:dmarc@charlie-gym.example"],
        dkim: {}
      },
      previous: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@charlie-gym.example"],
        dkim: {}
      },
      bounceRate: 0.071,
      spamRate: 0.018
    },
    {
      id: "alpha",
      locationId: "loc-1",
      locationName: "Alpha Clinic",
      domain: "alpha-clinic.example",
      dns: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@alpha-clinic.example"],
        dkim: {
          default: ["v=DKIM1; k=rsa; p=alpha"]
        }
      },
      previous: {
        spf: ["v=spf1 include:mailgun.org ~all"],
        dmarc: ["v=DMARC1; p=reject; rua=mailto:dmarc@alpha-clinic.example"],
        dkim: {
          default: ["v=DKIM1; k=rsa; p=alpha"]
        }
      },
      expiresAt: "2026-12-01T00:00:00.000Z"
    }
  ]
};

export const demoInboxGuardReport = buildInboxGuardReport(demoInboxGuardSource, {
  now: "2026-06-06T12:00:00.000Z"
});
