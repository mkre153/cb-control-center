# DAP Site Architecture Output Map

**Status: FROZEN — v0.3.1**  
**Last validated: 76/76 eligibility tests pass**  
**Source of truth for the next build phase. Do not modify without re-running the test suite.**

---

## Overview

This document defines the build-ready architecture for the Dental Advantage Plan (DAP) directory/recruitment site. It is derived from locked eligibility logic in `lib/cb-control-center/siteArchitectureEligibility.ts` and validated by the test suite at `lib/cb-control-center/siteArchitectureEligibility.test.ts`.

DAP is a **directory and demand-generation platform**, not a product enrollment funnel. Patients search for confirmed providers or request DAP at their dentist. No page may imply broad DAP availability, confirmed pricing, or a Join CTA without all required gates satisfied.

---

## Gate Reference

These five blocker IDs govern all page eligibility decisions. They are independent — resolving one does not satisfy another.

| Gate ID | Controls | Description |
|---------|----------|-------------|
| `eb-001` | `confirmedProviderExists` | At least one practice has `provider_status = confirmed_dap_provider` on record |
| `eb-002` | `offerTermsValidated` | Current offer terms (pricing, services, discount %) confirmed from practice-approved brochure |
| `eb-003` | `requestFlowConfirmed` | Patient request flow design, consent language, and follow-up path are confirmed |
| `eb-004` | `ctaGateUnlocked` | "Join plan" CTA gate explicitly documented and unlocked — requires eb-001 AND eb-002 |
| `eb-005` | `declinedRoutingConfirmed` | Declined-practice handling and routing suppression process is documented |

**Critical rule:** eb-004 (`ctaGateUnlocked`) requires eb-001 AND eb-002 to both be resolved before it can be unlocked. Provider confirmation alone (eb-001 only) does NOT unlock the Join CTA. Offer terms alone (eb-002 only) do NOT unlock the Join CTA.

---

## 1. Page Types

### 1.1 — `homepage`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/` |
| **Required gates** | None |
| **Template** | N/A (entry point, not a provider page) |
| **Classification** | Always `recommended` |

**Purpose:** Entry point. Directs patients to ZIP search (Path 1 / Path 2) or specific-dentist request (Path 3). Never implies all dentists offer DAP.

**Allowed CTAs:**
- "Find a DAP Dentist Near Me"
- "Search Near You"
- "Request DAP Availability" (secondary)
- "Learn How It Works"

**Forbidden CTAs:**
- "Join Now" or "Start Membership" as primary
- "Join Plan" without a confirmed provider context
- "Get Your Plan"

**Allowed claims:**
- "Find in-house dental membership plans at participating practices"
- "Connect with dentists who offer Dental Advantage Plan"
- "Request DAP at your preferred dentist"
- General education about in-house dental plans (no practice-specific claims)

**Forbidden claims:**
- "Dentists near you accept DAP" — unconfirmed
- "Join a plan today" — implies immediate availability
- Any network size claims unless confirmed provider count is accurate

---

### 1.2 — `search_or_zip_lookup`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/search` or `/find` |
| **Required gates** | None |
| **Template** | N/A (search interface) |
| **Classification** | Always `recommended` |

**Purpose:** ZIP/procedure search. Returns confirmed providers (Path 1) or demand-capture flow (Path 2). Results layer handles provider status filtering — the search page itself is always safe.

**Allowed CTAs:**
- Any search/filter action
- "Request DAP availability in this area" (Path 2 fallback)

**Forbidden CTAs:**
- "Join plan" at the search layer (requires confirmed provider context)

**Allowed claims:**
- Results filtered to `confirmed_dap_provider` only
- Honest "no confirmed DAP dentist nearby" when none found

**Forbidden claims:**
- Showing `not_confirmed`, `recruitment_requested`, `pending_confirmation` practices as DAP providers in results
- Any implied broad coverage at the search layer

