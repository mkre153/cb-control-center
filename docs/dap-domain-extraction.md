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

## Validation checklist (per move)

```
pnpm typecheck   → must be clean
pnpm test        → must be 6260 pass
pnpm lint        → must be 0 errors, 50 warnings (baseline)
```
