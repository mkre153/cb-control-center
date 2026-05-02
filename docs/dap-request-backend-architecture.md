# DAP Request Backend Architecture

**Phase:** 9E (internal review queue)
**Date:** 2026-04-29  
**Status:** Read-only request review surface live at /preview/dap/requests. Production /request page is NOT yet live.  

---

## 0. Database Ownership

**The database is owned by CB Control Center, not by DAP.**

DAP (Dental Advantage Plan) is a client vertical inside the CB Control Center platform. It does not own a Supabase project. All DAP request data lives in the CB Control Center Supabase project and is scoped via three columns on every row:

| Column | Value for DAP | Purpose |
|---|---|---|
| `client_key` | `dental_advantage_plan` | Which client vertical owns this row |
| `vertical_key` | `dap` | Which product within the client |
| `project_key` | `null` or e.g. `sd-launch` | Optional sub-project scoping |

These columns are injected server-side by the API route from `DAP_REQUEST_SCOPE` — they are never user-supplied. This allows `dap_requests` to eventually serve multiple clients without a schema change.

The public DAP site (`/dental-advantage-plan`, `/guides/*`, `/treatments/*`) is a consumer of CB Control Center data. It does not own workflow state.

---

## 1. What a DAP Request Is

A DAP request is **not enrollment**.

It represents a patient asking the Dental Advantage Plan team to contact a preferred dentist or geographic area about offering DAP — with explicit, recorded consent.

Submitting a request:
- Does not enroll the patient in any plan
- Does not guarantee DAP will be available at the requested location
- Does not guarantee any savings or pricing
- Does not contact any dental office without the patient's consent
- Does not create any legal relationship between the patient and DAP

The request initiates an internal review process. The outcome of that process is external to this system.

---

## 2. Conceptual Data Model

### Table: `dap_requests`

One row per patient request. Status and timestamps evolve as the request moves through the lifecycle.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | Set on insert, never updated |
| `updated_at` | timestamptz | Updated on status change |
| `client_key` | text | CB Control Center scoping: `dental_advantage_plan` for DAP |
| `vertical_key` | text | Product scoping: `dap` |
| `project_key` | text (nullable) | Sub-project scoping; null = no sub-scoping |
| `request_status` | enum | See Section 3 |
| `source_page_kind` | enum | Which page kind originated the request |
| `source_path` | text | Exact URL path at time of submission |
| `city` | text | null if only ZIP provided |
| `zip` | text | null if only city provided |
| `preferred_practice_name` | text | Human-readable; null for area-level requests |
| `preferred_practice_slug` | text | Matches dap_practices.page_slug; null for area-level |
| `treatment_interest` | text | Short label only — no PHI allowed |
| `requester_name` | text | Patient's provided name |
| `requester_email` | text | Normalized to lowercase; null if phone provided |
| `requester_phone` | text | Digits only after normalization; null if email provided |
| `consent_to_contact_practice` | boolean | Practice outreach gate — see Section 5 |
| `consent_to_contact_patient` | boolean | Patient follow-up gate |
| `consent_text` | text | Exact consent copy shown at submission time |
| `consent_timestamp` | timestamptz | When consent was captured |
| `no_phi_acknowledged` | boolean | Patient confirmed no PHI submitted |
| `user_message` | text | Optional freeform note — PHI-scanned before persist |
| `dedupe_key` | text | Stable hash for deduplication — see Section 7 |
| `ip_hash` | text | One-way hash of request IP; null if not captured |
| `user_agent_hash` | text | One-way hash of user agent; null if not captured |

**Constraints (conceptual):**
- At least one of `requester_email`, `requester_phone` must be non-null
- At least one of `city`, `zip` must be non-null
- `consent_text` must be non-empty
- `no_phi_acknowledged` must be true before insert
- `request_status` must satisfy allowed transition rules

---

### Table: `dap_request_events`

Append-only event log. One row per state change or notable action. Status transitions are recorded here, never modified.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `request_id` | uuid | FK → dap_requests.id |
| `event_type` | enum | See Section 4 |
| `event_timestamp` | timestamptz | When the event occurred |
| `actor_type` | enum | `system`, `patient`, `admin`, `practice` |
| `event_note` | text | Human-readable annotation; nullable |
| `metadata_json` | jsonb | Arbitrary structured data; nullable |

**Event invariants:**
- Rows are never updated or deleted
- `consent_captured` events must include a snapshot of `consent_text` in `metadata_json`
- `duplicate_detected` events must include the original `request_id` in `metadata_json`
- `request_closed` events must include a `close_reason` in `metadata_json`

---

## 3. Status Lifecycle

### Allowed Statuses

