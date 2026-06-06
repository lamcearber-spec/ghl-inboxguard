import { InfoPage } from "@/components/InfoPage";

export default function SupportPage() {
  return (
    <InfoPage eyebrow="InboxGuard" title="Support">
      <p>Email support@konverter-pro.de for installation help, report questions, deletion requests, and billing issues.</p>
      <p>
        For review, include your agency ID, affected sub-account IDs, and whether the issue involves sending-domain
        detection, SPF, DKIM, DMARC, DNS drift, CSV export, or PDF export.
      </p>
      <p>Normal response target: within two business days.</p>
    </InfoPage>
  );
}
