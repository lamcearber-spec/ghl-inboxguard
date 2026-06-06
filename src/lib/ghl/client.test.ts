import { describe, expect, it } from "vitest";
import { buildGhlUrl, extractSendingDomain, normalizeInstalledLocation } from "./client";

describe("HighLevel InboxGuard client", () => {
  it("builds versioned HighLevel URLs without empty query values", () => {
    const url = buildGhlUrl("/oauth/installedLocations", { companyId: "company-1", limit: 100, cursor: "" });

    expect(url.toString()).toBe("https://services.leadconnectorhq.com/oauth/installedLocations?companyId=company-1&limit=100");
  });

  it("normalizes installed locations and extracts sending domains from common API shapes", () => {
    expect(
      normalizeInstalledLocation({
        locationId: "loc-1",
        name: "Alpha Clinic",
        emailServices: { sendingDomain: "mail.alpha.example" }
      })
    ).toEqual({
      id: "loc-1",
      name: "Alpha Clinic",
      domain: "mail.alpha.example"
    });

    expect(extractSendingDomain({ mailgun: { domain: "mg.bravo.example" } })).toBe("mg.bravo.example");
    expect(extractSendingDomain({ smtpProvider: { host: "https://send.charlie.example/path" } })).toBe("send.charlie.example");
  });
});
