import { scanInboxGuard } from "@/lib/inboxguard/scan";
import { renderInboxGuardPdf } from "@/lib/inboxguard/pdf";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scan = await scanInboxGuard({
    installationId: url.searchParams.get("installationId") ?? undefined
  });
  const pdf = await renderInboxGuardPdf(scan.report);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="inboxguard-${scan.report.generatedAt.slice(0, 10)}.pdf"`
    }
  });
}
