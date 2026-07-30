# MAP.md — Web

## Purpose and runtime role

Next.js application for Engage7 public pages, authenticated Portal, and Admin. The Portal presents server-derived data; it does not own DARTH or physiological logic.

## Primary entry points

- `app/portal/layout.tsx` and `components/portal/portal-shell.tsx` — authenticated shell/navigation.
- `app/onboarding/` and `app/api/auth/onboarding/` — server-backed one-time profile/tutorial gate using the canonical profile API and Supabase completion metadata.
- `components/portal/portal-sidebar.tsx` — authoritative Portal surface list.
- `app/api/proxy/` — authenticated server-side API proxy boundary.
- `components/portal/analytics-reupload-banner.tsx` and `app/api/proxy/users/analytics-status/` — shared server-owned legacy-v1 re-upload guidance.
- `lib/auth-server.ts`, `lib/api/signing.ts`, `lib/server-config.ts` — session, request signing, and API origin.

## Feature-to-code map

- Overview: `app/portal/page.tsx` and `components/portal/contextual-intelligence-card.tsx` → portal overview/trends/health-data proxies; SOL renders the server-owned localized contextual artifact before the metric grid.
- Insights: `app/portal/insights/page.tsx`, `components/portal/compare-improve-block.tsx` → analyses/trends/overview proxies.
- Health: `app/portal/health/page.tsx` and `health/{sleep,recovery,activity,all}/` → health-data proxy; the compact Overview links to the consolidated `/portal/health/all` surface, while DARTH panel and AI reflection components remain server-artifact displays.
- Data Lab: `app/portal/trends/page.tsx` → trends proxy.
- Reports: `app/portal/reports/` and `lib/api/analysis.ts` → analyses list/detail proxy and safe AI Reflection panel.
- Settings: `app/portal/settings/page.tsx` → account, overview, profile, preference, and footprint proxies.

## Public homepage actions

The shared `SiteHeader` implements both desktop and mobile public actions. Get
started always links to `/login?next=/onboarding` and remains the acquisition
and onboarding action. After the canonical browser session snapshot resolves,
the second action is Sign in (`/login`) without a valid session and Portal
(`/portal`) with one. Portal is the authenticated state of Sign in; do not
merge it with Get started or add a second session source, storage inference, or
auth callback behavior.

## Canonical flow

Public landing → Get started → Supabase provider/Email OTP or returning legacy password → `/onboarding` → canonical profile update → Supabase completion metadata → `/portal/upload`. Upload-token issuance resolves the verified Portal session and calls `/api/users/me/upload-sas` with canonical UUID identity before Blob transfer. Portal route → client component → `/api/proxy/...` → verified Portal cookie session → signed API request → API response. Retired `/analyze`, `/result/*`, public proxies, and claim continuation redirect or return 410. Do not call protected API routes directly from browser code or copy server business rules to the client.

## Authentication and protected areas

- Apple, Google, Email OTP, and returning-user legacy password authenticate through Supabase Auth. `app/api/auth/` exchanges the Supabase session for HttpOnly Supabase cookies plus the existing HttpOnly Portal session containing canonical `user_id`.
- `lib/supabase-auth-server.ts`, `lib/app-user-sync.ts`, `lib/auth-server.ts`, and `lib/auth-edge.ts` own the server session/projection boundary.
- Settings exposes Password/Google connected state from Supabase identities; password setup uses authenticated `updateUser`, and Google connection uses authenticated `linkIdentity` with `openid email profile` only.
- Portal proxies send signed `X-User-Id`; email remains display/contact metadata and cannot select ownership.
- High-risk: auth, onboarding metadata, retired public routes, authenticated upload, account deletion, billing, telemetry consent, AI Reflection, Health data, API origin/signing, Admin.
- Admin and public marketing routes are not authenticated Portal parity scope.

## Validation and related docs

- `npm run lint`, `npx tsc --noEmit`, `npm run build`; browser smoke for changed journeys.
- Read `README.md`, `DEPLOYMENT.md`, `../docs/AI_CONTEXT.md`, `../docs/contracts/PORTAL_DATA_CONTRACT.md`, and the iOS architecture doc when relevant.

## Maintenance rule

Update this map when a Portal surface, proxy flow, auth/config boundary, protected area, or validation command moves.