---

### 1.3 — `city_landing_page` *(also: city_directory_page)*

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/san-diego-ca` or `/[city]-[state]` |
| **Required gates** | eb-003 for full recommended; buildable as conditional without eb-003 |
| **Template** | Depends on confirmed provider presence in that city |
| **Classification (eb-003 open)** | `conditional` |
| **Classification (eb-003 resolved)** | `recommended` |

**Purpose:** City-level directory page. Shows confirmed providers in that city or triggers demand-capture if none. Must be honest about coverage — no false city-level claims.

**Allowed CTAs:**
- "Find a DAP Dentist in [City]" — if confirmed provider exists
- "Request DAP availability in [City]" — always safe for cities with no confirmed provider
- "Notify me when DAP is available near [ZIP]"

**Forbidden CTAs:**
- "Join a dental plan in [City]" — implies broad availability
- "Dentists in [City] offer DAP" — unless confirmed providers exist in that city

**Allowed claims:**
- "No confirmed DAP dentist in [City] yet — request one here" — honest
- "[Practice Name] offers DAP in [City]" — only if that practice is `confirmed_dap_provider`
- General information about what DAP is (no city-specific plan availability claims)

**Forbidden claims:**
- "DAP is available in [City]" unless a confirmed provider exists there
- "Dentists in [City] offer dental savings plans" — unconfirmed
- Listing unconfirmed practices as if they participate in DAP
- Pricing or plan details without confirmed provider in that city

**Blocker behavior:**
- eb-003 open → `conditional`: page can be built for demand capture but cannot include the request form or "Request DAP Availability" CTA
- eb-001 unresolved → city page must use demand-capture framing only, never imply provider coverage

---

### 1.4 — `confirmed_provider_page`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/practice/[slug]` |
| **Required gates** | eb-001 (page eligibility), eb-002 + eb-004 (Join CTA) |
| **Template** | Template A |
| **Classification (eb-001 open)** | `blocked` |
| **Classification (eb-001 resolved, eb-002 or eb-004 open)** | `conditional` |
| **Classification (eb-001 + eb-002 + eb-004 all resolved)** | `recommended` |

**Purpose:** Practice-specific page for a confirmed DAP provider. Shows plan overview, pricing, and "Join plan" CTA. Uses Template A. The "Join plan" CTA requires all three gates.

**Gate separation rule (locked):**
- eb-001 unlocks: page eligibility, "View plan details" CTA, confirmed-provider badge
- eb-002 + eb-004 unlock: "Join plan" CTA, specific pricing claims, discount language
- eb-005 does NOT apply to this page — declined-practice routing is irrelevant to a confirmed provider page that has passed its own gates

**Allowed CTAs:**
- "View plan details" — when eb-001 satisfied
- "Join plan" — ONLY when eb-001 + eb-002 + eb-004 all satisfied

**Forbidden CTAs:**
- "Request DAP at this office" — contradicts confirmed status
- "Join plan" before eb-002 and eb-004 are both resolved
- "Book appointment" — DAP does not manage appointments

**Allowed claims:**
- "DAP is available at [Practice Name]"
- "This practice is a confirmed DAP provider"
- Specific pricing ($450/yr adult, $350/yr child) — only from confirmed current brochure (eb-002)
- "25% off non-covered procedures" — only when offer terms confirmed (eb-002)
- "No waiting period" — only when confirmed

**Forbidden claims:**
- Any pricing or plan details before eb-002 is resolved
- "Coming soon" — contradicts confirmed status
- "Join plan" before all three gates are satisfied

**Active restrictions when conditional:**
- `eb-002 open` → `"Join plan" CTA blocked — eb-002 (offer terms) is open`
- `eb-004 open` → `"Join plan" CTA blocked — eb-004 (CTA gate) is open`
- When all three gates satisfied → zero active restrictions

---

