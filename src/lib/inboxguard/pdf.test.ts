import { describe, expect, it } from "vitest";
import { demoInboxGuardReport } from "./fixtures";
import { renderInboxGuardPdf } from "./pdf";

describe("InboxGuard PDF", () => {
  it("renders a downloadable evidence PDF", async () => {
    const pdf = await renderInboxGuardPdf(demoInboxGuardReport);

    expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});
