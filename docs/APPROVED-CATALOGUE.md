# Approved catalogue integration
## Boundaries
This change concerns the separate marketing demo, not the default branch or original application. It reuses the existing administrator approval/publication circuit. A scraped or edited row is not automatically public. Public catalogue and lead capture remain separate: forms still simulate, no emails or CRM calls.

## Contract
Version 1 envelope: schemaVersion, revision, generatedAt, records and coverage.
Stable public IDs are OPO-<catalogue-id>. Public URLs use the stable ID, not mutable municipality/category text.
Records preserve nullable seats and dates, type, official category, process state and application status separately. Documents retain multiple approved URLs. Coordinates are explicit or null; missing coordinates never remove the unfiltered list row.
No source sheet rows/links, personal records, review comments, credentials or job payloads are exposed.

## Approval and frozen records
Use only publications with an accredited approval, tenant and catalogue lineage. A false synchronization flag can protect an already published record: it is not an exclusion flag.
Do not enrich a frozen catalogue record by joining current origin links. Until an approved document-version snapshot exists, show only information already published in the catalogue and mark missing document types honestly.
The first real approved read has one record; this is not the whole DWH and not proof of completeness. Legacy ambiguous type/status/deadline data stays unverified.

## Frontend
VITE_CATALOGUE=approved enables runtime reads. VITE_APPROVED_CATALOGUE_URL is a public read-only endpoint URL, never a secret, administrator JWT or database URI. Without it, local preview expects /api/public/v1/catalogue.
The app starts with no records, fetches immediately, refreshes every five minutes and offers a manual refresh. Valid empty, loading and error are distinct. Failed requests never fall back to sample data; the last approved response may remain visible with an explicit warning and timestamp.
Immutable responses update facets, counts, comparison, metadata and routes. Sample editorial enrichments and old coordinates are disabled. Saved IDs are not discarded while loading or after a transient failure.
Approved builds contain no sample records. Information pages remain noindex. The demo's SPA fallback supports direct navigation to new stable IDs; production SEO/SSR publication remains a separate decision.

## Checks
- npm run check:marketing
- npm run build:marketing && npm run test:marketing (original sample regressions)
- npm run build:approved && npm run test:approved (approved runtime contract/client)
- Browser QA: real approved source, direct detail reload, empty, removal, outage, recovery, comparison/saved selections, map without invented coordinates, five responsive widths.
- Backend publication/freeze/read projection tests run in the private backend module, not this public repository.
No mass approval or production administrator action is part of these tests.

## Deployment
On 16 November 2026 the isolated read endpoint was explicitly authorized, activated by EELL and verified against the frontend contract. The shared review demo is now deployed as Sites v12 and reads the live approved catalogue. No laptop bridge or database credentials are used by the published frontend. The former 30-record sample is not a fallback in this mode.
Export only the public build with scripts/export-approved-preview.mjs. Preserve Site identity and audience. Never copy the original application tree, environment files, backend SQL or private QA artifacts into Sites.
The exporter verifies the exact declared public API URL and rejects internal URLs, sample records or credentials. Use a new branch; do not merge into master.

## Hosted validation — 16 November 2026
Frontend checks: TypeScript, 57 sample regressions and 18 approved/client/export tests pass. Real browser on the hosted v12: catalogue, stable direct detail URL/reload, manual refresh, saved records and comparison; nine responsive traversals (390/768/1440) without page overflow or internal Sheets links, and no observed JavaScript errors. Controlled error/empty/recovery was repeated only in a local QA transport proxying the real endpoint; the database was never forced offline.

Only one approved record is currently returned. Approval is not documentary verification or proof of catalogue completeness. A generic portal must not be displayed as an approved programme link; missing programmes stay explicitly missing. Admin approval writes were tested separately in ephemeral PostgreSQL, not performed on real records during this validation. Lead capture and content generation remain simulated/unconnected.
