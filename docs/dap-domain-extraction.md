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

## Planned waves

### Wave 1 remaining (pure types)
- dapMemberStatusTypes
- dapCmsTypes
- source/dapSourceTypes
- mkcrm/dapClientBuilderBillingTypes

### Wave 2 — Pure rules/logic (no Supabase)
- dapRequestRules
- dapProviderParticipationRules
- dapPracticeOnboardingRules
- dapOfferTermsRules
- dapOfferTermsReviewRules
- dapMemberStatusRules
- mkcrm/dapClientBuilderBillingRules
- dapDisplayRules
- dapPublicUxRules

### Wave 3 — Read models and content
- dapMemberStatusReadModel
- dapMemberStatusPreview
- dapMemberAdminSummary
- dapMemberStatusPublicTypes
- dapPublicSectionModels
- dapPageBriefBuilder
- dapBusinessDefinition
- dapClaimQA

### Wave 4 — Stage definitions extraction
Requires splitting `dapStageGates.ts` — pure stage business definitions → `lib/dap/stages/stageDefinitions.ts`, Supabase queries stay.

### Wave 5 — CMS / site (large, last)
- dapCmsExport.ts (95K)
- source/ files

## Files that stay in lib/cb-control-center/ (Supabase-touching)

Even when pure counterparts move, these stay:
- dapRequestAdmin.ts, dapRequestActions.ts, dapRequestPersistence.ts
- dapPracticeOnboarding.ts, dapPracticeOnboardingActions.ts
- dapProviderParticipation.ts, dapOfferTerms.ts, dapOfferTermsReview.ts
- All mkcrm/ files except dapClientBuilderBillingTypes/Rules
- dapCmsExport.ts (move last in Wave 5)

## Validation checklist (per move)

```
pnpm typecheck   → must be clean
pnpm test        → must be 6260 pass
pnpm lint        → must be clean (run before commit)
```
