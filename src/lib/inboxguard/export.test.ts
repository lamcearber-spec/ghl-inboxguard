import { describe, expect, it } from "vitest";
import { demoInboxGuardReport } from "./fixtures";
import { toInboxGuardCsv, toInboxGuardFindingsCsv } from "./export";

describe("InboxGuard exports", () => {
  it("exports domain status rows and finding rows for reviewer evidence", () => {
    const domainCsv = toInboxGuardCsv(demoInboxGuardReport);
    const findingCsv = toInboxGuardFindingsCsv(demoInboxGuardReport);

    expect(domainCsv.split("\n")[0]).toBe("location,domain,status,spf,dkim,dmarc,policy,expiry,record_changed,bounce_rate,spam_rate");
    expect(domainCsv).toContain("Bravo Dental,bravo-dental.example,red,missing,missing,missing,missing,expiring,false,,");
    expect(findingCsv.split("\n")[0]).toBe("severity,rule,title,domain,location,summary");
    expect(findingCsv).toContain("critical,missing-auth");
  });
});
