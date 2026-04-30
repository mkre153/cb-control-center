# DAP Public Site UX Blueprint

**Phase 7D — Public Site UX Blueprint**  
**Status:** Complete  
**Test coverage:** 101 tests in `dapPhase7D.test.ts`  
**Types:** `dapPublicUxTypes.ts`  
**Rules:** `dapPublicUxRules.ts`

---

## Phase 7E — Component Contract Layer

**Status:** Complete  
**Test coverage:** 45 tests in `dapPhase7E.test.tsx` (component rendering)  
**Component directory:** `components/cb-control-center/dap-public/`

### Rendering Pipeline

```
Business Truth / CMS Snapshot
        ↓
Phase 7D UX Rules (dapPublicUxRules.ts)
        ↓
Phase 7E Components (components/cb-control-center/dap-public/)
        ↓
Future Routes / Pages
```

Components only render Phase 7D models. They do not recompute availability, provider status, public claims, pricing eligibility, consent requirements, or offer validation.

### Components Created

| Component | Consumes | Preview-only? |
|---|---|---|
| `DapPublicCta` | `DapCtaModel` | No — reusable |
| `DapStatusBadge` | `DapStatusBadgeModel` | No — reusable |
| `DapProviderCard` | `DapProviderCardModel` | No — reusable |
| `DapCityAvailabilitySummaryView` | `DapCityAvailabilitySummary` | No — reusable |
| `DapNoResultsPanel` | `DapNoResultsModel` | No — reusable |
| `DapRequestFlowPreview` | `DapRequestFlowModel` | Yes — no live submission |
| `DapHomepageHeroPreview` | `DapHomepageHeroModel` | Yes — not a public route |
| `DapSearchResultsPreview` | `DapSearchResultsModel` + `DapProviderCardModel[]` | Yes — preview context |

### Safety Invariants Preserved by Components

| Invariant | Component | Mechanism |
|---|---|---|
| Internal-only practices never render publicly | `DapProviderCard` | Returns `null` when `!model.isPublic && !previewMode` |
| Internal badge hidden from patients | `DapStatusBadge` | Returns `null` when `!badge.isPublic && !showInternalWarning` |
| No dead-end no-results state | `DapNoResultsPanel`, `DapSearchResultsPreview` | `data-is-dead-end="false"` structural; always shows request CTA |
| Preview submit is disabled | `DapRequestFlowPreview` | `<button disabled data-preview-submit>` — no `<form>`, no action |
| Consent field always visible in request flow | `DapRequestFlowPreview` | Consent checkbox always rendered from model steps |
| Homepage never implies universal availability | `DapHomepageHeroPreview` | `data-implies-universal-availability="false"` from model |
| No business logic recomputed in components | All | Components branch only on display-oriented model fields |

### What Was Intentionally NOT Built (Phase 7E)

- No new public routes (`app/`)
- No live form submission, CRM sync, webhook, or database write
- No request flow processing
- No admin UI
- No real search functionality
- No visual design system polish
- No animation or brand work

These belong to Phase 8+.

---

## Core Principle

DAP is a **patient-facing dental savings directory with honest availability states** — not a marketing site that implies universal coverage. Every page must answer one of:

1. Is DAP available near me?
2. Is this dentist confirmed to offer DAP?
3. What should I do next?
4. What happens if my dentist is not confirmed?

The site must **never** imply:
- DAP is available at every dentist
- Every listed dentist accepts DAP
- Pricing is guaranteed unless offer terms are validated
- A user can join a dentist's plan unless the Join CTA gate is unlocked
- Declined practices exist as a patient-visible category

---

## Availability States

| State | Source | Patient-Facing? | Badge |
|---|---|---|---|
| `confirmed` | `confirmed_dap_provider` + `published: true` | Yes | "DAP confirmed" |
| `not_confirmed` | `not_confirmed` + `published: true` | Yes | "Not confirmed" |
| `requested` | `recruitment_requested` or `pending_confirmation` + `published: true` | Yes | "Requested by patients" |
| `requestable` | City/area with no confirmed providers | Yes (area-level) | "Request available" |
| `unavailable_internal_only` | `declined` or `published: false` | Never | Internal only |

---

## CTA Gate Logic

