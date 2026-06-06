import { InfoPage } from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage eyebrow="InboxGuard" title="Terms of Service">
      <p>
        InboxGuard provides read-only SPF, DKIM, DMARC, DNS-drift, and domain-authentication evidence packs for
        operational deliverability review. It is not legal advice and does not guarantee inbox placement.
      </p>
      <p>
        Findings are based on available HighLevel location, company, installed-location, campaign-reporting, and public
        DNS records at the time a pack is generated. Users should review all evidence before relying on it in a client
        deliverability review.
      </p>
      <p>
        InboxGuard does not modify account data. Users remain responsible for changing DNS, validating sender
        authentication, responding to deliverability issues, and validating exports against their systems of record.
      </p>
      <p>Support: support@konverter-pro.de.</p>
    </InfoPage>
  );
}
