# Engage7 Web — Deployment & Domain Management

This document describes the safe, YC-approved workflow for deploying the Engage7 web app across DEV and production environments on Vercel.

## Branch & Domain Mapping

```
main branch → production → deploy to: www.engage7.ie / engage7.ie
dev branch  → development → deploy to: dev.engage7.ie
```

`main` is the intended production publication branch. `dev` is the intended DEV
publication branch.

## Environment Variables

### Per-Environment Configuration (via Vercel Dashboard)

Both **Production** and **Preview** deployments must set these variables:

#### Production (main branch)

- `NEXT_PUBLIC_APP_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://www.engage7.ie`
- `NEXT_PUBLIC_API_BASE_URL=<active Engage7 PROD API URL>`
- `ENGAGE7_API_BASE_URL=<active Engage7 PROD API URL>`
- `NEXT_PUBLIC_ADMIN_ENV_LABEL=prod-neu`
- `NEXT_PUBLIC_SUPABASE_URL=<PROD Supabase project URL>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<PROD Supabase anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<PROD service role key, server-side only>`
- `NEXT_PUBLIC_POSTHOG_KEY=<PROD PostHog key>`
- `NEXT_PUBLIC_POSTHOG_HOST=<PROD PostHog ingest host>`
- `NEXT_PUBLIC_POSTHOG_UI_HOST=<PROD PostHog UI host>`
- `RESEND_API_KEY=<PROD Resend key, server-side only>`
- `EMAIL_FROM=<PROD verified sender>`

#### Preview / DEV (dev branch)

- `NEXT_PUBLIC_APP_ENV=development`
- `NEXT_PUBLIC_SITE_URL=https://dev.engage7.ie` (or leave unset for automatic default)
- `NEXT_PUBLIC_API_BASE_URL=https://aca-engage7-api-dev-neu.nicewater-a1f85a44.northeurope.azurecontainerapps.io`
- `ENGAGE7_API_BASE_URL=https://aca-engage7-api-dev-neu.nicewater-a1f85a44.northeurope.azurecontainerapps.io`
- `NEXT_PUBLIC_ADMIN_ENV_LABEL=dev-neu`
- `NEXT_PUBLIC_SUPABASE_URL=<DEV Supabase project URL>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<DEV Supabase anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<DEV service role key, server-side only>`
- `NEXT_PUBLIC_POSTHOG_KEY=<DEV PostHog key, or empty to disable analytics>`
- `NEXT_PUBLIC_POSTHOG_HOST=<DEV PostHog ingest host>`
- `NEXT_PUBLIC_POSTHOG_UI_HOST=<DEV PostHog UI host>`
- `RESEND_API_KEY=<DEV/test Resend key, server-side only>`
- `EMAIL_FROM=<DEV verified or allowlisted sender>`

`NEXT_PUBLIC_API_BASE_URL` is embedded into browser JavaScript during the Vercel build.
Changing it in a runtime environment after `next build` will not update the client bundle;
fix the Vercel environment variable and redeploy.

`ENGAGE7_API_BASE_URL` is server-side only and is used by Next.js route handlers
and proxy routes. Keep it aligned with `NEXT_PUBLIC_API_BASE_URL` unless a future
architecture explicitly introduces a separate internal API endpoint.

`API_BASE_URL` was removed from the Web API routing contract in HOTFIX 45.3.3.
Do not set it for new deployments and remove it from existing Vercel
Production/Preview/Development environments when safe.

## Why This Matters

The `NEXT_PUBLIC_APP_ENV` variable controls:

- **DEV badge visibility** — Shows on all pages when in DEV
- **Page title prefix** — `[DEV]` appears in browser tab only in DEV
- **Social sharing URLs** — Open Graph metadata points to correct domain
- **Canonical URLs** — SEO metadata uses correct environment

**Without correct `NEXT_PUBLIC_APP_ENV` setup:** Social shares from DEV appear to come from production, confusing users and analytics.

## Safe Deployment Commands

### Local Development

