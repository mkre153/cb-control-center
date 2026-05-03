# DAP Domain Extraction Log

Tracking the controlled migration of DAP product truth from `lib/cb-control-center/` into the clean `lib/dap/` namespace.

## Four-zone model

| Zone | Path | Rule |
|------|------|------|
| DAP product truth | `lib/dap/` | Pure — no Supabase, no Next.js, no React |
| CBCC management UI | `lib/cb-control-center/` | Admin workflows, runtime, Supabase |
| CBCC DAP adapter | `lib/cbcc/adapters/dap/` | FROZEN — Parts 13–22 |
| CBCC generic engine | `lib/cbcc/` | FROZEN |

Routes stay stable. App files become thin import shells.

## Extraction criteria (all must pass before moving)

- No `supabase` import
- No `next` import
- No `react` import
- No `'use server'` / `'use client'` directive
- No Anthropic import
- No dependency on `lib/cbcc/` or `lib/cbcc/adapters/dap/`
- No path-based test assertions (readFileSync / existsSync) on the file

## Completed moves

### Wave 1 — Pure type files

| File | Old path | New path | Commit | Date |
|------|----------|----------|--------|------|
| dapPublicUxTypes.ts | `lib/cb-control-center/dapPublicUxTypes.ts` | `lib/dap/site/dapPublicUxTypes.ts` | TBD | 2026-05-02 |
| dapRequestTypes.ts | `lib/cb-control-center/dapRequestTypes.ts` | `lib/dap/registry/dapRequestTypes.ts` | feat(dap): Wave 1B extract dapRequestTypes to domain registry | 2026-05-02 |
| dapProviderParticipationTypes.ts | `lib/cb-control-center/dapProviderParticipationTypes.ts` | `lib/dap/registry/dapProviderParticipationTypes.ts` | feat(dap): Wave 1C extract provider participation types | 2026-05-02 |
| dapPracticeOnboardingTypes.ts | `lib/cb-control-center/dapPracticeOnboardingTypes.ts` | `lib/dap/registry/dapPracticeOnboardingTypes.ts` | feat(dap): Wave 1D extract practice onboarding types | 2026-05-02 |
| dapOfferTermsTypes.ts | `lib/cb-control-center/dapOfferTermsTypes.ts` | `lib/dap/registry/dapOfferTermsTypes.ts` | feat(dap): Wave 1E extract offer terms types | 2026-05-02 |
| dapOfferTermsReviewTypes.ts | `lib/cb-control-center/dapOfferTermsReviewTypes.ts` | `lib/dap/registry/dapOfferTermsReviewTypes.ts` | feat(dap): Wave 1F extract offer terms review types | 2026-05-02 |
| dapMemberStatusTypes.ts | `lib/cb-control-center/dapMemberStatusTypes.ts` | `lib/dap/membership/dapMemberStatusTypes.ts` | feat(dap): Wave 1G extract member status types | 2026-05-02 |
| dapCmsTypes.ts | `lib/cb-control-center/dapCmsTypes.ts` | `lib/dap/site/dapCmsTypes.ts` | feat(dap): Wave 1H extract CMS types | 2026-05-02 |
| dapRequestRules.ts | `lib/cb-control-center/dapRequestRules.ts` | `lib/dap/registry/dapRequestRules.ts` | feat(dap): Wave 2A extract request rules | 2026-05-02 |
| dapProviderParticipationRules.ts | `lib/cb-control-center/dapProviderParticipationRules.ts` | `lib/dap/registry/dapProviderParticipationRules.ts` | feat(dap): Wave 2B extract provider participation rules | 2026-05-02 |
| dapPracticeOnboardingRules.ts | `lib/cb-control-center/dapPracticeOnboardingRules.ts` | `lib/dap/registry/dapPracticeOnboardingRules.ts` | feat(dap): Wave 2C extract practice onboarding rules | 2026-05-02 |
| dapOfferTermsRules.ts | `lib/cb-control-center/dapOfferTermsRules.ts` | `lib/dap/registry/dapOfferTermsRules.ts` | feat(dap): Wave 2D extract offer terms rules | 2026-05-02 |
| dapOfferTermsReviewRules.ts | `lib/cb-control-center/dapOfferTermsReviewRules.ts` | `lib/dap/registry/dapOfferTermsReviewRules.ts` | feat(dap): Wave 2E extract offer terms review rules | 2026-05-02 |
| dapMemberStatusRules.ts | `lib/cb-control-center/dapMemberStatusRules.ts` | `lib/dap/registry/dapMemberStatusRules.ts` | feat(dap): Wave 2F extract member status rules | 2026-05-02 |

