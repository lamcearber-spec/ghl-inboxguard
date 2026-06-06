import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type PDFKit from "pdfkit";
import type { InboxGuardFinding, InboxGuardReport } from "./types";

export async function renderInboxGuardPdf(report: InboxGuardReport): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 42, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  title(doc, report);
  section(doc, "Portfolio summary");
  fact(doc, "Agency", report.agencyName);
  fact(doc, "Generated", report.generatedAt);
  fact(doc, "Evidence hash", report.contentHash);
  fact(doc, "Domains", String(report.totals.domains));
  fact(doc, "Red", String(report.totals.red));
  fact(doc, "Amber", String(report.totals.amber));
  fact(doc, "Green", String(report.totals.green));

  section(doc, "Findings");
  for (const finding of report.findings) {
    findingBlock(doc, finding);
  }

  section(doc, "Domain authentication roll-up");
  for (const row of report.domains) {
    doc.fontSize(9).fillColor("#171717").text(`${row.locationName} · ${row.domain} · ${row.status.toUpperCase()}`);
    doc
      .fontSize(8)
      .fillColor("#60646c")
      .text(`SPF ${row.spfStatus} · DKIM ${row.dkimStatus} · DMARC ${row.dmarcStatus}/${row.dmarcPolicy} · Expiry ${row.expiryStatus}`)
      .moveDown(0.45);
  }

  doc.end();
  await new Promise<void>((resolve) => doc.on("end", resolve));
  return Buffer.concat(chunks);
}

function title(doc: PDFKit.PDFDocument, report: InboxGuardReport): void {
  doc.fontSize(10).fillColor("#0f766e").text("SPF / DKIM / DMARC PORTFOLIO EVIDENCE", { characterSpacing: 0.5 });
  doc.moveDown(0.4);
  doc.fontSize(28).fillColor("#171717").text("InboxGuard", { lineGap: 2 });
  doc.fontSize(11).fillColor("#60646c").text(`${report.agencyName} · ${report.generatedAt}`);
  doc.moveDown(1.2);
}

function section(doc: PDFKit.PDFDocument, label: string): void {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor("#10201f").text(label);
  doc.moveTo(42, doc.y + 4).lineTo(553, doc.y + 4).strokeColor("#d8dee4").stroke();
  doc.moveDown(0.8);
}

function fact(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.fontSize(8).fillColor("#60646c").text(label.toUpperCase());
  doc.fontSize(10).fillColor("#171717").text(value || "Not available").moveDown(0.45);
}

function findingBlock(doc: PDFKit.PDFDocument, finding: InboxGuardFinding): void {
  doc.fontSize(10).fillColor(finding.severity === "critical" ? "#b42318" : "#7a4b00").text(`${finding.severity.toUpperCase()} · ${finding.title}`);
  doc.fontSize(9).fillColor("#171717").text(finding.summary);
  doc.fontSize(8).fillColor("#60646c").text(`${finding.locationName} · ${finding.domain}`).moveDown(0.7);
}