| Status | Meaning |
|---|---|
| `draft` | Partially filled — not yet submitted |
| `submitted` | Patient submitted with consent; awaiting review |
| `consent_verified` | Consent text and flags confirmed by system |
| `queued_for_review` | Entered manual review queue |
| `practice_outreach_ready` | Consent to contact practice confirmed; ready for outreach |
| `practice_contacted` | Team has reached out to the dental office |
| `practice_declined` | Practice declined to participate |
| `practice_interested` | Practice expressed interest in DAP |
| `provider_onboarding_started` | External onboarding process has begun |
| `provider_confirmed` | Provider signed agreement — set externally, not from request |
| `closed_no_response` | Closed without a response from practice or patient |
| `closed_invalid` | Closed as invalid (spam, test, incomplete) |
| `closed_duplicate` | Closed as duplicate — references original request |
| `closed_user_requested_stop` | Patient requested no further contact |

### Transition Rules

```
draft → submitted
submitted → consent_verified | queued_for_review | closed_invalid | closed_duplicate
consent_verified → queued_for_review | practice_outreach_ready | closed_invalid | closed_duplicate
queued_for_review → practice_outreach_ready | closed_invalid | closed_duplicate | closed_no_response
practice_outreach_ready → practice_contacted | closed_invalid | closed_no_response
practice_contacted → practice_declined | practice_interested | closed_no_response
practice_declined → closed_no_response | closed_user_requested_stop
practice_interested → provider_onboarding_started
provider_onboarding_started → provider_confirmed | closed_no_response
provider_confirmed → (terminal)
closed_* → (terminal)
```

### Status Rules

- `submitted` requires consent (`consent_text` non-empty + at least one consent flag)
- `practice_outreach_ready` requires `consent_to_contact_practice = true`
- `provider_confirmed` cannot be set from request submission alone — requires external onboarding flow
- `closed_duplicate` must reference an original request in the closing event's `metadata_json`
- No status implies enrollment in Dental Advantage Plan
- No status implies guaranteed pricing or savings

---

## 4. Event Lifecycle

### Allowed Event Types

| Event | Triggered by |
|---|---|
| `request_created` | System on successful insert |
| `consent_captured` | System on submission; must snapshot consent_text |
| `request_validated` | System after validation passes |
| `duplicate_detected` | System deduplication check |
| `queued_for_manual_review` | System or admin |
| `marked_outreach_ready` | Admin after confirming consent |
| `practice_contacted` | Admin after outreach |
| `practice_response_received` | Admin after practice responds |
| `provider_onboarding_started` | Admin when onboarding begins |
| `provider_confirmation_linked` | System when provider confirmed externally |
| `user_contacted` | Admin after contacting patient |
| `user_opted_out` | Patient or admin |
| `request_closed` | Admin or system |

### Event Rules

- Events are **append-only** — never updated, never deleted
- Status transitions are only allowed via the matrix in Section 3
- `consent_captured` must persist a snapshot of the consent text in `metadata_json`
- `duplicate_detected` must include the original `request_id` in `metadata_json`
- No event type implies enrollment
- No event type guarantees practice participation

---

## 5. Validation Rules

Implemented in `lib/cb-control-center/dapRequestRules.ts`.

### Input validation (`validateDapRequestInput`)

| Rule | Error Code |
|---|---|
| Email or phone required | `EMAIL_OR_PHONE_REQUIRED` |
| City or ZIP required | `CITY_OR_ZIP_REQUIRED` |
| Practice name or area required | `PRACTICE_OR_AREA_REQUIRED` |
| Consent text required (non-empty) | `CONSENT_TEXT_REQUIRED` |
| no_phi_acknowledged must be true | `NO_PHI_ACKNOWLEDGED_REQUIRED` |
| source_page_kind must be a known value | `UNKNOWN_SOURCE_PAGE_KIND` |
| No PHI in treatment_interest | `PHI_DETECTED` |
| No PHI in user_message | `PHI_DETECTED` |

### Submission gate (`canSubmitDapRequest`)

A request may only be submitted when:
1. `validateDapRequestInput` returns `valid: true`
2. At least one of `consent_to_contact_patient` or `consent_to_contact_practice` is `true`
3. `consent_text` is non-empty

### Practice outreach gate (`canMarkPracticeOutreachReady`)

A request may only advance to `practice_outreach_ready` when:
1. `consent_to_contact_practice = true`
2. Current status is one of: `submitted`, `consent_verified`, `queued_for_review`

### Normalization (`normalizeDapRequestInput`)

Applied before validation and before deduplication:
- Email: trim + lowercase
- Phone: strip non-digits
- Name, city, consent_text, user_message: trim
- Slug: trim + lowercase

---

## 6. No-PHI Boundary

DAP request fields are patient-facing and must not capture protected health information.

