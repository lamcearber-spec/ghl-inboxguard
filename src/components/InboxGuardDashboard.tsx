import { ArrowDownToLine, FileText, MailCheck, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { toInboxGuardCsv, toInboxGuardFindingsCsv } from "@/lib/inboxguard/export";
import type { DomainHealthStatus, InboxGuardReport } from "@/lib/inboxguard/types";

type InboxGuardDashboardProps = {
  report: InboxGuardReport;
  mode: "fixture" | "live";
  pdfUrl?: string;
};

export function InboxGuardDashboard({ report, mode, pdfUrl = "/api/report/pdf" }: InboxGuardDashboardProps) {
  return (
    <main className="shell">
      <section className="topbar" aria-label="InboxGuard summary">
        <div>
          <p className="eyebrow">SPF / DKIM / DMARC portfolio monitor</p>
          <h1>InboxGuard</h1>
          <p className="subcopy">
            Cross-sub-account sender-authentication drift reports for HighLevel agencies managing many client sending domains.
          </p>
        </div>
        <div className="mode-pill" title={mode === "fixture" ? "Demo scan is active until the app is installed." : "Live agency scan"}>
          <ShieldCheck size={16} aria-hidden="true" />
          {mode === "fixture" ? "Fixture scan" : "Live scan"}
        </div>
      </section>

      <div className="action-row" aria-label="Primary evidence downloads">
        <a className="csv-link primary-download" href={pdfUrl} download>
          <FileText size={15} aria-hidden="true" />
          Download PDF
        </a>
      </div>

      <section className="metrics" aria-label="Domain authentication totals">
        <Metric label="Domains" value={String(report.totals.domains)} tone="neutral" />
        <Metric label="Red" value={String(report.totals.red)} tone={report.totals.red > 0 ? "risk" : "neutral"} />
        <Metric label="Amber" value={String(report.totals.amber)} tone={report.totals.amber > 0 ? "review" : "neutral"} />
      </section>

      <section className="notice" aria-label="Read-only guarantee">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Read-only by design. InboxGuard checks HighLevel location metadata plus public DNS; it never edits DNS, campaigns, contacts, or account settings.</span>
      </section>

      <section className="table-grid evidence-grid" aria-label="Audit details">
        <div className="table-panel">
          <div className="table-head">
            <h2>
              <TriangleAlert size={18} aria-hidden="true" />
              Deliverability findings
            </h2>
            <a className="csv-link" href={csvHref(toInboxGuardFindingsCsv(report))} download="inboxguard-findings.csv">
              <ArrowDownToLine size={15} aria-hidden="true" />
              Download findings
            </a>
          </div>
          <div className="finding-list">
            {report.findings.map((finding) => (
              <article key={finding.id} className={`finding finding-${finding.severity}`}>
                <span className={`badge badge-${finding.severity === "critical" ? "missing" : "review"}`}>{finding.severity}</span>
                <h3>{finding.title}</h3>
                <p>{finding.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="table-panel">
          <div className="table-head">
            <h2>
              <Radar size={18} aria-hidden="true" />
              Evidence hash
            </h2>
          </div>
          <p className="hash-text">{report.contentHash}</p>
          <p className="panel-copy">
            Pack generated for {report.agencyName} on {report.generatedAt}. DNS records are checked through public DNS-over-HTTPS.
          </p>
        </div>
      </section>

      <section className="table-panel transcript-panel">
        <div className="table-head">
          <h2>
            <MailCheck size={18} aria-hidden="true" />
            Domain auth roll-up
          </h2>
          <a className="csv-link" href={csvHref(toInboxGuardCsv(report))} download="inboxguard-domains.csv">
            <ArrowDownToLine size={15} aria-hidden="true" />
            Download domains
          </a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>SPF</th>
                <th>DKIM</th>
                <th>DMARC</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {report.domains.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.locationName}</strong>
                    <span className="cell-subtext">{row.domain}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${statusBadge(row.status)}`}>{row.status}</span>
                  </td>
                  <td>{row.spfStatus}</td>
                  <td>{row.dkimStatus}</td>
                  <td>
                    {row.dmarcStatus}
                    <span className="cell-subtext">{row.dmarcPolicy}</span>
                  </td>
                  <td>
                    {row.expiryStatus}
                    <span className="cell-subtext">{row.daysUntilExpiry === undefined ? "not available" : `${row.daysUntilExpiry} days`}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "risk" | "review" | "neutral" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusBadge(status: DomainHealthStatus): "missing" | "review" | "ok" {
  if (status === "red") {
    return "missing";
  }

  return status === "amber" ? "review" : "ok";
}

function csvHref(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}