Import sites updated (dapRequestTypes): 13 files (app/, components/, lib/cb-control-center/, dap-phase-tests/)
Note: dapPhase9A.test.ts and dapPhase9F.test.ts had hardcoded path constants — both updated to new path, assertions unchanged.

Import sites updated (dapProviderParticipationTypes): 8 files (app/, lib/cb-control-center/, dap-phase-tests/)
Note: dapPhase9L.test.ts had TYPES_PATH constant — updated to new path, assertions unchanged.

Import sites updated (dapPracticeOnboardingTypes): 8 files (app/, lib/cb-control-center/, dap-phase-tests/)
Note: dapPhase9H.test.ts had TYPES_PATH constant — updated to new path, assertions unchanged.

Import sites updated (dapOfferTermsTypes): 7 files (app/, lib/cb-control-center/, dap-phase-tests/)
Note: dapPhase9J.test.ts had TYPES_PATH constant — updated to new path, assertions unchanged.

Import sites updated (dapOfferTermsReviewTypes): 7 files (app/, lib/cb-control-center/, dap-phase-tests/)
Note: dapPhase9K.test.ts had REVIEW_TYPES_PATH constant — updated to new path, assertions unchanged.

Import sites updated (dapMemberStatusTypes): 15 files (3 app alias, 9 lib relative, 3 test direct imports + 1 path constant).
Notes: dapPhase9Q had both a direct type import and TYPES_PATH constant. dapPhase9R and dapPhase9S had direct type imports only. dapPhase10 regex /dapMemberStatusTypes/ unchanged — still matches updated import path.

Import sites updated (dapCmsTypes): 10 files (5 alias, 3 relative from lib/, 1 relative from lib/source/, 1 test direct import).
Note: internal import updated from './types' to '@/lib/cb-control-center/types' (cross-layer dep, allowed per criteria). ProviderStatus/PublicClaimLevel extraction is deferred future work.

## Planned waves

### Wave 1 remaining (pure types)
Wave 1 complete. Two files deferred:
- source/dapSourceTypes — has inbound deps from source pipeline; assess separately
- mkcrm/dapClientBuilderBillingTypes — lives under mkcrm/ subdirectory; assess separately

### Wave 2G — Inspected, not moved
- `lib/cb-control-center/mkcrm/dapClientBuilderBillingRules.ts` — file is pure (no Supabase/Next.js/React/server deps, only static rule functions), but its sole import is from `./dapClientBuilderBillingTypes` which remains in `lib/cb-control-center/mkcrm/`. Moving the rules file would create a `lib/dap/registry → lib/cb-control-center` back-dependency, which violates the extraction boundary rule. Prerequisite: move `mkcrm/dapClientBuilderBillingTypes` first (currently deferred in Wave 1 remaining). Revisit as Wave 2G-2 once types file is extracted.

### Wave 2H — Inspected, not moved
- `lib/cb-control-center/dapDisplayRules.ts` — file is pure (no Supabase/Next.js/React/server deps, only display rules, route constants, copy constants, and pure helper functions). However, line 1 imports `ProviderStatus` from `'./types'` which is `lib/cb-control-center/types.ts`. Moving to `lib/dap/registry/` would create a `lib/dap/registry → lib/cb-control-center` back-dependency. Prerequisite: extract `ProviderStatus` (and `PublicClaimLevel`) from `lib/cb-control-center/types.ts` into the `lib/dap/` namespace first. This was noted as deferred future work in Wave 1H (dapCmsTypes has the same blocker). ~30 inbound importers across components/, app/, and lib/. Revisit once ProviderStatus is extracted.

### Wave 2I — Inspected, not moved
- `lib/cb-control-center/dapPublicUxRules.ts` — file is pure (no Supabase/Next.js/React/server deps, only public UX model builder functions). Same blocker as Wave 2H: line 1 imports `ProviderStatus` from `'./types'` (`lib/cb-control-center/types.ts`). Moving to `lib/dap/registry/` would create the same `lib/dap/registry → lib/cb-control-center` back-dependency. Note: second import block is from `'../dap/site/dapPublicUxTypes'` which is already in `lib/dap/` — so the only blocker is `ProviderStatus`. 13 inbound importers (4 app/, 8 test files including dapPhase8B which has a path assertion at line 355). Revisit once ProviderStatus is extracted alongside dapDisplayRules and dapCmsTypes.

