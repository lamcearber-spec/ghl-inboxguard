# InboxGuard: SPF DKIM DMARC Monitor for HighLevel

InboxGuard is a read-only HighLevel Marketplace app for agency-wide SPF, DKIM, and DMARC drift reports across client sending domains.

## Marketplace Positioning

**Suggested app name:** InboxGuard: SPF DKIM DMARC Monitor

**Short description:** Monitor SPF, DKIM, DMARC, and DNS drift across HighLevel client sending domains from one agency dashboard.

**Search terms to work into the listing:** SPF monitor, DKIM monitor, DMARC monitor, email deliverability, sending domain audit, DNS drift, Gmail Yahoo compliance, HighLevel email authentication, GHL domain monitor.

**Pricing:** GHL native billing. Free scan for up to 5 sub-accounts, $39/mo up to 25, $79/mo up to 75, $149/mo unlimited.

## Read-Only Scopes

- `locations.readonly`
- `campaigns.readonly`

No write scopes are used. Domain authentication checks use public DNS-over-HTTPS.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The dashboard uses fixture mode until HighLevel OAuth credentials are configured and an `installationId` is present.

## Environment

Copy `.env.example` to `.env.local` and fill:

- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_REDIRECT_URI`
- `APP_BASE_URL`
- `INSTALLATION_SECRET`
- `DATABASE_URL`

If `DATABASE_URL` is set, InboxGuard stores encrypted OAuth tokens in Neon/Postgres. Without it, development uses memory storage.

## HighLevel Setup

Create a public Marketplace app, target agency/company installs, and configure the Custom Page URL to the deployed app root and the OAuth redirect URL to `/api/ghl/callback`.

The app reads:

- `GET /oauth/installedLocations`
- `GET /locations/:locationId`
- `GET /companies/:companyId`

If HighLevel does not expose a sending domain for a sub-account, the app keeps the workflow zero-write and falls back to the fixture/manual-domain UX surface for reviewers.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```
