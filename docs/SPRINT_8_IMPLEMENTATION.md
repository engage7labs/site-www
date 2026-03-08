# Sprint 8 Implementation — Engage7 Web

This document describes the Sprint 8 implementation for the Engage7 web repository.

## Implementation Date

March 8, 2026

## Overview

Sprint 8 establishes the first real web product flow for Engage7, connecting the website structure to the future backend integration path while preserving deterministic architecture and repository boundaries.

## Architecture Boundaries Preserved

- **site-www (this repo)**: Web UI / rendering layer
- **engage7-api**: Orchestration layer (not yet integrated)
- **engage7**: Deterministic analysis engine
- **engage7-data-pipeline**: ETL and canonical dataset generation

**Critical**: No deterministic logic has been moved into the frontend. The frontend renders API outputs only.

## Deliverables Completed

### 1. Multilanguage Foundation

**Location**: `lib/i18n/`

Implemented a lightweight, deterministic i18n system supporting:

- English (Ireland) — `en-IE` (default)
- Portuguese (Brazil) — `pt-BR`
- Hindi (India) — `hi-IN`

**Key Files**:

- `lib/i18n/config.ts` — Locale configuration and mapping rules
- `lib/i18n/detect-locale.ts` — Browser locale detection with localStorage persistence
- `lib/i18n/dictionaries/` — Typed dictionaries for all locales
- `components/providers/locale-provider.tsx` — React context provider
- `components/shared/locale-switcher.tsx` — UI switcher component

**Locale Behavior**:

- Automatically detects browser locale on first visit
- Maps browser locales deterministically (e.g., `en-US` → `en-IE`)
- Persists selected locale to localStorage
- Provides typed dictionary access via `useLocale()` hook

### 2. Theme Foundation

**Location**: `lib/theme/`

Implemented theme system aligned with Windows app semantics:

- **light** — Light theme
- **black** — Product name for dark theme (maps to CSS `dark` class)

**Key Files**:

- `lib/theme/config.ts` — Theme configuration and CSS mapping
- `lib/theme/detect-theme.ts` — Browser preference detection with localStorage persistence
- `components/providers/app-theme-provider.tsx` — Wraps next-themes with product semantics
- `components/shared/theme-switcher.tsx` — UI switcher component

**Theme Behavior**:

- Detects browser color scheme preference (`prefers-color-scheme`)
- Maps product theme "black" to existing CSS "dark" implementation
- Persists selected theme to localStorage
- Provides theme access via `useAppTheme()` hook

### 3. Homepage Repositioning

**Location**: `app/page.tsx`

Refactored homepage to represent the real Engage7 product value proposition.

**Changes**:

- Updated hero messaging to focus on deterministic, explainable insights
- Changed three pillars from generic AI to:
  - Deterministic Analysis
  - Explainable Signals
  - Privacy by Design
- Updated CTAs to point to `/analyze`
- Added theme and locale switchers to navigation
- All text now sourced from i18n dictionaries
- Preserved visual identity (colors, logo, background, spotlight effect)

### 4. Product Entry Route

**Location**: `app/analyze/page.tsx`

Created product entry page for uploading and analyzing wearable data.

**Features**:

- Three-step workflow explanation
- File upload component with drag-and-drop support
- Privacy assurances section
- Validation for file type and size
- Upload progress states

**Implementation Notes**:

- Upload currently uses mock implementation
- Ready for real API integration via `lib/api/analysis.ts`
- File validation is client-side only (backend validation required)

### 5. Result Route Shell

**Location**: `app/result/[jobId]/page.tsx`

Created dynamic route for displaying analysis results.

**Features**:

- Loading state
- Status display (pending, processing, completed, failed)
- Executive summary section
- Insights display with categories
- Artifacts download placeholders
- Error state handling

**Implementation Notes**:

- Currently uses mock data for UI scaffolding
- Structure ready for real API integration
- Does not fake deterministic results
- Clearly organized for future engage7-api integration

### 6. Frontend API Layer

**Location**: `lib/api/`

Created lightweight, typed API client ready for engage7-api integration.

**Key Files**:

- `lib/api/config.ts` — API base URL and endpoint configuration
- `lib/api/client.ts` — HTTP client with error handling and timeout
- `lib/api/analysis.ts` — Analysis-specific API functions
- `lib/types/analysis.ts` — TypeScript types for API contracts

**Functions Prepared**:

- `submitAnalysisUpload(file)` — Upload dataset
- `getAnalysisStatus(jobId)` — Poll job status
- `getAnalysisResult(jobId)` — Retrieve complete result
- `downloadArtifact(jobId, artifactId)` — Download PDF/CSV artifacts

**Current State**:

- Functions are scaffolded with mock responses
- Type definitions are production-ready
- Clear TODO comments mark integration points
- Error handling and timeout logic is complete

**Configuration**:

- API URL configured via `NEXT_PUBLIC_API_URL` environment variable
- Defaults to `http://localhost:8000` for development

### 7. Layout Integration

**Location**: `app/layout.tsx`

Updated root layout to integrate providers.

**Changes**:

- Wrapped app with `AppThemeProvider` and `LocaleProvider`
- Added `suppressHydrationWarning` to prevent theme flicker
- Updated metadata to reflect Engage7 product

### 8. UI Components

**Location**: `components/`

Created necessary UI components:

- `components/ui/dropdown-menu.tsx` — Radix UI dropdown menu
- `components/shared/file-upload.tsx` — File upload with drag-and-drop
- `components/shared/locale-switcher.tsx` — Language switcher
- `components/shared/theme-switcher.tsx` — Theme toggle

## Code Quality

- Production-quality TypeScript with strong typing
- Clear file organization and module structure
- No dead code or unnecessary dependencies
- Lightweight implementation avoiding premature complexity
- Comprehensive inline documentation

## Repository Safety

**Preserved**:

- Vercel deployment configuration
- Next.js App Router structure
- GitHub integration workflow
- Existing visual identity (colors, logo, images, effects)

**Minimal Changes**:

- No changes to `package.json` (all dependencies already present)
- No changes to `next.config.mjs`
- No changes to root configuration files

## Testing Recommendations

Before deployment:

1. Test locale switching and persistence
2. Test theme switching and persistence
3. Verify file upload UI (mock backend)
4. Check responsive design on mobile
5. Verify all routes render correctly
6. Test dark/light theme on all pages

## Integration Next Steps

### Backend Integration (engage7-api)

When engage7-api is ready:

1. Update `NEXT_PUBLIC_API_URL` in `.env.local` or deployment environment
2. Replace mock implementations in `lib/api/analysis.ts` with real API calls
3. Add authentication headers if needed
4. Implement proper error handling for specific API error codes
5. Add retry logic for transient failures
6. Implement polling logic for job status in result page

### File Upload Enhancement

When backend is integrated:

1. Add progress tracking during upload
2. Implement chunked upload for large files
3. Add server-side validation feedback
4. Implement proper error messages from API

### Result Page Enhancement

When backend is integrated:

1. Implement real-time polling for job status
2. Add WebSocket support for live updates (optional)
3. Implement artifact download with proper authentication
4. Add export functionality for insights

## Important Placeholders

### API Integration Points

Marked with `// TODO:` comments in:

- `lib/api/analysis.ts` — All API functions
- `app/analyze/page.tsx` — Upload submission
- `app/result/[jobId]/page.tsx` — Result fetching

### Environment Variables

Required for production:

```bash
NEXT_PUBLIC_API_URL=https://api.engage7.com
```

## Technical Decisions

### i18n Implementation

**Decision**: Lightweight custom implementation instead of heavy framework (e.g., next-intl)
**Rationale**:

- Only 3 locales needed
- Simple deterministic mapping rules
- Avoids unnecessary complexity and bundle size
- Full type safety with TypeScript

### Theme Implementation

**Decision**: Wrap next-themes with product-specific semantics
**Rationale**:

- Reuse existing CSS dark mode implementation
- Maintain "black" naming to align with Windows app
- Avoid visual redesign
- Preserve CSS custom properties approach

### API Client

**Decision**: Custom fetch-based client instead of library (e.g., axios, react-query)
**Rationale**:

- Lightweight with no additional dependencies
- Full control over error handling
- Native fetch is sufficient for requirements
- Easy to add features later if needed

### Form Handling

**Decision**: Native React state instead of form library
**Rationale**:

- Simple upload form with minimal validation
- Avoids library overhead
- Easy to migrate to react-hook-form later if needed

## Known Limitations

1. **No server-side rendering** — Providers require client-side initialization
2. **Mock API responses** — All analysis functions return static data
3. **No authentication** — Not yet integrated (future requirement)
4. **Client-side validation only** — Backend validation required for security
5. **No real file processing** — Upload simulation only

## Maintenance Notes

### Adding New Locales

To add a new locale:

1. Add locale code to `SUPPORTED_LOCALES` in `lib/i18n/config.ts`
2. Add mapping rule in `mapLocale()` function
3. Create dictionary file in `lib/i18n/dictionaries/`
4. Import and add to `dictionaries` record in `lib/i18n/dictionaries/index.ts`

### Adding New Dictionary Keys

1. Add key to `en-IE.ts` dictionary
2. Add same key to all other locale dictionaries
3. TypeScript will enforce consistency via `Dictionary` type

### Modifying Theme

1. Theme names defined in `lib/theme/config.ts`
2. CSS custom properties defined in `app/globals.css`
3. Mapping between product theme and CSS class in `themeToCSSClass()`

## Vercel Deployment

This implementation is fully compatible with existing Vercel deployment:

- No build configuration changes
- All routes are static or client-side
- Environment variables can be set in Vercel dashboard
- Analytics integration preserved

## Summary

Sprint 8 successfully delivers:
✅ Multilingual support (3 locales)
✅ Theme support (light/black)
✅ Repositioned homepage
✅ Product entry page at `/analyze`
✅ Result page shell at `/result/[jobId]`
✅ Clean API integration layer
✅ Full compatibility with existing deployment
✅ Preserved visual identity
✅ No deterministic logic in frontend

The implementation is production-ready for frontend functionality and scaffolded for seamless engage7-api integration.