### Wave 2 — Summary
Wave 2 extracted 6 files. 3 files deferred pending ProviderStatus extraction (dapDisplayRules, dapPublicUxRules, dapCmsTypes). 1 file deferred pending types co-extraction (dapClientBuilderBillingRules). All deferred files are pure — no runtime blockers, only import-graph blockers.

## Wave 3A Addendum — ProviderStatus/PublicClaimLevel Extraction

- Source inspected: `lib/cb-control-center/types.ts`
- New DAP-owned type file: `lib/dap/registry/dapProviderStatusTypes.ts`
- Types extracted: `ProviderStatus`, `PublicClaimLevel`
- Importers updated (11 files):
  - `lib/dap/site/dapCmsTypes.ts` — `@/lib/cb-control-center/types` → `../registry/dapProviderStatusTypes` (key fix: breaks lib/dap → lib/cb-control-center dependency)
  - `lib/cb-control-center/dapDisplayRules.ts` — `./types` → `../dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/dapPublicUxRules.ts` — `./types` → `../dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/dapDisplayRules.test.ts` — `./types` → `../dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/dap-phase-tests/dapPhase2.test.ts` — `../types` → `../../dap/registry/dapProviderStatusTypes`
  - `components/dap-preview/ProviderStatusBadge.tsx` — alias → `@/lib/dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/source/dapSourceTypes.ts` — `../types` → `../../dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/source/dapSourceAdapter.ts` — `../types` → `../../dap/registry/dapProviderStatusTypes`
  - `lib/cb-control-center/dapCmsExport.ts` — split import (kept MockDentistPage from `./types`)
  - `components/cb-control-center/tabs/TemplatesTab.tsx` — split import (kept DentistTemplateId from `@/lib/cb-control-center/types`)
  - `lib/cb-control-center/mockData.ts` — unchanged, imports via re-export in types.ts (imports many co-located CBCC types alongside ProviderStatus)
- Compatibility re-export: YES — `lib/cb-control-center/types.ts` re-exports both types from `lib/dap/registry/dapProviderStatusTypes`. Required so types.ts can still reference them in `ProviderStatusSpec`, `DentistPageTemplate`, `MockDentistPage` interfaces, and for mockData.ts which bundles ProviderStatus with 13 other CBCC types in one import.
- Files intentionally not moved: `lib/cb-control-center/dapDisplayRules.ts`, `lib/cb-control-center/dapCmsTypes.ts`, `lib/cb-control-center/dapPublicUxRules.ts`
- Boundary result: `lib/dap/**` has zero imports from `lib/cb-control-center/**` (verified by grep)
- Validation: typecheck clean, 6260 tests pass, 0 lint errors, 50 warnings (baseline)
- Next wave: Wave 3B should re-inspect dapDisplayRules, dapCmsTypes, dapPublicUxRules — all three were blocked only on ProviderStatus/PublicClaimLevel which are now in lib/dap/.

## Wave 3B Addendum — Display Rules and Public UX Rules

- Files moved:
  - `lib/cb-control-center/dapDisplayRules.ts` → `lib/dap/registry/dapDisplayRules.ts`
  - `lib/cb-control-center/dapPublicUxRules.ts` → `lib/dap/registry/dapPublicUxRules.ts`
- Internal imports fixed in moved files:
  - `dapDisplayRules.ts`: `'../dap/registry/dapProviderStatusTypes'` → `'./dapProviderStatusTypes'`
  - `dapPublicUxRules.ts`: ProviderStatus path → `'./dapProviderStatusTypes'`; `'../dap/site/dapPublicUxTypes'` → `'../site/dapPublicUxTypes'`
