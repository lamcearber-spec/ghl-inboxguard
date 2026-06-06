import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/api/report", () => {
  it("returns a fixture-backed InboxGuard report with CSV exports", async () => {
    const response = await GET(new Request("https://inboxguard.test/api/report"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("fixture");
    expect(payload.report.agencyName).toBe("Radom Force");
    expect(payload.domainCsv).toContain("location,domain,status");
    expect(payload.findingsCsv).toContain("missing-auth");
  });
});
