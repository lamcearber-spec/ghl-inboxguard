# InboxGuard HighLevel Marketplace Submission

## URLs

- Production app URL: `https://ghl-inboxguard.vercel.app/`
- OAuth callback URL: `https://ghl-inboxguard.vercel.app/api/ghl/callback`
- Privacy URL: `https://ghl-inboxguard.vercel.app/privacy`
- Terms URL: `https://ghl-inboxguard.vercel.app/terms`
- Support URL: `https://ghl-inboxguard.vercel.app/support`

## App Identity

- App name: `InboxGuard: SPF DKIM DMARC Monitor`
- Short name: `InboxGuard`
- Category: Email
- Target user: Agency
- Short description: `Monitor SPF, DKIM, DMARC, and DNS drift across HighLevel client sending domains from one agency dashboard.`

## Long Description

InboxGuard helps HighLevel agencies catch sender-authentication problems before client campaigns fail. It rolls up SPF, DKIM, DMARC policy, domain expiry, DNS drift, bounce-rate signals, and spam-rate signals across client sending domains in one read-only agency dashboard.

The app is read-only. It reads installed locations, extracts best-effort sending-domain metadata when available, checks public DNS-over-HTTPS records, and exports CSV plus a PDF evidence pack. If a location does not expose a sending domain, the app remains zero-write and lets the agency use manually supplied domains for monitoring.

Use it for Gmail/Yahoo sender-auth reviews, agency deliverability operations, client handoff evidence, and recurring domain-auth drift checks. InboxGuard does not create, edit, delete, or change DNS, campaigns, contacts, locations, or HighLevel account settings.

## Search Keywords

`SPF monitor`, `DKIM monitor`, `DMARC monitor`, `email deliverability`, `sending domain audit`, `DNS drift`, `Gmail Yahoo compliance`, `HighLevel email authentication`, `GHL domain monitor`, `agency deliverability`

## Scope Justification

- `locations.readonly`: read installed sub-account names and best-effort sending-domain metadata.
- `campaigns.readonly`: read campaign reporting signals where available for secondary bounce/spam review.

No write scopes are requested. Public DNS checks happen outside HighLevel through DNS-over-HTTPS.

## Reviewer Test Notes

The root dashboard renders fixture data before installation, so reviewers can inspect the report immediately. After OAuth install, the app stores encrypted tokens and reads location/company data on demand. PDF and CSV exports are available from the dashboard and from `/api/report` and `/api/report/pdf`.