- Inbound importers updated (29 total for dapDisplayRules, 13 for dapPublicUxRules):
  - 11 `components/dap-preview/` files — alias `@/lib/cb-control-center/dapDisplayRules` → `@/lib/dap/registry/dapDisplayRules`
  - 2 `app/preview/dap/` files — alias updated
  - `app/preview/dap/request/page.tsx` — both aliases updated
  - 6 `lib/cb-control-center/` files — relative `'./dapDisplayRules'` → `'../dap/registry/dapDisplayRules'`
  - 9 `lib/cb-control-center/source/` and `dap-phase-tests/` files — relative `'../dapDisplayRules'` → `'../../dap/registry/dapDisplayRules'`
  - 3 `app/` alias files for dapPublicUxRules
  - 7 `dap-phase-tests/` test files for dapPublicUxRules
- Path assertions updated: `dapPhase8B.test.tsx:355` — `lib/cb-control-center/dapPublicUxRules.ts` → `lib/dap/registry/dapPublicUxRules.ts`
- Boundary result: `lib/dap/**` has zero imports from `lib/cb-control-center/**` (verified by grep)
- Validation: typecheck clean, 6260 tests pass, 0 lint errors, 50 warnings (baseline)

## Wave 3C Addendum — Registry Boundary Closeout and File Classification

No files moved. Documentation-only wave. Establishes the canonical classification of all DAP files as of 2026-05-02.

---

### Bucket 1 — DAP registry complete (lib/dap/registry/)

14 files. All pure — no Supabase, no Next.js, no React, no server actions.

| File | Moved in |
|---|---|
| `dapProviderStatusTypes.ts` | Wave 3A |
| `dapDisplayRules.ts` | Wave 3B |
| `dapPublicUxRules.ts` | Wave 3B |
| `dapProviderParticipationTypes.ts` | Wave 1 |
| `dapProviderParticipationRules.ts` | Wave 2B |
| `dapPracticeOnboardingTypes.ts` | Wave 1 |
| `dapPracticeOnboardingRules.ts` | Wave 2C |
| `dapOfferTermsTypes.ts` | Wave 1 |
| `dapOfferTermsRules.ts` | Wave 2D |
| `dapOfferTermsReviewTypes.ts` | Wave 1 |
| `dapOfferTermsReviewRules.ts` | Wave 2E |
| `dapRequestTypes.ts` | Wave 1 |
| `dapRequestRules.ts` | Wave 1 |
| `dapMemberStatusRules.ts` | Wave 2F |

Invariant: `lib/dap/**` has zero imports from `lib/cb-control-center/**`.

---

### Bucket 2 — DAP-owned but outside registry (lib/dap/ subzones)

| File | Zone |
|---|---|
| `lib/dap/membership/dapMemberStatusTypes.ts` | membership |
| `lib/dap/site/dapCmsTypes.ts` | site |
| `lib/dap/site/dapPublicUxTypes.ts` | site |

These are correctly placed. No action needed.

---

### Bucket 3 — CBCC-owned forever (lib/cb-control-center/)

These files touch Supabase, server actions, admin workflows, stage machinery, communication pipelines, mocks, or simulation state. They belong in `lib/cb-control-center/` permanently.

**Request layer** (Supabase writes):
- `dapRequestActions.ts`, `dapRequestPersistence.ts`, `dapRequestAdmin.ts`

**Onboarding / participation / offer terms** (Supabase):
- `dapPracticeOnboarding.ts`, `dapPracticeOnboardingActions.ts`
- `dapProviderParticipation.ts`
- `dapOfferTerms.ts`, `dapOfferTermsReview.ts`

**Stage machinery** (Supabase + admin + AI review):
- `dapStageGates.ts`, `dapStageActions.ts`, `dapStageApprovalStore.ts`
- `dapStageStateResolver.ts`, `dapStageAiReviewLegacy.ts`, `dapStageReviewer.ts`
- `dapStagePart*.test.ts` (tests for stage machinery)

**Admin decision / ledger / visibility / audit**:
- `dapAdminDecisionAudit.ts`, `dapAdminDecisionAuditTypes.ts`
- `dapAdminDecisionLedger.ts`, `dapAdminDecisionLedgerTypes.ts`
- `dapAdminDecisionReadiness.ts`, `dapAdminDecisionSqlContract.ts`
- `dapAdminDecisionVisibility.ts`, `dapAdminDecisionWriteContract.ts`, `dapAdminDecisionWriteContractTypes.ts`
- `dapAdminEventTimeline.ts`
- `dapAdminRejectionEmailCopy.ts`, `dapAdminRejectionEmailPreview.ts`, `dapAdminRejectionEmailTypes.ts`
- `dapAdminRejectionVisibility.ts`