### 1.5 — `request_availability_page`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/request-dap` |
| **Required gates** | eb-003 for full recommended |
| **Template** | Template B |
| **Classification (eb-003 open)** | `conditional` |
| **Classification (eb-003 resolved)** | `recommended` |

**Purpose:** Demand-capture form for patients in areas without a confirmed DAP provider, or patients who want DAP at their specific dentist. Must never imply the named dentist already offers DAP.

**Allowed CTAs:**
- "Submit request" — triggers Path 3 request flow (eb-003 required)
- "Notify me when available" — demand capture without outreach (safe even with eb-003 open)

**Forbidden CTAs:**
- "Join plan" — plan not available at requested practice
- "Enroll now"
- "Book with this dentist"

**Allowed claims:**
- "Request this dentist to offer a Dental Advantage Plan"
- "We will contact this practice on your behalf"
- "This does not guarantee the dentist will participate"
- "We will notify you if they join"

**Forbidden claims:**
- "Your dentist will offer DAP"
- "DAP is coming to [practice name]"
- "This dentist is interested in DAP"
- Any pricing or savings claims for the requested practice
- Any implication the request creates an obligation on the practice

**Blocker behavior:**
- eb-003 open → request form and submission logic must not go live; page may exist as stub or waitlist capture only

---

### 1.6 — `how_it_works_guide`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Patients |
| **Route** | `/how-it-works` or `/guide` |
| **Required gates** | None |
| **Template** | N/A (education-only) |
| **Classification** | Always `recommended` |

**Purpose:** Education page. Explains what an in-house dental membership plan is, how DAP works, how to find or request a dentist. No provider-specific claims.

**Allowed CTAs:**
- "Search Near You" → search page
- "Request DAP at Your Dentist" → request page
- "Find a Confirmed DAP Dentist" → search page

**Forbidden CTAs:**
- "Join Now"
- "Start My Membership"

**Allowed claims:**
- General explanation of in-house dental membership plans
- "No insurance required"
- "Each practice sets its own pricing"
- "Find a participating dentist or request DAP at your dentist"

**Forbidden claims:**
- Any claim implying DAP is broadly available ("dentists across San Diego offer DAP")
- Any specific pricing claim without confirmed practice attribution
- "Insurance alternative" or "dental benefits"

---

### 1.7 — `dentist_recruitment_page`

| Field | Value |
|-------|-------|
| **Public** | Yes |
| **Audience** | Practices (B2B) |
| **Route** | `/for-dentists` |
| **Required gates** | None |
| **Template** | N/A (B2B, not a patient-facing provider page) |
| **Classification** | Always `recommended` |

**Purpose:** B2B landing page for dental practices. Explains the DAP program, the $199/mo listing fee, and the enrollment process.

**Allowed CTAs:**
- "Enroll Your Practice"
- "Learn About the DAP Program"
- "Request More Information"

**Forbidden CTAs:**
- Any patient-facing enrollment CTAs
- "Join plan" — wrong audience

**Allowed claims:**
- "$199/month per location — flat fee"
- "Listing + HR director outreach + monthly newsletter + patient lead routing"
- "Add your practice to the DAP directory"
- Patient demand signals in the practice's area (aggregate, anonymized)

**Forbidden claims:**
- "Hundreds of patients waiting to join your plan" — unverified
- "Guaranteed patient growth"
- "Insurance replacement" — compliance violation
- "Network of [X] dentists" — must use accurate confirmed count only

---

### 1.8 — `internal_only_practice_record` *(also: declined_practice_record)*

| Field | Value |
|-------|-------|
| **Public** | No |
| **Audience** | Internal (CRM/admin) |
| **Route** | No public route |
| **Required gates** | eb-005 (for internal routing to be documented) |
| **Template** | None — no patient-facing template |
| **Classification** | Always `internal_only` |

**Purpose:** Internal CRM record for practices that have declined DAP, been suppressed, or are under internal review. Never public. Patient searches treat the area as if the practice does not exist in DAP's system.

