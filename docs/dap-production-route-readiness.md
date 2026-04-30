# DAP Production Route Readiness Plan

**Document status:** Phase 9E complete — read-only review queue at /preview/dap/requests; production /request page is NOT yet live  
**Last updated:** 2026-04-29  
**Phase:** 9E  
**Prerequisite phases complete:** 7D, 7E, 7F, 7G, 8A, 8B, 8C, 9A, 9B, 9C, 9C-B, 9D, 9E

---

## 1. Current Preview Routes

All current DAP routes are under `/preview/`. None are indexed. None are production.

| Preview path | Page kind | SSG? | Content source |
|---|---|---|---|
| `/preview/dap` | Homepage | No | `getHomepageHeroModel()` |
| `/preview/dap/[city]` | City page | Yes (21 slugs) | `exportDapCmsSnapshot().cities` |
| `/preview/dap/dentists/[slug]` | Dentist page | Yes (10 slugs) | `exportDapCmsSnapshot().dentistPages` |
| `/preview/dap/decisions/[slug]` | Decision page | Yes (30 slugs) | `exportDapCmsSnapshot().decisionPages` |
| `/preview/dap/treatments/[slug]` | Treatment page | Yes (11 slugs) | `exportDapCmsSnapshot().treatmentPages` |
| `/preview/dap/request` | Request flow | No | `getRequestFlowModel()` |
| `/preview/dap/request/confirmation` | Confirmation | No | Static copy |
| `/preview/dap/cms-snapshot` | CMS audit | No | `exportDapCmsSnapshot()` |
| `/preview/dap/design` | Design gallery | No | All compositions |
| `/preview/dap/requests` | Request queue | No | `listDapRequests()` (live Supabase) |
| `/preview/dap/requests/[id]` | Request detail | No | `getDapRequest()` + `getDapRequestEvents()` (live Supabase) |

**Total:** 12 `page.tsx` files (10 original + 2 Phase 9E review pages). 81 static pages + 2 dynamic review pages.

**Route boundary enforcement:** `lib/cb-control-center/dapPhase7G.test.tsx` Group 1 locks this to exactly 10 files. Any production route addition requires updating that test intentionally.

---

## 2. Future Production Route Candidates

Recommended URL structure for production. These routes do not exist yet.

| Page kind | Recommended production path | Notes |
|---|---|---|
| Homepage | `/dental-advantage-plan` | Could also be `/` if this becomes the primary product |
| City page | `/dentists/[city]` | e.g. `/dentists/san-diego` |
| Dentist page | `/dentists/[city]/[practice-slug]` | e.g. `/dentists/san-diego/gaslamp-dental-group` |
| Decision page | `/guides/[slug]` | e.g. `/guides/dap-vs-dental-insurance` |
| Treatment page | `/treatments/[slug]` | e.g. `/treatments/dental-implants` |
| Search results | `/search` | Dynamic; not SSG |
| Request flow | `/request` | Blocked until Tier 3 backend ready |
| Request confirmation | `/request/confirmation` | Blocked with request flow |

**Rejected alternatives:**
- `/locations/[city]` — "locations" implies a directory of offices, not a DAP availability page
- `/compare/[slug]` — "compare" alone lacks DAP context; `/guides/` works better for AEO/SEO
- `/dentist/[slug]` — flat slug loses city hierarchy, makes deduplication harder at scale

---

## 3. Routes That Must Remain Preview-Only

Some routes should never be promoted to production, or can only be promoted after specific conditions are met.

| Route | Reason must stay preview-only |
|---|---|
| `/preview/dap/design` | Design gallery — internal review surface only. No user-facing purpose. |
| `/preview/dap/cms-snapshot` | Internal CMS audit page. Contains raw data not suitable for public display. |
| `/preview/dap/request` | Blocked until Tier 3 backend is implemented and tested. See Section 9. |
| `/preview/dap/request/confirmation` | Blocked with request flow. Confirmation without a real submission is misleading. |

The design gallery and CMS snapshot route should eventually be removed or moved behind authentication, not promoted.

---

