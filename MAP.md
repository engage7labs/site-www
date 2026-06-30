# MAP - Web Repository

## Purpose

Next.js Web, Portal, and Admin frontend for Engage7 public upload, authenticated Portal, Admin utilities, analytics consent, and API proxy routes.

## Key Paths

- `app/` - Next.js routes, layouts, pages, and route handlers.
- `components/` - shared UI, Portal, Admin, charts, and product components.
- `lib/` - API clients, auth/session helpers, contracts, utilities, analytics, and feature logic.
- `styles/` - global styling.
- `public/` - static assets.
- `proxy.ts` - request proxy/middleware boundary.
- `instrumentation.ts` - instrumentation entrypoint.
- `package.json` - Web version and scripts.

## Canonical Flows

- Public flow: upload, teaser/result, and claim/import into Portal.
- Authenticated flow: Portal Overview, Insights, Health, Data Lab, My Reports, and Settings.
- Admin flow: admin-only shell and utility pages.
- Server API access: use the approved Engage7 API URL contract; do not reintroduce generic fallback behavior.

## Explicit Approval Areas

- Auth/session behavior, Google sign-in callback, account deletion, billing, analytics consent, public claim/import, upload-token handling, AI Reflection rendering, Health dashboard reads, API URL resolution, Admin diagnostics, and visible product versioning.
- Any change that could expose private data, raw health values, identifiers, blob/SAS paths, provider envelopes, stack traces, or emails.

## Common Validation

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Browser smoke for touched user journeys when UI behavior changes.

## Related Docs

- `README.md`
- `DEPLOYMENT.md`
- `../docs/AI_CONTEXT.md`
- `../docs/contracts/PORTAL_DATA_CONTRACT.md`