### Forbidden in `treatment_interest` and `user_message`

- Social Security Number (SSN) or SSN-format patterns
- Insurance ID, member ID, or insurance card numbers
- Date of birth (DOB)
- Medical record numbers or references
- Specific diagnoses ("diagnosed with", "diagnosis of")
- Symptom descriptions ("symptoms include")

### Allowed in `treatment_interest`

Short, non-clinical labels only:
- cleaning
- crown
- implant
- dentures
- emergency visit
- not sure yet
- whitening
- Invisalign / aligners
- root canal
- extraction

### PHI detection

`containsPhi(text: string): boolean` performs a simple pattern scan. This is a first-pass guardrail, not a HIPAA compliance tool. Secondary review handles edge cases.

---

## 7. Deduplication

`buildDapRequestDedupeKey(input)` produces a stable string from:
- Normalized email (preferred) or normalized phone digits (fallback)
- Preferred practice slug (preferred) or city+zip joined (fallback)

Format: `<contact>::<target>`

Examples:
- `jane@example.com::sunshine-dental`
- `6195550100::san-diego-92101`

**Not included in key:**
- timestamp
- user_message
- treatment_interest
- source_path

Two requests with the same key are candidates for deduplication — the `duplicate_detected` event and `closed_duplicate` status handle resolution.

---

## 8. Confirmation Model

`getDapRequestConfirmationModel(request)` returns a `DapRequestConfirmationModel` with the following typed invariants:

| Property | Type | Value |
|---|---|---|
| `requestReceived` | `true` | Always true — confirms receipt |
| `isEnrollment` | `false` | This is not plan enrollment |
| `guaranteesAvailability` | `false` | DAP may not be available at requested location |
| `guaranteesPricing` | `false` | No savings or pricing are guaranteed |
| `practiceContactedWithoutConsent` | `false` | Practice never contacted without consent |

The confirmation message must:
- State the request was received
- Explicitly say this is not enrollment
- Say availability is not guaranteed
- Say no office will be contacted without consent
- Describe the next step (team review)
- Say the team may contact the patient for clarification

---

## 9. Safety Flags

`getDapRequestSafetyFlags(request)` returns a `DapRequestSafetyFlags` struct with typed literals:

| Flag | Type | Notes |
|---|---|---|
| `impliesEnrollment` | `false` | Structural invariant |
| `impliesGuaranteedAvailability` | `false` | Structural invariant |
| `impliesGuaranteedPricing` | `false` | Structural invariant |
| `requiresConsent` | `true` | Structural invariant |
| `phiRiskDetected` | `boolean` | Runtime check on free-text fields |
| `duplicateRisk` | `boolean` | Computed externally via dedupe_key |

---

## 10. Deferred Integrations

The following integrations are explicitly **not** part of Phase 9A. They require separate phases and explicit approval before implementation.

| Integration | Reason Deferred |
|---|---|
| CRM sync (HubSpot, GHL, or other) | Requires CRM selection, field mapping, and auth setup |
| GHL webhook | Requires GHL account access and endpoint configuration |
| Email notifications (Resend or other) | Requires email template design and sender auth |
| Practice outreach automation | Requires admin dashboard and manual review gate first |
| Admin dashboard | Requires separate UI design phase |
| Production API route (`POST /api/dap/request`) | Requires migration + integration testing before deploy |
| Database migration | Requires Supabase project wiring and schema sign-off |
| Admin workflow (status management) | Requires admin auth and role gating |

These integrations are deferred, not cancelled. The types and validation rules in Phase 9A are designed to support them when they are built.

---

## 11. File Map

| File | Purpose |
|---|---|
| `lib/dap/registry/dapRequestTypes.ts` | All TypeScript types for the request system |
| `lib/cb-control-center/dapRequestRules.ts` | Pure validation and rule functions |
| `lib/cb-control-center/supabaseClient.ts` | Lazy-init Supabase admin client (server-side only) |
| `lib/cb-control-center/dapRequestPersistence.ts` | `createDapRequest`, `createDapRequestEvent`, `findDuplicateDapRequest`, `sanitizeDapRequestForConfirmation` |
| `supabase/migrations/20260429000000_dap_requests.sql` | DB migration: `dap_requests` + `dap_request_events` tables |
| `app/api/dap/requests/route.ts` | `POST /api/dap/requests` — consent-gated request creation |
| `lib/cb-control-center/dapPhase9A.test.ts` | 101 tests covering architecture invariants |
| `lib/cb-control-center/dapPhase9C.test.ts` | Phase 9C structural tests: migration, client, persistence, API route |
| `docs/dap-request-backend-architecture.md` | This document |
| `docs/dap-request-flow-canonical.md` | Phase 8A decision: DapRequestFlowPreview is canonical |
| `docs/dap-production-route-readiness.md` | Phase 8C: launch tier plan and backend dependencies |