## 4. Launch Sequence

### Tier 1 — Safe Informational Launch

**Eligible immediately (no backend required).**

Routes in Tier 1 contain no form submission, no practice-specific claims, and no enrollment CTAs.

| Production path | Page kind | Safety gate |
|---|---|---|
| `/dental-advantage-plan` | Homepage | No enrollment CTA; no guaranteed savings claims |
| `/guides/[slug]` (30 slugs) | Decision pages | `impliesPricing: false`; no enrollment |
| `/treatments/[slug]` (11 slugs) | Treatment pages | `impliesGuaranteedPricing: false`; no enrollment |

**Tier 1 prerequisite checklist:**
- [ ] SEO metadata (title, description, canonical) implemented per Section 6
- [ ] `noindex` removed per Section 7
- [ ] All Phase 8B messaging tests pass
- [ ] No universal availability claims in rendered output
- [ ] No enrollment or join CTAs present (search/request CTAs only)

### Tier 2 — Directory Launch

**Requires confirmed data to be accurate.** City and dentist pages make specific factual claims about which practices are confirmed DAP participants.

| Production path | Page kind | Safety gate |
|---|---|---|
| `/dentists/[city]` (21+ slugs) | City pages | Confirmed count is accurate; `impliesUniversalAvailability: false` |
| `/dentists/[city]/[practice-slug]` | Dentist pages | Practice status verified; `isPublic: true`; template correct |

**Tier 2 prerequisite checklist:**
- [ ] Real confirmed-provider data sourced from live database (not snapshot)
- [ ] Availability state reflects current confirmed status, not stale CSV data
- [ ] No `unavailable_internal_only` practice appears in public output
- [ ] `not_confirmed` and `requested` pages carry correct non-enrollment CTAs
- [ ] Search results page (`/search`) implemented with real provider lookup
- [ ] All Phase 7D availability state tests pass against live data

### Tier 3 — Request Flow Launch

**Requires backend submission, consent logging, and practice outreach workflow. This tier cannot ship without explicit backend implementation and test coverage.**

| Production path | Page kind | Safety gate |
|---|---|---|
| `/request` | Request form | Backend implemented; consent logged; tests cover submission |
| `/request/confirmation` | Confirmation | Real submission confirmed before showing this page |

**Tier 3 prerequisite checklist:**
- [ ] `POST /api/dap/request` route implemented and covered by integration tests
- [ ] Consent checkbox is required — form cannot submit without `consentToContact: true`
- [ ] Consent record written to database with timestamp and IP
- [ ] No practice is contacted without a logged consent record
- [ ] Practice outreach workflow (email or CRM task) is implemented
- [ ] Rate limiting and abuse prevention are implemented
- [ ] `DapRequestFlowPreview` preview banner removed and replaced with live form
- [ ] `RequestDentistForm` (deprecated) deleted
- [ ] Phase 7G Group 3 tests updated: now assert `<form` IS present and `fetch` IS called
- [ ] Confirmation page only reachable via POST redirect (not directly navigable)

---

## 5. Route-Level Data Source Requirements

| Page kind | Current data source | Required for production |
|---|---|---|
| Homepage hero | `getHomepageHeroModel()` — static | Static is fine; no dynamic data needed |
| City pages | `exportDapCmsSnapshot().cities` — snapshot | Live database query by city slug |
| Dentist pages | `exportDapCmsSnapshot().dentistPages` — snapshot | Live database query by practice slug; real-time availability status |
| Decision pages | `exportDapCmsSnapshot().decisionPages` — static content | Can remain static; ISR or full SSG at build time |
| Treatment pages | `exportDapCmsSnapshot().treatmentPages` — static content | Can remain static |
| Search results | Not yet implemented | Supabase `practices` table query with geolocation or city filter |
| Request flow | No backend | `POST /api/dap/request` endpoint with consent logging |
| City availability summary | `getCityAvailabilitySummary()` — computed from snapshot | Computed from live confirmed count per city |