```
confirmed + offerTermsValidated + ctaGateUnlocked → join_plan
confirmed + offerTermsValidated (gate locked)     → view_plan_details
confirmed (no offer terms)                         → request_plan_details
not_confirmed / requestable                        → request_this_dentist
requested                                          → add_your_request
unavailable_internal_only                          → none
city with confirmed providers                      → search_nearby
city with no confirmed providers                   → request_city_availability
```

---

## 1. Homepage

### Purpose
Position DAP as "find confirmed providers or request one near you." Never implies universal availability.

### Hero Section
```
H1:   Find dentists offering Dental Advantage Plan — or request one near you.
Sub:  Dental Advantage Plan helps you save on dental care without traditional
      insurance. Find confirmed providers or request availability in your area.

Primary CTA:   [Find DAP dentists]  → /search
Secondary CTA: [Request a dentist]  → /request-dap
```

**Prohibited H1 patterns:**
- "Find any dentist with DAP" — implies universal availability
- "DAP available everywhere" — false claim
- "Join DAP at your dentist" — implies every dentist participates

### Search Module
```
Placeholder:    City, ZIP, or dentist name
Helper text:    Find confirmed DAP providers near you
Location search: Yes
Dentist search:  Yes
```

### How DAP Works Section
```
Step 1: Find or request — Search for confirmed DAP dentists, or request at your dentist
Step 2: Join the plan — Enroll at a confirmed provider (requires confirmed + validated terms)
Step 3: Save on care — Use your plan for covered services
```

**Note:** Step 2 must clarify enrollment requires a confirmed provider — not implied for all practices.

### Availability States Explanation Section
Explain that not all dentists offer DAP. Use honest framing:
- "Confirmed providers" — signed agreement, plan active
- "Request availability" — let DAP know where you want coverage

### Savings / Education Section
```
Headline: How dental membership plans work
Body:     General education on dental savings alternatives to insurance.
          No guaranteed pricing claims without validated offer terms.
impliesGuaranteedPricing: false
```

### DAP vs Insurance Comparison Section
Educational comparison only. Must not claim DAP is always cheaper or universally available.

### Request a Dentist Module
```
Headline:   Don't see your dentist?
Body:       We can reach out to dentists in your area on your behalf.
CTA:        [Request a dentist]  → /request-dap
```

### FAQ Section
Required questions:
- Is my dentist confirmed to offer DAP?
- What if my dentist is not listed?
- How do I join DAP?
- Is DAP accepted at every dentist?

**Required answer to "Is DAP accepted at every dentist?":**
> No. DAP is only available at practices that have confirmed a signed agreement. You can request that DAP reach out to any dentist on your behalf.

---

## 2. City Page

### Purpose
Show confirmed DAP providers in a city, or capture demand if none exist. Never implies all dentists in the city participate.

### H1 Pattern

| Condition | H1 |
|---|---|
| Confirmed providers exist | Dentists offering Dental Advantage Plan in [City] |
| No confirmed providers | Dental Advantage Plan in [City] |

### Subheading Pattern

| Condition | Subheading |
|---|---|
| Confirmed providers exist | See confirmed DAP providers in [City], or request availability with another dentist near you. |
| No confirmed providers | Dental Advantage Plan is not yet confirmed with a dentist in [City]. You can request availability and we'll contact dentists in your area. |

### Sections (in order)

1. **Hero** — H1 + subheading per pattern above
2. **Search / Filter** — Filter by neighborhood, specialty
3. **Availability Summary** — Counts: X confirmed, Y requested, Z in dataset
4. **Confirmed Providers** — Cards using `confirmed_provider` template
5. **Request Availability** — Demand capture section
6. **How DAP Works Locally** — Local context, confirmed-provider framing
7. **FAQ** — Local questions: "Are there DAP dentists in [City]?"

### Primary CTA Rule
```
confirmedCount > 0 → search_nearby
confirmedCount = 0 → request_city_availability
```

### Prohibited City Copy
- "All dentists in [City] accept DAP"
- "Use DAP at any dentist in [City]"
- "Guaranteed DAP pricing in [City]"
- Any claim that implies a specific number of available dentists without source data

---

## 3. Dentist Page

Four distinct templates. Template selection is derived from availability state, never manually set.

### Template A — Confirmed Provider

**Trigger:** `availability_state = 'confirmed'`

```
H1:    [Practice Name] and Dental Advantage Plan

Body:  [Practice Name] is confirmed to offer Dental Advantage Plan.

Badge: DAP confirmed (green)

CTA depends on gate state:
  - All gates open:         [Join plan]         → /enroll
  - Offer terms only:       [View plan details] → /plan-details
  - No validated terms:     [Request plan details]
```