**Communication pipeline**:
- `dapCommunicationApprovals.ts`, `dapCommunicationApprovalTypes.ts`
- `dapCommunicationDispatchEvents.ts`, `dapCommunicationDispatchEventTypes.ts`
- `dapCommunicationDispatchReadiness.ts`, `dapCommunicationDispatchTypes.ts`
- `dapCommunicationDryRun.ts`, `dapCommunicationDryRunTypes.ts`
- `dapPracticeDecisionEmailCopy.ts`, `dapPracticeDecisionEmailPreview.ts`, `dapPracticeDecisionEmailTypes.ts`
- `dapMemberStatusEmailCopy.ts`, `dapMemberStatusEmailPreview.ts`, `dapMemberStatusEmailTypes.ts`
- `dapRejectionEmailQueue.ts`

**Publishing / build / discovery**:
- `dapPublishingPipeline.ts`, `dapBuildLedger.ts`
- `dapDiscoveryAuditArtifact.ts`, `dapTruthSchemaArtifact.ts`
- `dapBusinessDefinition.ts`

**Action catalog / availability** (admin UI, not yet inspected — see deferred):
- `dapActionAvailabilityRules.ts`, `dapActionCatalog.ts`, `dapActionCatalogTypes.ts`

**Mock / simulation / test infrastructure**:
- `mockData.ts`, `simulationStates.ts`
- `dapAdminWorkflowFixtures.ts`

**Claim QA and city data** (CBCC admin tooling):
- `dapClaimQA.ts`, `dapCityData.ts`

**CMS export** (Supabase-touching, large):
- `dapCmsExport.ts` (95K — move last if ever, Wave 5)

**source/ subdir** (Supabase adapters):
- `source/dapSourceAdapter.ts`, `source/dapSourceTypes.ts`, `source/dapSourceFixtures.ts`

**mkcrm/ subdir** (CBCC billing bridge — mostly stays):
- All `mkcrm/` files except the two deferred candidates below

**Compatibility re-export** (temporary, in `types.ts`):
- `export type { ProviderStatus, PublicClaimLevel }` — re-exported from `lib/dap/registry/dapProviderStatusTypes`. Remove once `mockData.ts` no longer bundles ProviderStatus with other CBCC types in a single import.

---

### Bucket 4 — Deferred candidates (candidate only — must be inspected before moving)

Each file below is a *candidate* for extraction. None have been inspected for this wave. Do not move without a dedicated inspect step.

| File | Likely destination if pure | Wave |
|---|---|---|
| `mkcrm/dapClientBuilderBillingTypes.ts` | `lib/dap/registry/` or `lib/dap/billing/` | 2G-2 |
| `mkcrm/dapClientBuilderBillingRules.ts` | same (blocked until types move first) | 2G-2 |
| `dapMemberStatusReadModel.ts` | `lib/dap/membership/` | 4A |
| `dapMemberStatusPreview.ts` | `lib/dap/membership/` | 4A |
| `dapMemberAdminSummary.ts` | `lib/dap/membership/` | 4A |
| `dapMemberStatusPublicTypes.ts` | `lib/dap/membership/` | 4A |
| `dapActionAvailabilityRules.ts` | `lib/dap/registry/` or `lib/dap/actions/` | 4B |
| `dapActionCatalog.ts` | same (depends on inspection) | 4B |
| `dapPublicSectionModels.ts` | `lib/dap/site/` | 5 |
| `dapPageBriefBuilder.ts` | `lib/dap/site/` | 5 |
| `dapCmsExport.ts` | last — only if Supabase layer is split out | 5 |

Stop conditions for each: touches Supabase, imports from `lib/cb-control-center/` non-type files, contains `'use server'`/`'use client'`, imports Next.js routing, or imports admin/action modules.

---

### Planned future waves

**Wave 4A** — member read model inspection
Inspect `dapMemberStatusReadModel.ts`, `dapMemberStatusPreview.ts`, `dapMemberAdminSummary.ts`, `dapMemberStatusPublicTypes.ts`. Target zone: `lib/dap/membership/`. Stop if any touch Supabase, admin actions, or route/UI concerns.