**Production data principle:** Pages that make specific factual claims (confirmed count, specific dentist status) must be backed by live or frequently-refreshed data. Pages that are purely educational (decision, treatment) can be SSG.

---

## 6. SEO Metadata Rules

Each production page type requires a `generateMetadata()` export with the following fields:

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | Unique per page. No "DAP available everywhere" framing. |
| `description` | Yes | 150–160 chars. Should answer patient intent directly. |
| `canonical` | Yes | Self-referencing canonical. Must match production URL. |
| `openGraph.title` | Yes | Same as `title` or slightly more conversational |
| `openGraph.description` | Yes | Same as `description` |
| `openGraph.type` | Yes | `"website"` |
| `robots` | Conditional | See Section 7 |

**Title patterns by page kind:**

- Homepage: `"Dental Advantage Plan — Find Participating Dentists Near You"`
- City page: `"DAP Dentists in {City} | Dental Advantage Plan"`
- Dentist page (confirmed): `"{Practice Name} — Confirmed DAP Provider in {City}"`
- Dentist page (not confirmed): `"Request DAP at {Practice Name} in {City}"`
- Decision page: `"{Page Title} | Dental Advantage Plan"`
- Treatment page: `"{Treatment} and Dental Advantage Plan | DAP"`

**Forbidden title patterns:**
- "All dentists in {city} accept DAP"
- "DAP available everywhere in {city}"
- "Guaranteed savings at {practice}"
- "Join DAP at {practice}" (unless confirmed AND gates unlocked)

---

## 7. noindex and Canonical Rules

### Routes that must carry `noindex` until production promotion:

All current preview routes carry `noindex` implicitly because they are not in the production domain. When promoted, the following rules apply:

| Route type | noindex policy | Canonical policy |
|---|---|---|
| Design gallery (`/preview/dap/design`) | `noindex` permanently | No canonical — internal only |
| CMS snapshot (`/preview/dap/cms-snapshot`) | `noindex` permanently | No canonical — internal only |
| Homepage | Remove `noindex` at Tier 1 launch | Self-canonical |
| Decision pages | Remove `noindex` at Tier 1 launch | Self-canonical |
| Treatment pages | Remove `noindex` at Tier 1 launch | Self-canonical |
| City pages | Remove `noindex` at Tier 2 launch | Self-canonical |
| Dentist pages | Remove `noindex` at Tier 2 launch | Self-canonical |
| Search results | `noindex` — dynamic, low-SEO value | Canonical → city page or homepage |
| Request flow | `noindex` — transactional, not SEO target | Canonical → homepage or city page |
| Request confirmation | `noindex` — transactional | Canonical → homepage |

### Duplicate-content protection:

- City pages and dentist pages should carry `rel="canonical"` pointing to the production URL.
- If a preview route is ever accessible at the same time as a production route, the preview must carry `noindex` and a canonical pointing to the production URL.
- Avoid generating multiple URLs for the same city (e.g. `/dentists/san-diego` and `/dentists/san_diego`). Slugs must be normalized on write.

---

## 8. Safety Gates Before Route Promotion

Before any route is promoted from preview to production, all of the following must pass:

### Universal safety gates (all tiers):

- [ ] **No universal availability claim** — rendered HTML must not match `/every dentist|all dentists|any dentist|universally available/i`
- [ ] **No guaranteed savings claim** — rendered HTML must not match `/savings guaranteed|you will save \$|prices are fixed/i`
- [ ] **No guaranteed pricing claim** — `data-implies-guaranteed-pricing` must be `"false"` on any savings-education section
- [ ] **No insurance misclassification** — DAP is never described as insurance in rendered output
- [ ] **No unconfirmed provider shown as confirmed** — only practices with `availabilityState === 'confirmed'` may carry the "DAP confirmed" badge
- [ ] **Route boundary test updated** — Phase 7G Group 1 test updated to include the new production route
- [ ] **SEO metadata implemented** — `generateMetadata()` present, no forbidden title patterns
- [ ] **TypeScript passes** — `npx tsc --noEmit` exits clean
- [ ] **Full test suite passes** — `npx vitest run` all green