**Allowed copy:**
- "[Practice Name] is confirmed to offer Dental Advantage Plan."
- "View plan details or join today." (when offer terms validated)
- Specific pricing ($450/yr adult, $350/yr child) — **only when offer terms confirmed**
- "25% off non-covered procedures" — **only when inclusions confirmed**

**Forbidden copy:**
- "Request DAP at this office" — wrong template for confirmed provider
- "Coming soon" — contradicts confirmed status
- "We will reach out on your behalf" — wrong flow
- `join_plan` CTA when `offer_terms_status ≠ complete`

---

### Template B — Not Confirmed

**Trigger:** `availability_state = 'not_confirmed'` or `'requestable'`

```
H1:    Request Dental Advantage Plan at [Practice Name]

Body:  We have not confirmed that [Practice Name] offers Dental Advantage Plan.
       Patients have asked about DAP at this office.

Badge: Not confirmed (gray)

CTA:   [Request DAP at this office]  → /request-dap/dentist?id=[id]
```

**Allowed copy:**
- "We have not confirmed that [Practice Name] offers Dental Advantage Plan."
- "Request that DAP reach out to this office on your behalf."
- Public practice details: name, city, specialty

**Forbidden copy:**
- "This dentist accepts DAP"
- "DAP is available here"
- "Join now"
- "DAP confirmed" badge
- Any pricing claims

---

### Template C — Requested

**Trigger:** `availability_state = 'requested'`

```
H1:    Patients have requested DAP at [Practice Name]

Body:  Patients have asked about using Dental Advantage Plan at [Practice Name].
       Availability has not been confirmed.

Badge: Requested by patients (blue)

CTA:   [Add your request]  → /request-dap/dentist?id=[id]
```

**Allowed copy:**
- "Patients have asked about using Dental Advantage Plan at this office. Availability has not been confirmed."

**Forbidden copy:**
- "This office offers DAP"
- "DAP is available here"
- "Join now"
- Any confirmation or pricing language

---

### Template D — Declined / Internal Only

**Trigger:** `availability_state = 'unavailable_internal_only'`

```
No public page generated.
No patient-facing template.
Practice does not appear in:
  - Provider cards
  - City visiblePracticeSlugs
  - Search results
  - Sitemap / page generation
```

**The decline reason is never surfaced to patients.** Patient searches return no-result or request flow as if the practice is not in the DAP system.

---

## 4. Search Results Page

### States

#### State 1 — Confirmed Results
Confirmed providers appear first. Then requestable providers below.

```
Confirmed providers:  [ProviderCard × N] — Template A styling
Requestable below:   [ProviderCard × M] — Template B styling
No-results module:   null
isDeadEnd:           false
```

#### State 2 — Mixed Results (no confirmed nearby)
No confirmed providers in area, but requestable options exist.

```
Message:   DAP is not yet confirmed at a dentist near this location.
Providers: Requestable/requested cards for context
Primary CTA:   [Request DAP in this area]
Secondary CTA: [Request a specific dentist]
isDeadEnd: false
```

#### State 3 — No Confirmed Providers
Zero confirmed, but dataset practices exist in the area.

```
Primary CTA:   request_this_dentist
Secondary CTA: request_city_availability
isDeadEnd:     false
noResultsModel: populated
```

#### State 4 — No Results at All
Zero practices in the dataset for this search.

```
Headline:    DAP is not confirmed with a dentist in this area yet.
Body:        Want us to contact dentists near [location]?
Primary CTA: [Request DAP in this area]  → /request-dap
Secondary:   [Request a specific dentist]  → /request-dap/dentist
isDeadEnd:   false
```

**Rule: Search results must never dead-end.** Every zero-result state must offer at least one request CTA.

---

## 5. Decision Page

### Purpose
Educational. Routes users to search or request flows without claiming universal availability or guaranteed pricing.

### Required Sections

1. **Problem Framing** — Why uninsured patients look for dental savings alternatives
2. **Educational Explanation** — How dental membership plans work
3. **DAP Fit / Not Fit** — Honest assessment of who DAP helps
4. **Search CTA** — Find confirmed providers
5. **Request CTA** — Request availability if no confirmed providers nearby
6. **FAQ** — Honest Q&A