**Wave 4B** — action availability/catalog inspection
Inspect `dapActionAvailabilityRules.ts`, `dapActionCatalog.ts`. Target zone: `lib/dap/registry/` if pure domain rules; `lib/dap/actions/` if they model admin UI state. Resolve `dapActionCatalogTypes.ts` placement at same time.

**Wave 5** — content/page layer (last)
Inspect `dapPublicSectionModels.ts`, `dapPageBriefBuilder.ts`, then `dapCmsExport.ts` last. The CMS export is large and Supabase-touching; splitting its pure output shape from its Supabase fetch layer may be necessary before any move is possible.

---

## Wave 4B Addendum — Member Status Domain Files Into lib/dap/membership/

### Files moved
- `lib/cb-control-center/dapMemberStatusPublicTypes.ts` → `lib/dap/membership/dapMemberStatusPublicTypes.ts`
- `lib/cb-control-center/dapMemberStatusPreview.ts`     → `lib/dap/membership/dapMemberStatusPreview.ts`
- `lib/cb-control-center/dapMemberStatusReadModel.ts`   → `lib/dap/membership/dapMemberStatusReadModel.ts`

### Files intentionally not moved
- `lib/cb-control-center/dapMemberAdminSummary.ts` — imports `getDapMemberStatusEmailCopy` from the CBCC communication pipeline (`dapMemberStatusEmailCopy.ts`). That dependency is structural; the email copy module belongs in CBCC permanently. No extraction path without severing or abstracting the email dependency.

### Internal import fixes in moved files
- `dapMemberStatusPublicTypes.ts`: `'../dap/membership/dapMemberStatusTypes'` → `'./dapMemberStatusTypes'`
- `dapMemberStatusPreview.ts`: membership types → `'./dapMemberStatusTypes'`; rules → `'../registry/dapMemberStatusRules'`
- `dapMemberStatusReadModel.ts`: membership types → `'./dapMemberStatusTypes'`; rules → `'../registry/dapMemberStatusRules'`; `'./dapMemberStatusPublicTypes'` unchanged (co-located)

### Inbound importer updates (9 files)
- `app/preview/dap/member-status/[membershipId]/page.tsx` — alias → `@/lib/dap/membership/`
- `app/dental-advantage-plan/member-status/[membershipId]/page.tsx` — alias → `@/lib/dap/membership/`
- `app/preview/dap/members/[membershipId]/status/page.tsx` — alias → `@/lib/dap/membership/`
- `lib/cb-control-center/dapMemberAdminSummary.ts` — relative `'./...'` → `'../dap/membership/...'`
- `lib/cb-control-center/dapMemberStatusEmailPreview.ts` — relative `'./...'` → `'../dap/membership/...'`
- `dap-phase-tests/dapPhase10.test.ts` — relative imports + 6 path assertions updated to `join(ROOT, 'lib/dap/membership/...')`
- `dap-phase-tests/dapPhase11.test.ts` — relative import updated
- `dap-phase-tests/dapPhase2A.test.ts` — relative import updated
- `dap-phase-tests/dapPhase9R.test.ts` — relative import + `HELPER_PATH` updated to `lib/dap/membership/dapMemberStatusPreview.ts`
- `dap-phase-tests/dapPhase9S.test.ts` — relative import updated; string-presence checks unchanged (reads CBCC email preview file, string still present after its import update)

### Boundary validation
- No file under `lib/dap/membership/` imports from `lib/cb-control-center/**` (verified by grep)
- `dapMemberAdminSummary.ts` correctly imports moved files from `'../dap/membership/'`

### Validation
- typecheck: clean
- tests: 6260 pass, 1 skipped (baseline)
- lint: 0 errors, 50 warnings (baseline)

---

## Wave 4C Addendum — Member Admin and Email Boundary Inspection

Inspection-only wave. No files moved.

### Files inspected

| File | Imports from lib/dap/? | Imports from CBCC? | Consumers |
|---|---|---|---|
| `dapMemberStatusEmailTypes.ts` | Yes (`dapMemberStatusTypes`) | No | `dapMemberStatusEmailCopy.ts`, `dapMemberStatusEmailPreview.ts` |
| `dapMemberStatusEmailCopy.ts` | Yes (`dapMemberStatusTypes`) | Yes (`dapMemberStatusEmailTypes`) | `dapMemberAdminSummary`, `dapMemberStatusEmailPreview`, `dapCommunicationDispatchReadiness`, tests |
| `dapMemberAdminSummary.ts` | Yes (3 lib/dap/membership/ imports) | Yes (`dapMemberStatusEmailCopy`) | `app/preview/dap/member-admin-summary/page.tsx`, `dapPhase11.test.ts` |