**Applies to provider statuses:** `declined` only

**Allowed:** Internal notes, recruitment outcome record (for operational use)

**Forbidden:**
- Any patient-facing disclosure of decline reason
- Any patient-facing label indicating the practice declined
- Any page accessible at a public URL
- Any CTA implying DAP relationship

**Blocker behavior:**
- eb-005 open → the record has an active restriction noting that declined routing handling is not yet confirmed for the internal layer
- This does NOT affect confirmed provider pages — eb-005 applies only to declined/internal routing

**Page generation rule:** A declined practice must never generate a slug, public route, or patient-facing offer page under any gate state. The `pageSlug` field must be absent for all `declined` status practices.

---

### 1.9 — `estimate_path_page` *(future page type — not yet in spec)*

Not yet in the current 8-type architecture. Defined here as a forward scope placeholder.

**Purpose:** Practice-specific informational page for unconfirmed dentists found in the dataset. Shows general information, "request DAP at this practice" flow, and savings estimate. Uses Template B. May NOT imply DAP is offered, available, or priced at this practice.

**Required gates:** eb-003 (for request flow); none for estimate/informational content

**Forbidden:** Any confirmed-provider claim, any confirmed pricing, any Join CTA

**When to build:** After eb-003 is confirmed. Defer until request_availability_page is fully eligible.

---

### 1.10 — `service_or_treatment_page` *(future page type — not yet in spec)*

Not yet in the current architecture. Defined here as a forward scope placeholder.

**Purpose:** SEO/AEO landing pages for treatment categories (e.g., "dental cleanings with no insurance in San Diego"). Informational only. May link to the DAP directory but must not make confirmed-provider claims.

**Required gates:** None for informational content; eb-001 + confirmed provider attribution before linking to a specific practice

**When to build:** After homepage, search, and education layers are stable.

---

## 2. Provider Status → Template Mapping

| Provider status | Public page? | Template | Join CTA allowed? | Pricing claim allowed? | Notes |
|---|---|---|---|---|---|
| `confirmed_dap_provider` (all 3 gates: eb-001 + eb-002 + eb-004) | Yes | **Template A** | **Yes** | Yes — from confirmed brochure only | Full offer page. Zero active restrictions. |
| `confirmed_dap_provider` (eb-001 only — eb-002 or eb-004 open) | Yes (conditional) | **Template A** (restricted) | No | No | "View plan details" CTA only. Page is conditional. |
| `not_confirmed` | Yes (estimate/informational only) | **Template B** | No | No | No DAP offer claim. Demand capture or estimate path. |
| `recruitment_requested` | Yes (informational only) | **Template B** | No | No | Patient submitted request. No offer or pricing claim. |
| `pending_confirmation` | Yes (informational only) | **Template B** | No | No | Outreach made. Patient still sees Template B demand-capture path. |
| `declined` | **No** | None | No | No | Internal-only record. No public slug. No patient-facing page. |

---

## 3. CTA Rules

### 3.1 — CTAs allowed only when all three gates are satisfied (eb-001 + eb-002 + eb-004)

These CTAs are exclusive to a fully-eligible `confirmed_provider_page`:

- "Join plan"
- "Join this dental savings plan"
- "Start membership with this provider"

**These CTAs must never appear on:** homepage, search, city pages, how-it-works, estimate pages, request pages, or any Template B page.

### 3.2 — CTAs safe for all pages and any gate state

- "Find a DAP Dentist Near Me"
- "Search Near You"
- "Learn How It Works"

### 3.3 — CTAs safe for unconfirmed / estimate / request flows (Template B)

- "Estimate my savings"
- "Find possible DAP options"
- "Request this dentist"
- "Ask us to contact this practice"
- "Notify me when DAP is available"
- "Submit request" — eb-003 required for this one

### 3.4 — Forbidden CTAs unless all gates are confirmed