### Tier 2 additional gates:

- [ ] Live data source confirmed — page is backed by a database, not a snapshot
- [ ] `unavailable_internal_only` practices are excluded at the data layer, not just the UI layer
- [ ] Availability state transitions are tested against live data (not mock)
- [ ] Search results page handles the empty-results state with the growth loop (not a dead end)

### Tier 3 additional gates:

- [ ] `POST /api/dap/request` integration test passes against a real (test) database
- [ ] Consent record write is tested
- [ ] Form submission without `consentToContact: true` returns a 400
- [ ] Practice outreach is not triggered without consent
- [ ] Rate limit tests exist and pass
- [ ] `DapRequestFlowPreview` preview banner has been removed from production path

---

## 9. Backend Dependencies

### Tier 3 (Request Flow) requires all of the following before launch:

**Database schema:**
- `dap_requests` table: `id`, `request_type`, `location`, `dentist_name` (nullable), `name`, `email`, `phone`, `consent_to_contact`, `consented_at`, `ip_address`, `created_at`
- `dap_request_events` table for outreach tracking: `request_id`, `event_type`, `practice_id` (nullable), `occurred_at`

**API surface:**
- `POST /api/dap/request` — accepts `DapRequestFormPayload`, validates consent, writes to `dap_requests`, triggers outreach event
- Response: `201 Created` with `{ requestId }` on success; `400` if consent missing; `429` if rate limited
- No response should expose internal practice status or CRM state

**Third-party integrations:**
- Outreach email or CRM task creation (implementation TBD — could be Resend, Supabase Edge Function, or direct CRM webhook)
- No practice contact is triggered without a `consent_to_contact: true` record in the database

**Consent requirements:**
- `consentToContact` checkbox is required — form validation blocks submission if unchecked
- The exact consent language shown to the patient must be recorded at submit time
- Consent record must be retained for compliance purposes

**Monitoring:**
- Alert if `dap_requests` insert fails
- Alert if outreach trigger fails after consent is logged (so no silent loss of requests)

### Canonical request form surface:

The canonical implementation surface is `DapRequestFlowPreview` (Phase 7E). See `docs/dap-request-flow-canonical.md` for the full Phase 8B handoff checklist.

`RequestDentistForm` (in `components/dap-preview/`) is deprecated and must be deleted before Tier 3 launch.

---

## 10. Rollback Plan

### Tier 1 rollback:

- Revert the `generateMetadata()` changes and add `noindex` back to the affected routes.
- Or: redeploy the previous build via Vercel.
- Tier 1 pages are static and have no database writes, so rollback has no data consequences.

### Tier 2 rollback:

- Revert the production route files. The underlying data (Supabase) is read-only from the page layer, so no data needs to be rolled back.
- If a city or dentist page incorrectly showed a practice as confirmed, a rollback gets it off the production domain, but any Google-indexed version may persist until recrawled. Mitigate by:
  - Sending a `noindex` response on the rolled-back route
  - Using Google Search Console to request de-indexing of specific URLs

### Tier 3 rollback:

- Remove the `POST /api/dap/request` route handler.
- Restore the `DapRequestFlowPreview` preview banner state.
- **Data note:** Any requests already submitted and logged in `dap_requests` remain in the database. Do not delete them. Disable outreach triggers but keep consent records.
- If outreach emails were already sent to practices, a rollback does not undo those emails. The practice contact team must be notified manually.

### Rollback decision authority:

- Tier 1 rollback: can be executed by any engineer, no approval required.
- Tier 2 rollback: requires lead review if it involves a city or dentist page that was indexed.
- Tier 3 rollback: requires confirmation that no pending consent-triggered outreach is in flight before the API route is removed.

---

## Phase 9B — Tier 1 Production Launch (Complete)

**Date:** 2026-04-29  
**Phase:** 9B

### Routes promoted to production

| Route | Page kind | SSG | Source |
|---|---|---|---|
| `/dental-advantage-plan` | Homepage | No | `getHomepageHeroModel()` + section models |
| `/guides/[slug]` | Decision/guide pages | Yes (30 slugs) | `exportDapCmsSnapshot().decisionPages` |
| `/treatments/[slug]` | Treatment education | Yes (11 slugs) | `exportDapCmsSnapshot().treatmentPages` |