### CTA Model
```
Primary CTA:   search_nearby                → [Find DAP dentists near me]
Secondary CTA: request_city_availability    → [Request availability]
impliesPricing:              false
impliesUniversalAvailability: false
```

### Prohibited Decision Page Copy
- "Guaranteed DAP pricing" — offer terms must be validated
- "Available at every dentist" — false claim
- "Join DAP at any office" — incorrect
- Provider location claims without confirmed data

### Allowed Educational Copy (example)
- "Dental membership plans like DAP charge an annual fee in exchange for discounted services."
- "Savings vary by practice and plan terms."
- "DAP is available at practices that have confirmed a signed agreement."

---

## 6. Treatment Page

### Purpose
Educate on a specific treatment's cost pressure, then route to search/request. Never implies guaranteed DAP pricing for that treatment.

### Required Sections

1. **Treatment Cost Pressure** — Why this treatment is expensive without insurance
2. **How DAP May Help** — Educational framing, no guarantees
3. **Provider Availability Caveat** — DAP is only available at confirmed providers; savings vary
4. **Search CTA** — Find DAP dentists
5. **Request Treatment Availability** — If no providers nearby
6. **FAQ** — "Will DAP cover [treatment]?", "How much will I save?"

### CTA Model
```
Primary CTA:            search_nearby
Secondary CTA:          request_city_availability
impliesGuaranteedPricing: false
```

### Prohibited Treatment Page Copy
- "DAP guarantees a specific [treatment] price" — false
- "DAP is accepted everywhere for this treatment" — false
- "Every dentist listed offers [treatment]-specific savings" — false

### Required Caveat Copy (on every treatment page)
> Savings on [treatment] depend on the specific practice and your confirmed DAP plan terms. DAP is available only at practices with a signed confirmed agreement.

---

## 7. Request Flow

### Purpose
Capture patient demand honestly. Submitting a request does not confirm availability.

### Required Request Types

| Type | Trigger | Location |
|---|---|---|
| `specific_dentist` | Patient names a dentist | Dentist page Template B/C |
| `city_availability` | City/area with no confirmed providers | City page, search results |
| `zip_availability` | ZIP-based demand capture | Homepage, search |
| `treatment_availability` | Treatment page request | Treatment page |

### Steps

| Step | Label | Fields |
|---|---|---|
| 1 | Choose request type | `requestType` |
| 2 | Enter location / dentist | `location`, `dentistName`, `treatmentNeed` |
| 3 | Enter contact info | `name`, `email`, `phone` |
| 4 | Confirm consent | `consentToContact` |

### Required Availability Caveat
> Submitting a request does not guarantee this dentist will offer DAP. It helps us know where patients want availability.

This caveat **must appear** before the patient submits. It is a structural requirement of the request flow model (`collectsConsent: true` in `DapRequestFlowModel`).

### Success State
```
Headline:  Your request has been submitted.
Body:      We'll reach out to [dentist name / dentists in your area] about DAP availability.
           We'll contact you at [email] when we have an update.
Secondary: [Find confirmed DAP dentists near you]
```

### Prohibited Request Flow Copy
- "Your dentist will offer DAP soon" — not confirmed
- "We guarantee availability in your area" — cannot be guaranteed
- "Submitting means your dentist accepts DAP" — incorrect

---

## Component State Summary

| Component | State Source | Public? | CTA |
|---|---|---|---|
| ProviderCard (confirmed) | `availability_state = 'confirmed'` | Yes | join_plan / view_plan_details / request_plan_details |
| ProviderCard (not confirmed) | `availability_state = 'not_confirmed'` | Yes | request_this_dentist |
| ProviderCard (requested) | `availability_state = 'requested'` | Yes | add_your_request |
| ProviderCard (declined) | `availability_state = 'unavailable_internal_only'` | **Never** | none |
| CityHero (with confirmed) | `confirmedCount > 0` | Yes | search_nearby |
| CityHero (no confirmed) | `confirmedCount = 0` | Yes | request_city_availability |
| SearchResults (any state) | — | Yes | never dead-end |
| NoResultsModule | `totalCount = 0` | Yes | request_city_availability |
| HomepageHero | — | Yes | search_nearby |
| DecisionPageCta | — | Yes | search_nearby (primary) |
| TreatmentPageCta | — | Yes | search_nearby (primary) |
| RequestFlow | any `DapRequestType` | Yes | collectsConsent = true always |

---

## Safety Invariants

