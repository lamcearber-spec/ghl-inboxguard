import { describe, expect, it, vi } from "vitest";
import Home from "./page";
import { scanInboxGuard } from "@/lib/inboxguard/scan";

vi.mock("@/lib/inboxguard/scan", () => ({
  scanInboxGuard: vi.fn(async () => ({
    mode: "fixture",
    report: {
      agencyName: "Test Agency",
      generatedAt: "2026-06-06T10:00:00.000Z",
      contentHash: "a".repeat(64),
      totals: { domains: 1, red: 0, amber: 0, green: 1, findings: 0 },
      domains: [],
      findings: []
    },
    domainCsv: "",
    findingsCsv: ""
  }))
}));

describe("Home", () => {
  it("passes marketplace redirect params into the InboxGuard scan", async () => {
    await Home({
      searchParams: Promise.resolve({
        installationId: "company-1"
      })
    });

    expect(scanInboxGuard).toHaveBeenCalledWith({
      installationId: "company-1"
    });
  });
});
