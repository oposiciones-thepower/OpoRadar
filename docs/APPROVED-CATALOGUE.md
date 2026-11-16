# Published catalogue and approval provenance
## Scope
This is the separate public OpoRadar experience. Changes stay on the isolated review branch/PR; no merge to master, original application source or DNS cutover is implied. Publication data changes in the shared catalogue were explicitly authorized; pending research rows are not automatically public.

## Contract and the legacy catalogue correction
The live endpoint uses schemaVersion 2; the frontend remains able to read version 1 during rollout. Records carry publicationStatus: admin_approved or legacy_catalogue.
- admin_approved has real approvedAt and approvalVersion.
- legacy_catalogue has null approval metadata: absence of a row in the new approval ledger does not make an already published legacy catalogue entry a draft.
- verifiedAt is independent and stays null without documentary verification.
coverage.totalRecords, adminApprovedRecords and legacyRecords must reconcile with the actual response. Public IDs remain OPO-<catalogue-id>, with stable detail URLs.

The original new-ledger-only gate wrongly reduced 868 existing Supera catalogue records to one. This was an integration error, not lost records. The corrected read projection selects the existing Administrative/Auxiliary catalogue and accredited new publications. It does not invent origin lineage, duplicate the old catalogue or join pending source links into frozen publications.

On 16 November 2026 a protected approval operation added 40 eligible new publications: the Supera catalogue became 908 (41 with recorded admin approval, 867 legacy). The other 75 additional candidates and previously excluded, duplicate or mapper-blocked cohorts were not mass-published. These are dated operational counts, not a completeness certificate.

## Public fields and documents
The server projects a public allowlist, not review notes, source sheet rows, student data, jobs or credentials. Published seats and dates remain nullable; process state and application window are separate. A past deadline does not prove that the whole selection process is finished.
Only documentary URLs present in the published catalogue are exposed. The existing publisher does not freeze all source JSONB links; missing programme/list/result links are not completed by joining current pending research. A generic portal is not labelled as an approved programme.
Publication approval is not a fresh audit of requirements, documents, deadline, exam or destination.

## Geographic references
Explicit valid catalogue coordinates take precedence. Otherwise the map uses the official public IGN/ANE municipality reference, derived from NGMEP, with 8,132 entries.
Match municipality name plus province, require a unique official reference and allow controlled accent/language variants. No fuzzy town matching, national-name-only fallback, guessed capital, or use of internal database IDs as INE codes.
Coordinates are approximate municipal references, not examination sites or destinations of the vacancies. Unknown/ambiguous records remain in the unfiltered list and are excluded only when a geographic area is applied.
The 908-record validation resolved 653 records; 255 remained unlocated. This is geographic-reference coverage, not documentary verification.
Source, retrieval metadata, original SHA256 and CC BY 4.0 attribution are kept in data/municipality-reference.json and public/licenses/municipality-reference.txt. Attribution is visible on the map.

## Public release
npm run build:public enables VITE_CATALOGUE=approved and VITE_PUBLIC_RELEASE=production. VITE_APPROVED_CATALOGUE_URL is the declared public read endpoint, never a secret, administrator JWT or database URI.
The public build removes review/sandbox notices, fake email collection, simulated follow/preparation requests, review metrics and the disconnected student route. It does not make inactive integrations appear operational.
Search, comparison, browser-local saved records, published sources and real geographic filtering remain functional. Training links lead to the actual Supera website without sending form data from this application.
CRM, automated notices, accounts and content generation are separate integrations; they are not activated by removing copy.

## Runtime and deployment
Read immediately, refresh every five minutes and on request. Loading, valid empty and failure are different. Failed reads never substitute the old sample. The last valid catalogue response may remain visible only with an explicit failure notice and consultation timestamp.
Use the existing Sites project and audience, with SPA fallback for stable new IDs. Export only the public build with scripts/export-approved-preview.mjs; do not copy private backend SQL, credentials or approval backups.
The shared review origin remains non-indexable until an explicitly coordinated official-domain/SEO cutover. Removing review copy is not authorization to replace the original domain. Least-privilege credentials and public-traffic protections are infrastructure work, not solved by UI wording.

## Verification
- npm run check:marketing
- npm run build:marketing && npm run test:marketing: 57 legacy regressions
- npm run build:public && npm run test:approved: contract/client/export and municipality-reference tests
- npm run test:public: rendered public routes contain no sandbox copy, fake collection or disconnected review routes
- Real browser: catalogue, stable direct details, legacy/new provenance, comparison/saved selections, markers, drawing a containing/excluding zone, URL persistence, mobile map/list and failure/recovery in a local controlled proxy only.
No new real admin approvals are created by frontend tests; backend approval receipts and database tests remain in the private backend project.


## Public release build guard

Set `VITE_APPROVED_CATALOGUE_URL` to the isolated public read endpoint when running `npm run build:public`. The build rejects missing or undeclared endpoints; export also requires that the declared API is wired into the browser JavaScript. This prevents a static host from accidentally requesting an absent same-origin `/api/public/v1/catalogue` route.