### Classification

**`dapMemberStatusEmailTypes.ts` — Correctly retained in CBCC**

Pure types with one lib/dap/ import. Could move to `lib/dap/membership/` without creating a back-dependency (it has no lib/cb-control-center/ imports). However, nothing in `lib/dap/**` needs `DapMemberStatusEmailCopy` or `DapMemberStatusEmailTemplateKey` — email composition is a CBCC notification concern, not a membership domain concern. No extraction benefit.

**`dapMemberStatusEmailCopy.ts` — Correctly retained in CBCC**

Pure functions, no Supabase, no server, no React. But its role is confirmed CBCC communication pipeline: `dapCommunicationDispatchReadiness.ts` calls `isDapMemberStatusEmailCopySafe` as a pre-send safety check. This file drives the notification dispatch layer. Even though all functions are computationally pure, their purpose is to compose and validate member notification copy — a CBCC communication concern, not a DAP membership domain concern. Analogous: these are to the notification pipeline what `REQUEST_EXPECTATION_COPY` is to the public page layer — but the notification pipeline lives in CBCC, not lib/dap/.

**`dapMemberAdminSummary.ts` — Correctly retained in CBCC**

Admin-facing adapter that combines the pure membership read model (now in `lib/dap/membership/`) with CBCC communication layer state (`communicationTemplatesAvailable`, `communicationTemplateCount`). These are CBCC admin concerns — asking "can we send a notification to this member?" is an orchestration question, not a membership domain question. Only consumer is the CBCC admin preview page.

### Is any pure membership domain logic trapped?

No. The extraction is complete:
- Standing classification rules → `lib/dap/registry/dapMemberStatusRules.ts` ✓
- Member status types → `lib/dap/membership/dapMemberStatusTypes.ts` ✓
- Public read model types + builder → `lib/dap/membership/dapMemberStatusPublicTypes.ts`, `dapMemberStatusReadModel.ts` ✓
- Preview fixtures → `lib/dap/membership/dapMemberStatusPreview.ts` ✓

What remains in CBCC is exclusively communication-pipeline and admin-layer logic. No pure domain logic is trapped.

### Dependency direction

All CBCC → lib/dap/ imports are in the correct direction. No lib/dap/ file imports from lib/cb-control-center/. The boundary is clean and correctly drawn.

### Future extraction worth considering?

None. `dapMemberStatusEmailTypes.ts` is the only candidate (it has no CBCC imports) but there is no use case for the email copy shape inside lib/dap/. Freeze this boundary.

### Validation
- No source changes made
- typecheck: clean
- tests: 6260 pass, 1 skipped (baseline)
- lint: 0 errors, 50 warnings (baseline)

---

## Wave 5A Addendum — Provider / Practice Enrollment + Action Boundary Inspection

Inspection-only wave. No files moved.

### Files inspected

| File | Location | Imports from lib/dap/? | Imports from CBCC? |
|---|---|---|---|
| `dapActionCatalogTypes.ts` | `lib/cb-control-center/` | Yes (4 lib/dap/ types) | Yes (3 CBCC types) |
| `dapActionCatalog.ts` | `lib/cb-control-center/` | No | Yes (`dapActionCatalogTypes`) |
| `dapActionAvailabilityRules.ts` | `lib/cb-control-center/` | No | Yes (`dapActionCatalogTypes`, `dapActionCatalog`) |

### Type dependency detail — `dapActionCatalogTypes.ts`

Mixed imports:
- `DapRequestStatus` ← `lib/dap/registry/dapRequestTypes` ✓
- `DapMemberStanding` ← `lib/dap/membership/dapMemberStatusTypes` ✓
- `DapOfferTermsReviewStatus` ← `lib/dap/registry/dapOfferTermsReviewTypes` ✓
- `DapProviderParticipationStatus` ← `lib/dap/registry/dapProviderParticipationTypes` ✓
- `DapAdminDecisionReadinessStatus` ← `./dapAdminDecisionReadiness` **(CBCC)** ✗
- `DapCommunicationApprovalStatus` ← `./dapCommunicationApprovalTypes` **(CBCC)** ✗
- `DapCommunicationDryRunStatus` ← `./dapCommunicationDryRunTypes` **(CBCC)** ✗

