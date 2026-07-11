# MAP.md — Web

## Purpose and runtime role

Next.js application for Engage7 public pages, authenticated Portal, and Admin. The Portal presents server-derived data; it does not own DARTH or physiological logic.

## Primary entry points

- `app/portal/layout.tsx` and `components/portal/portal-shell.tsx` — authenticated shell/navigation.
- `components/portal/portal-sidebar.tsx` — authoritative Portal surface list.
- `app/api/proxy/` — authenticated server-side API proxy boundary.
- `lib/auth-server.ts`, `lib/api/signing.ts`, `lib/server-config.ts` — session, request signing, and API origin.

## Feature-to-code map

- Overview: `app/portal/page.tsx` → portal overview/trends/health-data proxies.
- Insights: `app/portal/insights/page.tsx`, `components/portal/compare-improve-block.tsx` → analyses/trends/overview proxies.
- Health: `app/portal/health/page.tsx` and `health/{sleep,recovery,activity,all}/` → health-data proxy; DARTH panel and AI reflection components are server-artifact displays.
- Data Lab: `app/portal/trends/page.tsx` → trends proxy.
- Reports: `app/portal/reports/` and `lib/api/analysis.ts` → analyses list/detail proxy and safe AI Reflection panel.
- Settings: `app/portal/settings/page.tsx` → account, overview, profile, preference, and footprint proxies.

## Canonical flow

Portal route → client component → `/api/proxy/...` → verified Portal cookie session → signed API request → API response. Do not call protected API routes directly from browser code or copy server business rules to the client.

## Authentication and protected areas

- Password and Google authenticate through Supabase Auth. `app/api/auth/` exchanges the Supabase session for HttpOnly Supabase cookies plus the existing HttpOnly Portal session containing canonical `user_id`.
- `lib/supabase-auth-server.ts`, `lib/app-user-sync.ts`, `lib/auth-server.ts`, and `lib/auth-edge.ts` own the server session/projection boundary.
- Settings exposes Password/Google connected state from Supabase identities; password setup uses authenticated `updateUser`, and Google connection uses authenticated `linkIdentity` with `openid email profile` only.
- Portal proxies send signed `X-User-Id`; email remains display/contact metadata and cannot select ownership.
- High-risk: auth, public claim/import, upload, account deletion, billing, telemetry consent, AI Reflection, Health data, API origin/signing, Admin.
- Admin and public marketing routes are not authenticated Portal parity scope.

## Validation and related docs

- `npm run lint`, `npx tsc --noEmit`, `npm run build`; browser smoke for changed journeys.
- Read `README.md`, `DEPLOYMENT.md`, `../docs/AI_CONTEXT.md`, `../docs/contracts/PORTAL_DATA_CONTRACT.md`, and the iOS architecture doc when relevant.

## Maintenance rule

Update this map when a Portal surface, proxy flow, auth/config boundary, protected area, or validation command moves.
