# OpoRadar — public marketing preview

Public information frontend, separate from the existing production application and backend. Default build: 30 real public sample records, snapshot 13 October 2026; not an up-to-date national catalogue. Preview is public, requests no indexing and keeps capture/tracking forms simulated.

## Run and verify

```sh
npm ci
npm run check:marketing
npm run build:marketing
npm run test:marketing
npm run serve:marketing
```

The static server uses port 4173 by default; set `PORT` if needed. `npm run dev:marketing` starts Vite. Keep marketing work separate from `master`: the current marketing entrypoint replaces the private application's entrypoint on this branch only. Do not merge or deploy it to production without reviewing the entrypoints and integration.

## Included

- Spain-only list/map catalogue, municipal reference points, polygon drawing, viewport search, URL filters, sorting and pagination. Coordinates are not exam venues. Territorial SVG map includes islands and autonomous cities; counts represent sample records.
- Simplified navigation: Convocatorias, Por localidad, Preparar and Comparador. Existing guide and AGE pages retain their URLs but are not main-menu destinations.
- Separate location, institution type and administrative scope filters. Unknown facts remain in the data and are included in “Todos”; they are never relabelled as known access or jurisdiction. Internal seat-group/test filters are not shown to candidates.
- Canonical search/display families Administrativo and Auxiliar Administrativo, while retaining the exact official category on each detail page and flagging ambiguous classifications.
- Documents/bases before deadlines, requirements, phases, syllabus and final summary. Every existing source URL and record ID is preserved. Explicit follow button opens only a demo dialog.
- Comparator for up to three records: visible add action, counter, direct removal, responsive criterion cards, highlighted differences and labelled desktop table. No difficulty scoring or eligibility promises.
- Preparation search over process references, not a fabricated inventory of generated courses. Content production remains on demand.
- Footer FAQs and verified links to Supera and Patrio. Legacy editorial content remains accessible by its existing routes.
- Readability, contrast, focus states and touch-target improvements from the prior UX release.

## Source layout

- `src/public-site/PublicSite.tsx`: routes, layout, shared browser-local preferences.
- `CatalogueExplorer.tsx`, `GeoSearchMap.tsx`, `geo.ts`: list/map and geometric filtering.
- `discovery.ts`: institution/scope classification and presentation helpers; no mutation of records.
- `UX.tsx`: responsive disclosures, deep-link reopening and official deadline action.
- `MeetingExperience.tsx`: preparation search, FAQs and demo follow action.
- `features.tsx`: comparator, evidence, public journeys and demo forms.
- `journey.ts`, `review.ts`, `dates.ts`, `calendars.ts`: evidence, filters, related records and carefully bounded calendar simulation.
- `BodyGuides.tsx`, `TerritoryMap.tsx`, `data/`: guides, territorial geometry and sample data.
- `public-site.css`, `explorer.css`, `ux-improvements.css`, `meeting.css`: established design plus scoped UX changes.
- `scripts/prerender-marketing.mjs`: static route generation; keep noindex enabled for the preview.
- `scripts/export-review-preview.mjs`: sanitized static export for the review hosting, never the private application's full source.

## Boundaries

No new backend, database writes, scraper jobs, real subscriptions, emails, CRM, generated material or production deployment. Saved and compared IDs stay in this browser. Simulator inputs are not submitted or stored as leads. Existing database snapshot mode is legacy/unreviewed in this release; it is not selected for the review demo.

Real follow-up notifications need consent, event/version deduplication, preference and unsubscribe handling, and a verified ingestion integration. See `docs/MEETING-CHANGES.md`. A visual approval and complete accessibility/content audit are still required before candidate-facing production.