These must never appear before eb-001 + eb-002 + eb-004 are all resolved:

- "Join now"
- "Enroll today"
- "Get this plan"
- "Pay this DAP price"
- "Confirmed at this practice" (as a CTA)
- "Start my plan"
- "Enroll with [practice name]"

---

## 4. Pricing Claim Rules

### 4.1 — Confirmed + offer terms validated (eb-002 resolved)

These claims are safe only on `confirmed_provider_page` when eb-002 is resolved:

- Specific membership pricing (e.g., "$450/yr adult, $350/yr child") — from confirmed current brochure only
- Specific included services — from confirmed brochure only
- Specific discount terms (e.g., "25% off non-covered procedures") — from confirmed brochure only
- "No waiting period" — when confirmed

### 4.2 — Unconfirmed / estimate path (eb-002 open, or non-confirmed provider)

- No confirmed DAP pricing
- No implication the dentist offers DAP
- Savings estimates must be clearly labeled as estimates ("based on typical in-house plan pricing — not confirmed for this practice")
- Patients may request that DAP contact the dentist on their behalf

### 4.3 — Forbidden in any state without eb-002 resolution

- Any practice-specific pricing figures
- "This practice offers DAP at [price]"
- "Save up to [%] on dental care at this practice"
- Any discount or savings claim attributed to a specific unconfirmed practice

---

## 5. Publication Rules

| Condition | Result |
|-----------|--------|
| eb-001 open | `confirmed_provider_page` → **blocked**. Cannot publish. |
| eb-001 resolved, eb-002 or eb-004 open | `confirmed_provider_page` → **conditional**. Publish without Join CTA or pricing. |
| eb-001 + eb-002 + eb-004 all resolved | `confirmed_provider_page` → **recommended**. Safe to publish with Join CTA. |
| eb-003 open | `request_availability_page`, `city_landing_page` → **conditional**. May publish as stub/waitlist capture. Form and submission must not go live. |
| eb-003 resolved | All demand-capture pages → **recommended**. Full request flow safe. |
| `declined` provider status | `internal_only_practice_record` → **never public**. No slug, no patient-facing route. |
| eb-005 open | Declined routing for internal records not yet confirmed. Does not affect `confirmed_provider_page`. |
| Any gate state | `homepage`, `search_or_zip_lookup`, `how_it_works_guide`, `dentist_recruitment_page` → always **recommended**. |

---

## 6. Page Generation Matrix

| Page type | Can generate now? | Data dependency | Risk if wrong | Required blocker clearance |
|-----------|:-:|---|---|---|
| `homepage` | **Yes** | bt-name, bt-category | Low — no provider claims | None |
| `search_or_zip_lookup` | **Yes** | ZIP data, provider dataset | Medium — results must filter to confirmed only | None |
| `how_it_works_guide` | **Yes** | Brand copy, product description | Low — education only | None |
| `dentist_recruitment_page` | **Yes** | Business entity, pricing terms | Low — B2B, no patient offer | None |
| `city_landing_page` | **Conditional** | City/ZIP data, confirmed provider list | High — false coverage claim if no confirmed provider | eb-003 for full version; buildable as demand-capture stub without it |
| `request_availability_page` | **Conditional** | Request flow design, consent language | High — form with no follow-up path if eb-003 open | eb-003 before form/submission goes live |
| `confirmed_provider_page` (view only) | **Conditional** | Provider agreement on file, practice data | High — false offer claim without eb-001 | eb-001 required for any version |
| `confirmed_provider_page` (with Join CTA) | **No — blocked** | Provider + offer terms + CTA gate | Critical — false enrollment claim | eb-001 + eb-002 + eb-004 all required |
| `estimate_path_page` (unconfirmed practice) | **Conditional** | Practice dataset, disclaimer copy | High — must not imply DAP offered | eb-003 for request integration; none for estimate-only |
| `internal_only_practice_record` | **Internal only** | Declined practice record | Critical — must never render public | Never public; eb-005 for routing documentation |
| `service_or_treatment_page` | **Deferred** | SEO keyword set, confirmed practice data | Medium — must not make confirmed-provider claims | eb-001 for practice attribution |

