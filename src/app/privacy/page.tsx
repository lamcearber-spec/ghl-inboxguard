import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="InboxGuard" title="Privacy Policy">
      <p>
        InboxGuard is a read-only evidence app for HighLevel location metadata, best-effort sending-domain records,
        public DNS authentication records, and campaign reporting signals. The app requests only read scopes needed to
        produce SPF, DKIM, DMARC, and DNS-drift evidence packs.
      </p>
      <p>
        InboxGuard stores OAuth access and refresh tokens so installed accounts can generate reports. In production,
        stored tokens are encrypted before being persisted. The app does not sell customer data and does not use account
        or campaign data for advertising.
      </p>
      <p>
        Evidence packs may include sub-account names, sending domains, DNS TXT records, DMARC policy status, domain
        expiry status, bounce/spam-rate indicators where available, findings, and generated content hashes. InboxGuard
        does not create, edit, delete, or change DNS, campaigns, contacts, locations, or HighLevel account settings.
      </p>
      <p>Support and deletion requests: support@konverter-pro.de.</p>
    </InfoPage>
  );
}
