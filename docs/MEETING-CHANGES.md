# Public UX meeting changes — 11 November 2026

## Implemented in the public preview

| Request | Implementation |
| --- | --- |
| Institution and state-level discovery | Separate institution, administrative scope and geographical fields; explicit unknowns retained in data. Scope is not inferred from the university/health sector or postal address alone. |
| Simpler public filters | Seat groups and tests removed; unresolved access/status/qualification options omitted, records still included in All. Legacy URL facets are cleared so no invisible filter persists. Qualification itself stays: the transcript did not clearly ask to remove it. |
| Two clear category names | Canonical display/search families; exact official designation preserved, ambiguous categories visibly qualified rather than silently certified. |
| Sources first | Bases/documents, deadline, requirements, dates, syllabus, final summary. Existing documents are not removed or rewritten. |
| Comparator visibility | Main-menu counter, explicit Add to comparator action, limit of three and direct X removal without a management step. |
| Mobile map results | Same results below map, jump link and selected marker scrolling to its row. Switching to List remains available. |
| Navigation and FAQs | Four primary destinations; informational FAQs at page bottom. Guide/AGE URLs retained, not deleted. Public official brand links verified. |
| Search in preparation | Search process references by municipality, organism and body; do not imply that every record already has generated material. |
| Follow action | Visible bell near detail heading with explicit demo warning. No real subscription is activated. |

## Conservative interpretation of ambiguous meeting notes

- “Todos” is the absence of a filter, not a new record status and not an assertion that unknown access is free entry.
- “Estatal” is administrative scope, not a personal eligibility requirement.
- “Duración” was interpreted as the existing qualification field: only its unresolved option is removed.
- Remove Guías, Desde AGE and Superadmin from the primary menu; preserve useful pages and source information. The body guide choices remain prominent, and general explanatory cards are replaced with FAQs.
- Brand links point to Supera and Patrio, not Patreon.

## Follow-up / nurturing — proposed integration contract, not activated

1. A user explicitly follows an identified process, chooses a channel and confirms consent. Do not start a generic campaign just because they view a municipality.
2. Detect a verified event: opening/correction of the application window, provisional/final lists, exam schedule, answer key, results or resolution. Changes to a requested programme may also affect the content journey separately.
3. Event identity must include process ID, publication identity and version/hash. Retry without sending the same event twice. A daily check with no meaningful change sends nothing.
4. Notify only followers of the affected process. Distinguish operational notices from commercial content; frequency, urgent events, quiet hours and templates need product/marketing approval.
5. Provide pause/unsubscribe, delivery status and failure handling; never include candidate lists or unnecessary personal data in notifications.
6. Integration acceptance must cover changed/removed publications, duplicate events, late discovery, opted-out users, stale deadlines, provider failure and replay after restart.

No provider, automated sending, backend schema or budget is approved by this frontend release. Existing backend owners must provide the actual integration contract. Full catalogue source/document verification and human visual approval remain separate dependencies.

## Regression checks

Run type check, static build and marketing tests. Test 320, 375/390, 768, 1024 and 1440 widths: map → marker → visible record link; list/map switching; filters and empty states; add three, remove directly, reload; original document links and hashes; preparation search; FAQ toggles; no horizontal overflow or real submissions. Preview failures are not evidence that the scraper/database is running.