---

## 7. Build Order

Based on the Page Generation Matrix and current gate state, the recommended build sequence is:

**Phase 1 — Always safe (no gates required)**
1. `homepage`
2. `how_it_works_guide`
3. `search_or_zip_lookup`
4. `dentist_recruitment_page`

**Phase 2 — Demand capture (eb-003 required)**
5. `city_landing_page` (demand-capture version)
6. `request_availability_page` (form stub, no submission)
7. → Clear eb-003 → unlock full form + submission logic

**Phase 3 — Confirmed provider pages (eb-001 required)**
8. `confirmed_provider_page` without Join CTA
9. → Clear eb-002 and eb-004 → unlock Join CTA + pricing claims

**Phase 4 — Full architecture (all gates clear)**
10. Full `confirmed_provider_page` with Join CTA
11. `city_landing_page` with confirmed provider card
12. `estimate_path_page` (after eb-003, with clear estimate disclaimers)

**Never — regardless of gate state**
- `internal_only_practice_record` must never appear in any patient-facing phase
- `declined` practices must never generate a public slug or patient-facing offer page

---

## 8. Active Risk Reference

These risks are derived from gate state at evaluation time and inform build decisions:

| Risk ID | Severity | Fires when | Description |
|---------|----------|------------|-------------|
| `risk-001` | High | eb-001 open | Homepage "Join Now" CTA implies broad availability without confirmed provider |
| `risk-002` | High | eb-001 resolved + eb-002 open | Search results showing unconfirmed practices as DAP providers |
| `risk-003` | High | eb-001 resolved + eb-004 open | "Join plan" CTA on confirmed provider page before offer terms validated |
| `risk-004` | High | eb-003 open | Confirmed provider page has public URL for a declined practice |
| `risk-005` | Medium | eb-005 open | City page claims DAP coverage without confirmed provider |
| `risk-006` | Medium | eb-001 resolved + eb-002 open | Pricing claims before current brochure confirmed |
| `risk-007` | Medium | eb-003 open | Request availability page live with no confirmed follow-up path |
| `risk-008` | Low | **Always** | City page claims broad coverage where only one confirmed provider exists — name them explicitly |

`risk-008` is always active. It is a permanent reminder: never use "dentists in [City] offer DAP" when only one confirmed provider exists in that area. Name the practice explicitly.

---

## 9. Acceptance Criteria (Locked)

This map is valid as a build spec when all of the following are true:

- [ ] 76/76 eligibility tests pass (`npm test`)
- [ ] `confirmed_provider_page` is **blocked** when eb-001 is open
- [ ] `confirmed_provider_page` is **conditional** when eb-001 resolved but eb-002 or eb-004 open
- [ ] `confirmed_provider_page` is **recommended** with zero active restrictions when eb-001 + eb-002 + eb-004 are all resolved
- [ ] `confirmed_provider_page` does NOT require eb-005
- [ ] `internal_only_practice_record` is **always internal_only** in every gate state
- [ ] `declined` practices never generate a public slug or patient-facing offer page
- [ ] Join CTA (`"Join plan"`) is forbidden before eb-001 + eb-002 + eb-004 are all resolved
- [ ] `homepage`, `search_or_zip_lookup`, `how_it_works_guide`, `dentist_recruitment_page` are always `recommended`
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] Build clean (`npm run build`)

---

*Generated from: `lib/cb-control-center/siteArchitectureEligibility.ts`, `lib/cb-control-center/siteArchitectureSpecs.ts`, `lib/cb-control-center/siteArchitectureEligibility.test.ts` — v0.3.1*
