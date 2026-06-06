import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoInboxGuardReport } from "@/lib/inboxguard/fixtures";
import { InboxGuardDashboard } from "./InboxGuardDashboard";

describe("InboxGuardDashboard", () => {
  it("renders domain auth findings, client rows, and export actions", () => {
    render(<InboxGuardDashboard report={demoInboxGuardReport} mode="fixture" />);

    expect(screen.getByRole("heading", { name: /inboxguard/i })).toBeInTheDocument();
    expect(screen.getByText(/missing sender authentication/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bravo-dental.example/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /download pdf/i })).toHaveAttribute("href", "/api/report/pdf");
    expect(screen.getByRole("link", { name: /download domains/i })).toHaveAttribute("download", "inboxguard-domains.csv");
  });
});