---

## 12. Phase 9C — Backend Foundation (Complete)

Phase 9C implemented the backend layer using the Phase 9A architecture:

1. **SQL migration** — `supabase/migrations/20260429000000_dap_requests.sql`
   - `dap_requests` table with consent, contact, and geographic constraints
   - `dap_request_events` append-only table with FK to `dap_requests`
   - Indexes on `dedupe_key`, `request_status`, and `request_id`
   - DB-level enforcement: consent_text not-empty, no_phi_acknowledged = true

2. **Supabase client** — `lib/cb-control-center/supabaseClient.ts`
   - Lazily initialized (no env-var crash at module load in tests)
   - Service role key only — never anon key for server-side writes

3. **Persistence functions** — `lib/cb-control-center/dapRequestPersistence.ts`
   - `createDapRequest`: always sets status to `submitted`, never `enrolled`
   - `createDapRequestEvent`: append-only, no update path
   - `findDuplicateDapRequest`: excludes all closed statuses from duplicate detection
   - `sanitizeDapRequestForConfirmation`: returns only id, status, created_at — no PII

4. **API route** — `app/api/dap/requests/route.ts` (`POST /api/dap/requests`)
   - Validates via `validateDapRequestInput`
   - Consent gate via `canSubmitDapRequest`
   - Deduplicates before insert
   - Hashes IP + user-agent (SHA-256) — no plain PII stored
   - Appends `request_created` and `consent_captured` events on success
   - Returns `isEnrollment: false` in every response
   - No CRM, no GHL, no email, no outreach automation

5. **Rate limiting** — `lib/cb-control-center/rateLimiter.ts` (in-memory, swap-ready)
   - Per IP: 5 requests/hour
   - Per contact (email or phone): 3 requests/day
   - Returns 429 with `Retry-After` header; safe message (no internal key exposed)
   - ⚠ In-memory — not shared across Vercel serverless instances. Must be replaced with Upstash Redis before production `/request` page is live.

## 13. Phase 9D — Preview UI Wiring + Rate Limiting (Complete)

Phase 9D wired the canonical request form to the real API inside the preview route only.

**Delivered:**
- `lib/cb-control-center/rateLimiter.ts` — in-memory rate limiter, async interface (swap-ready for Upstash)
- `app/api/dap/requests/route.ts` — replaced stub with real IP + contact rate limiting; IP checked before body parse, contact after
- `components/cb-control-center/dap-public/DapRequestFlowPreview.tsx` — added `wired` prop:
  - `wired={false}` (default): unchanged preview-only mode (no form, all disabled)
  - `wired={true}`: live `<form>` submitting to `POST /api/dap/requests`, all 6 UI states
- `app/preview/dap/request/page.tsx` — replaced deprecated `RequestDentistForm` with `DapRequestFlowPreview wired={true}`

**UI states (wired mode):** idle → loading → success | validation_error | phi_error | rate_limited | server_error

**Still deferred (Tier 3 not live):**
- Production `/request` page does not exist — `app/request` directory is absent
- Rate limiter must be replaced with Upstash Redis before production launch
- No CRM, GHL, email, or practice outreach automation added

## 14. Phase 9E — Internal Request Review Queue (Complete)

Phase 9E created a read-only internal review surface for submitted DAP requests.

**Delivered:**
- `lib/cb-control-center/dapRequestAdmin.ts` — three server-side read functions, service-role client, scoped to `vertical_key = 'dap'`, no mutations
  - `listDapRequests()` — all requests, newest first
  - `getDapRequest(id)` — single request by id, returns null if not found
  - `getDapRequestEvents(id)` — event log, chronological (oldest first)
- `app/preview/dap/requests/page.tsx` — list view with status badges, empty state, links to detail
- `app/preview/dap/requests/[id]/page.tsx` — full detail view + event log, Next.js 16 `Promise<{id}>` params pattern, `notFound()` on missing id

**Constraints enforced:**
- Read-only — no server actions, no mutation endpoints, no status update buttons, no forms
- `force-dynamic` on both pages (live Supabase data, no cache)
- Scoped to DAP vertical — other CB Control Center verticals not exposed
- Under `/preview/dap/requests/` — not `/admin/`, not production

**Still deferred (Tier 3 not live):**
- Production `/request` page does not exist — `app/request` directory is absent
- Rate limiter must be replaced with Upstash Redis before production launch
- No CRM, GHL, email, or practice outreach automation added

## 15. What Comes Next (Phase 9F+)

- Replace in-memory rate limiter with Upstash Redis
- Create the production `/request` page (Tier 3 launch gate)
- Integration phases (CRM, email) follow after production request flow is stable