**New files created:**
- `app/dental-advantage-plan/page.tsx` + `layout.tsx`
- `app/guides/[slug]/page.tsx` + `app/guides/layout.tsx`
- `app/treatments/[slug]/page.tsx` + `app/treatments/layout.tsx`

### Route inventory after Phase 9B

- **Total page.tsx files:** 13 (10 preview + 3 production Tier 1)
- **Preview routes unchanged:** all 10 remain at `/preview/dap/...`
- **New production routes:** 3 route files → 42 new SSG/static pages
- **Build page count (estimated):** 126 = 5 layouts + 8 non-SSG + 113 SSG slugs

### Metadata policy

- Root `app/layout.tsx` sets `robots: "noindex, nofollow"` (all routes inherit)
- Production layouts override with `robots: "index, follow"`
- Preview layouts inherit root noindex — unchanged
- `generateMetadata()` on guide/treatment pages pulls `seoTitle` and `seoDescription` from CMS records

### Safety enforcement

- Homepage CTAs point to existing guide pages — no links to `/search` or `/request` (not yet live)
- `showPreviewLabel={false}` on production homepage hero — no preview label rendered
- `data-implies-universal-availability="false"` on homepage root element
- `data-implies-pricing="false"` on all guide pages
- `data-implies-guaranteed-pricing="false"` on all treatment pages
- No new business logic added to route files — all UX models from Phase 7D/7E/7F functions

### Still preview-only (unchanged)

- `/preview/dap/design` — design gallery, always preview-only
- `/preview/dap/cms-snapshot` — CMS audit tool, always preview-only
- `/preview/dap/request` — request flow preview, preview until Phase 9C
- `/preview/dap/request/confirmation` — confirmation preview, preview until Phase 9C
- `/preview/dap/[city]` — city directory, Tier 2 (live data required)
- `/preview/dap/dentists/[slug]` — dentist detail, Tier 2

### Why directory routes are deferred

The city and dentist directory routes (`/dentists/[city]`, `/dentists/[city]/[slug]`) require:
1. Live provider participation data (who has confirmed DAP?)
2. Provider status freshness checks (confirmed = signed agreement on file)
3. Admin review gate before public display of confirmed status

Publishing these routes from mock data would present unverified participation claims as facts.

The request and submission routes (`/request`, `POST /api/dap/request`) require:
1. The database migration for `dap_requests` and `dap_request_events`
2. A working API route with consent validation
3. The `DapRequestFlowPreview` to be un-disabled (form becomes live)

### Phase 9C — Tier 3 backend foundation (complete)

Phase 9C implemented the backend layer. Tier 3 public request page is still NOT live.

**Delivered:**
- `supabase/migrations/20260429000000_dap_requests.sql` — `dap_requests` + `dap_request_events` tables with DB-level consent and no-PHI constraints
- `lib/cb-control-center/supabaseClient.ts` — lazy-init service-role Supabase admin client
- `lib/cb-control-center/dapRequestPersistence.ts` — createDapRequest, createDapRequestEvent, findDuplicateDapRequest, sanitizeDapRequestForConfirmation
- `app/api/dap/requests/route.ts` — `POST /api/dap/requests` (validation + consent gate + dedupe + event log)

**Still blocked (Tier 3 is NOT live):**
- No public `/request` page exists — `app/request` directory does not exist
- Rate limiting is a placeholder stub — must be implemented before the request page ships
- `DapRequestFlowPreview` is not wired to the API — the form remains a design preview
- No CRM, GHL, email, or outreach automation is connected

**Next (Phase 9D+):**
1. Wire `DapRequestFlowPreview` component to `POST /api/dap/requests`
2. Implement real rate limiting (Upstash or similar)
3. Create the public `/request` page — this is the Tier 3 launch gate
4. Integration phases (CRM, admin dashboard) follow after request flow is stable
