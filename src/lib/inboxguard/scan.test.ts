import { describe, expect, it } from "vitest";
import type { InstallationStore, MarketplaceInstallation } from "@/lib/store/installations";
import { scanInboxGuard } from "./scan";

const installation: MarketplaceInstallation = {
  id: "company-1",
  companyId: "company-1",
  userType: "Company",
  accessToken: "live-token",
  refreshToken: "refresh-token",
  expiresAt: "2026-06-06T11:00:00.000Z",
  scopes: ["locations.readonly", "campaigns.readonly"],
  createdAt: "2026-06-06T10:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z"
};

describe("scanInboxGuard", () => {
  it("returns a fixture-backed report when no installation is available", async () => {
    const scan = await scanInboxGuard({}, { store: emptyStore() });

    expect(scan.mode).toBe("fixture");
    expect(scan.report.agencyName).toBe("Radom Force");
    expect(scan.domainCsv).toContain("location,domain,status");
    expect(scan.findingsCsv).toContain("missing-auth");
  });

  it("uses a live installation and client factory when installationId is provided", async () => {
    const scan = await scanInboxGuard(
      { installationId: "company-1" },
      {
        store: storeWith(installation),
        clientFactory: (token) => ({
          buildInboxGuardSource: async () => ({
            agencyName: `Token ${token}`,
            generatedAt: "2026-06-06T10:00:00.000Z",
            domains: [
              {
                id: "loc-live",
                locationId: "loc-live",
                locationName: "Live Location",
                domain: "live.example",
                dns: {
                  spf: ["v=spf1 include:_spf.google.com ~all"],
                  dmarc: ["v=DMARC1; p=reject"],
                  dkim: { default: ["v=DKIM1; p=live"] }
                }
              }
            ]
          })
        })
      }
    );

    expect(scan.mode).toBe("live");
    expect(scan.report.agencyName).toBe("Token live-token");
    expect(scan.report.domains[0].domain).toBe("live.example");
  });
});

function emptyStore(): InstallationStore {
  return {
    get: async () => undefined,
    save: async () => undefined
  };
}

function storeWith(value: MarketplaceInstallation): InstallationStore {
  return {
    get: async (id) => (id === value.id ? value : undefined),
    save: async () => undefined
  };
}