```bash
# Set local dev environment
export NEXT_PUBLIC_APP_ENV=dev

# Run dev server
pnpm dev       # runs on http://localhost:3000

# Test build locally
pnpm build
```

### Push to Repository

```bash
# For a DEV feature branch
git push origin feature-branch-name
# → Vercel Preview automatically builds and deploys to a preview URL

# For main (production)
git push origin main
# → Vercel production deployment to www.engage7.ie

# Do NOT use vercel --prod for dev branch code
# This bypasses Vercel's branch-domain mapping and deploys to production domain.
```

### Vercel CLI Commands (if needed)

```bash
# Deploy current code to production (main branch only!)
vercel --prod

# Deploy to staging/preview
vercel   # (without --prod flag)

# DANGER: vercel --prod from dev branch pushes code to www.engage7.ie
# Never do this without explicit review.
```

## Vercel Project Configuration

### Verify These Settings in Vercel Dashboard

1. **Project > Domains**

   - Production: `www.engage7.ie`, `engage7.ie` (apex redirect)
   - Preview: `dev.engage7.ie` (assigned to `dev` branch)

2. **Project > Integrations > Git > Deployments**

   - Production branch: `main`
   - Preview deployments: enabled for all branches
   - PR previews: enabled

3. **Environment Variables**
   - Set per environment (Production vs Preview)
   - `NEXT_PUBLIC_APP_ENV` must differ between them

## Manual Verification Checklist

After any deployment:

### On www.engage7.ie (Production)

- [ ] No DEV badge in bottom-left corner
- [ ] Browser tab title: `Engage7 — ...` (no `[DEV]` prefix)
- [ ] Open Graph image meta tag points to `www.engage7.ie`

### On dev.engage7.ie (DEV)

- [ ] DEV badge visible in bottom-left corner (pulsing amber dot + "DEV" text)
- [ ] Browser tab title: `[DEV] Engage7 — ...`
- [ ] Open Graph image meta tag points to `dev.engage7.ie`
- [ ] Local `/api/debug/env` returns safe status fields only; hosted DEV/Preview returns 404
- [ ] Browser console shows `[api-debug]` with the active DEV API URL.
- [ ] Vercel deployment source includes the expected API URL in built static chunks.
- [ ] API calls resolve to the DEV ACA URL, not PROD and not localhost.

```bash
rg "aca-engage7-api-dev-neu\\.nicewater-a1f85a44\\.northeurope\\.azurecontainerapps\\.io" .next/static --glob "!*.map"
rg "http://localhost:8000" .next/static --glob "!*.map"
```

## Troubleshooting

### "www.engage7.ie shows DEV badge"

- Check Vercel environment variables for Production
- `NEXT_PUBLIC_APP_ENV` should be `production`, not `dev`
- Redeploy after fixing

### "dev.engage7.ie behaves like production"

- Check `NEXT_PUBLIC_APP_ENV` is set to `development` in Preview env vars
- Check Vercel domain assignment: `dev.engage7.ie` should be assigned to `dev` branch
- Verify social shared links point to `dev.engage7.ie`, not `www.engage7.ie`

### "dev.engage7.ie calls localhost or the wrong API"

- Check Vercel Preview env vars `NEXT_PUBLIC_API_BASE_URL` and `ENGAGE7_API_BASE_URL`
- Expected value: active Engage7 DEV API URL.
- Redeploy after fixing the env var; `NEXT_PUBLIC_*` values are build-time client values
- Use Vercel env inspection and server logs for hosted runtime checks; `/api/debug/env` is closed on hosted deployments

### "Social shares show wrong domain"

- Verify `NEXT_PUBLIC_SITE_URL` is set correctly per environment
- Or ensure `NEXT_PUBLIC_APP_ENV` is set (falls back to environment-aware default)
- Wait for new deployment to be built and deployed

## References

- Vercel docs: [Environment Variables](https://vercel.com/docs/secure-access/environment-variables)
- Vercel docs: [Deployment Branches](https://vercel.com/docs/deployments/branches)
- Next.js docs: [Metadata & OpenGraph](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