These are enforced by type structure, not just runtime logic:

| Invariant | Enforcement |
|---|---|
| Homepage never implies universal availability | `impliesUniversalAvailability: false` on `DapHomepageHeroModel` |
| No results never dead-ends | `isDeadEnd: false` on `DapNoResultsModel` |
| Request flow always collects consent | `collectsConsent: true` on `DapRequestFlowModel` |
| Decision pages never imply pricing | `impliesPricing: false` on `DapDecisionPageCtaModel` |
| Treatment pages never imply guaranteed pricing | `impliesGuaranteedPricing: false` on `DapTreatmentPageCtaModel` |
| City pages never imply universal availability | `impliesUniversalAvailability: false` on `DapCityPageModel` |
| Savings education never implies guaranteed pricing | `impliesGuaranteedPricing: false` on `DapSavingsEducationModel` |

---

## Phase 7F — Page-Level Preview Composition

**Status:** Complete  
**Tests:** 36 tests in `dapPhase7F.test.tsx`  
**Total tests:** 714 (all passing)  
**New public routes:** 0  
**Static page count:** 80 (unchanged)

### What Phase 7F Proves

Full DAP public pages can be safely composed from the model-driven component layer. Every page receives pre-computed Phase 7D models as props. No business logic runs inside page components.

### Rendering Pipeline (complete)

```
Business Truth / CMS Snapshot
        ↓
Phase 7D UX Rules (dapPublicUxRules.ts)
        ↓
Phase 7F Section Factories (dapPublicSectionModels.ts)
        ↓
Phase 7E Components (components/cb-control-center/dap-public/)
        ↓
Phase 7F Page Compositions (components/cb-control-center/dap-pages/)
```

### New Section Components

| Component | Renders | Safety Attribute |
|---|---|---|
| `DapHowItWorksSection` | `DapHowItWorksSectionModel` — numbered steps | `data-section="how-it-works"` |
| `DapFaqSection` | `DapFaqSectionModel` — Q&A items | `data-section="faq"` |
| `DapComparisonSection` | `DapComparisonSectionModel` — headline + columns | `data-section="comparison"` |
| `DapSavingsEducationSection` | `DapSavingsEducationModel` | `data-implies-guaranteed-pricing="false"` |

### Factory Functions (`dapPublicSectionModels.ts`)

- `getDefaultHowItWorksModel()` — 4-step enrollment flow
- `getDefaultFaqModel(pageKind)` — 3 shared items + page-kind-specific extras
- `getDefaultComparisonModel()` — DAP vs traditional dental insurance, 2 columns
- `getDefaultSavingsEducationModel()` — `impliesGuaranteedPricing: false` structural invariant

### Page Composition Components (`components/cb-control-center/dap-pages/`)

| Page Component | Assembles |
|---|---|
| `DapHomepagePage` | Hero + HowItWorks + Comparison + FAQ |
| `DapCityPage` | H1/subheading + CityAvailabilitySummary + ProviderCards/NoResults + HowItWorks + FAQ |
| `DapDentistPage` | DentistH1 + ProviderCard + SavingsEd + FAQ |
| `DapSearchResultsPage` | SearchResultsPreview + HowItWorks |
| `DapDecisionPage` | H1 + CTAs + SavingsEd + Comparison + FAQ |
| `DapTreatmentPage` | H1 + CTAs + SavingsEd + FAQ |
| `DapRequestFlowPage` | RequestFlowPreview with page header |

### Safety Attributes on Page Roots

| Page | Attribute |
|---|---|
| `DapHomepagePage` | `data-page-kind="homepage"` |
| `DapCityPage` | `data-page-kind="city_page"` + `data-implies-universal-availability="false"` |
| `DapDentistPage` | `data-page-kind="dentist_page"` + `data-template-id` + `data-is-public` |
| `DapSearchResultsPage` | `data-page-kind="search_results_page"` |
| `DapDecisionPage` | `data-page-kind="decision_page"` + `data-implies-pricing="false"` |
| `DapTreatmentPage` | `data-page-kind="treatment_page"` + `data-implies-guaranteed-pricing="false"` |
| `DapRequestFlowPage` | `data-page-kind="request_flow"` |

---

## Non-Goals (Phase 7D)

- Real Supabase connection
- Admin UI
- New page routes (page count remains 78)
- Full visual design system
- Animations or styling polish
- Changes to source validation or QA architecture

These belong to Phase 8+.