The `DapActionAvailabilityContext` composite type aggregates 4 lib/dap/ status values together with 3 CBCC admin state values (`decisionReadinessStatus`, `communicationApprovalStatus`, `dryRunStatus`). This means the composite context is fundamentally CBCC admin state, not DAP domain state.

### Inbound importers

All CBCC admin workflow machinery:
- `app/preview/dap/action-catalog/page.tsx` — CBCC admin action catalog preview page
- `app/preview/dap/admin-decision-ledger/page.tsx` — CBCC admin decision ledger page
- `lib/cb-control-center/dapAdminDecisionLedger.ts` — uses `DAP_ACTION_DEFINITIONS`, `buildDapActionAvailabilityCatalog`, `DapActionAvailabilityContext`
- `lib/cb-control-center/dapAdminDecisionAuditTypes.ts` — uses `DapActionAuthoritySource`
- `lib/cb-control-center/dapAdminDecisionLedgerTypes.ts` — uses `DapActionAvailability`, `DapActionAuthoritySource`
- `lib/cb-control-center/dapAdminDecisionWriteContract.ts` — uses `DapActionAuthoritySource`
- `lib/cb-control-center/dap-phase-tests/dapPhase12.test.ts`

Zero non-CBCC consumers. Nothing in `lib/dap/**`, `app/` domain pages, or component files imports these.

### Classification

**`dapActionCatalogTypes.ts` — Stay put (blocked candidate)**

Three CBCC type dependencies block any extraction. More fundamentally, the `DapActionAvailabilityContext` composite type is the wrong level of abstraction for `lib/dap/` — it bundles DAP domain status values with CBCC admin pipeline state (`decisionReadinessStatus`, `communicationApprovalStatus`, `dryRunStatus`). Moving it would inject CBCC admin concerns into the DAP domain namespace.

**`dapActionCatalog.ts` — Stay put**

Static readonly array of action definitions, but `authoritySource: 'cb_control_center'` on the majority of entries makes the ownership explicit. This catalog defines what the *CB Control Center operator* can do at each enrollment workflow stage — approve requests, mark offer terms, manage communication approval. That is CBCC operator capability, not DAP product/domain behavior. The two `authoritySource: 'provider_submission'` entries are future-phase stubs that describe actions that don't exist yet.

**`dapActionAvailabilityRules.ts` — Stay put**

Computationally pure, but answers the wrong question for `lib/dap/`. The question is: *what can the CBCC operator click right now?* That is a CBCC admin affordance computation, not a DAP domain rule. Its input context spans all CBCC admin pipeline phases (decision readiness, communication approval, dry-run status) and its outputs drive the CBCC admin action panel UI. Every inbound importer is CBCC admin machinery.

### Is any pure DAP domain logic trapped?

No. The DAP domain artifacts these files depend on are already in `lib/dap/`:
- `DapRequestStatus` → `lib/dap/registry/dapRequestTypes` ✓
- `DapOfferTermsReviewStatus` → `lib/dap/registry/dapOfferTermsReviewTypes` ✓
- `DapProviderParticipationStatus` → `lib/dap/registry/dapProviderParticipationTypes` ✓
- `DapMemberStanding` → `lib/dap/membership/dapMemberStatusTypes` ✓

The action availability logic layers *on top of* those domain types — it is the CBCC admin view of the domain state, not the domain state itself. No extraction is needed or useful.

### Boundary conclusion

**Conclusion B: No Wave 5B move recommended.**

The provider/practice action boundary is CBCC admin workflow behavior. The three action files describe and compute what the CB Control Center operator can do across the DAP enrollment pipeline. They correctly belong in `lib/cb-control-center/`. Freeze this boundary.

### Validation
- No source changes made
- typecheck: clean
- tests: 6260 pass, 1 skipped (baseline)
- lint: 0 errors, 50 warnings (baseline)

---

## Validation checklist (per move)

```
pnpm typecheck   → must be clean
pnpm test        → must be 6260 pass
pnpm lint        → must be 0 errors, 50 warnings (baseline)
```
