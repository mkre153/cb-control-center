# CBCC Reorganization — Baseline & Rules

**Last updated:** Part 8C (commit `c20fc76`, 2026-05-01)

This document captures the current state of the CBCC / DAP code layout
after Part 8A–8C and the rules that govern future structural moves.
Future source-cluster relocations should start from the baseline below
and follow the rules below.

---

## Current clean validation baseline

All four gates exit 0 on `main`. Every future structural move must end
with the same four exits before being committed.

```bash
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors (warnings allowed but tracked)
pnpm test        # 5752 passed | 1 skipped (91 files)
pnpm build       # clean
```

Required scripts (defined in `package.json`):

```jsonc
{
  "packageManager": "pnpm@10.28.0",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "check": "pnpm typecheck && pnpm lint && pnpm test"
  }
}
```

---

## Current structure

```
lib/
  cbcc/                              ← generic CBCC engine (KEEP STABLE)
    types.ts                         core type registry
    projectRegistry.ts               pure project model + helpers
    stageLocking.ts                  predecessor-approval locking
    stageApproval.ts                 pure approval decision
    stagePageModel.ts                stage page model builder
    evidenceLedger.ts                append-only evidence ledger
    agentRuntime.ts                  generic agent runtime
    agentRegistry.ts                 generic agent registry
    aiReview.ts                      generic AI review (advisory)
    aiReviewProvider.ts              AI provider abstraction (Anthropic, etc.)
    adapters.ts                      CbccProjectAdapter interface
    coreBoundary.test.ts             scans engine source for vertical leakage
    index.ts                         public engine API
    ARCHITECTURE.md
    adapters/
      dap/                           ← DAP vertical adapter (KEEP STABLE)
        dapProject.ts                project identity
        dapStages.ts                 stage definitions + content
        dapArtifacts.ts              business definition + truth schema
        dapEvidence.ts               evidence helpers
        index.ts                     adapter export
        dapAdapter.test.ts
        dapAcceptance.test.ts

  cb-control-center/                 ← app-specific orchestration / legacy bridge
    (140 top-level files — refactor target)
    dap-phase-tests/                 ← historical DAP phase regression tests
      (51 files: dapPhase{1, 2, 2A-C, 4-6, 7A-G, 8A-C, 9A-9Z, 10-16})

  utils.ts                           shared utility (clsx wrapper)
```

### Engine boundary status

- `lib/cbcc/` runtime files contain **zero** vertical-language leakage
  (`DAP`, `dental`, `provider`, `patient`, `mkcrm`, `membership`,
  `practice`, `treatment`). Verified by `coreBoundary.test.ts`.
- `lib/cbcc/` runtime files import **zero** files from
  `lib/cb-control-center/`.
- 10 files in `lib/cb-control-center/` import from `lib/cbcc/` — all
  are intentional bridge/wiring code:
  - `cbccEngineRegistry.ts`
  - `cbccProjectPipelineTranslator.ts`
  - `cbccStagePageModelTranslator.ts`
  - `dapStageActions.ts`
  - `dapStageApprovalStore.ts`
  - `dapStageStateResolver.ts`
  - (plus matching `*.test.ts` files)

### Top-level file counts

| Location | Files |
|---|---:|
| `lib/cbcc/` (root, src + test) | 13 + 13 |
| `lib/cbcc/adapters/dap/` | 5 + 2 |
| `lib/cb-control-center/` (top-level) | 140 |
| `lib/cb-control-center/dap-phase-tests/` | 51 |

---

## Reorganization rules

These rules apply to every future structural move under this
workstream. Violating any one is grounds for reverting the phase.

1. **Keep `lib/cbcc/` stable** unless a concrete generic/DAP leakage
   issue is identified by `coreBoundary.test.ts` or a similar audit.
   The engine is clean today; do not refactor it for cosmetic reasons.

2. **Move source clusters incrementally.** Each phase relocates one
   prefix-cluster (e.g. `dapAdmin*`, `dapMember*`, `dapMkcrm*`). Do
   not batch unrelated clusters into one commit.

3. **One phase = one commit = one easy revert.** Each cluster move
   is a single atomic commit. If anything breaks, `git revert <SHA>`
   restores the prior state cleanly.

4. **Do not move routes during this workstream.** `app/` structure is
   out of scope. Public production URLs in `app/dental-advantage-plan/`,
   `app/guides/`, and `app/treatments/` must remain stable. Operator
   routes in `app/projects/` and `app/businesses/` must continue to
   render the same pages.

5. **Do not change runtime behavior during structural moves.** A move
   commit should contain only file relocations and import/path
   rewrites — no logic changes, no test assertion changes (except
   when forced by a path), no signature changes.

6. **Keep all four validation gates clean after every phase.** No
   committing while any gate is red. The cleanup phases (8B, 8B.5)
   exist precisely so that future moves can rely on these gates as
   honest signals.

7. **Test count must stay constant** unless a clearly explained
   reason justifies a delta (e.g. removing a redundant assertion as
   part of a documented fix). Baseline: `5752 passed | 1 skipped`.

8. **No production source touched** unless a lint/type rule running
   on the moved tests forces a minimal mechanical fix.

---

## Risk rules

Used to order the cluster-relocation phases and decide what belongs in
this workstream vs. a separate one.

1. **Test-only moves are lowest risk.** No callers outside the moved
   files; only path/import rewrites inside. Part 8C is the canonical
   example.

2. **Zero-import source clusters are next.** Files with 0 imports from
   `app/` and `components/` can move without touching any caller.
   Examples: `dapSource*`, `clientBuilder*`.

3. **Bridge, stage-content, public, and route-layer changes are
   high risk.** Bridge files (`cbccEngineRegistry`, translators,
   Part 7 wiring) sit on the engine-↔-app seam. Stage content
   (`dapStageGates.ts`, 17 imports) and public UX (`dapPublicUx*`,
   34 imports) have the broadest caller surface. Route-layer changes
   touch live URLs. None of these belong in early phases; they should
   land last and be validated with live smoke tests.

4. **AI-review duplicate resolution is runtime consolidation, not
   structural cleanup.** Cutting `app/api/businesses/dental-advantage-plan/stages/review/route.ts`
   from the legacy `dapStageReviewer.ts` over to the generic
   `lib/cbcc/aiReview.ts` + DAP adapter changes runtime wiring —
   not file location. It belongs in its own future part with its own
   verification (curl the API, confirm advisory-only invariants, etc.),
   and must not be mixed into a structural-move commit.

---

## Phases completed

| Phase | Description | Commit |
|---|---|---|
| 8A — Tooling | pnpm pin, typecheck/check scripts, kill stale `package-lock.json` | `7e821ed` |
| 8B — TS gate | Fix 16 pre-existing TS errors in test files | `71a89e0` |
| 8B.5 — Lint gate | Fix 75 pre-existing lint errors (require imports, unescaped JSX entities, html-link-for-pages, setState-in-effect) | `3be40d1` |
| 8C — Phase tests folder | Move 51 historical `dapPhase*.test.{ts,tsx}` into `dap-phase-tests/` | `c20fc76` |

---

## Next proposed phase (NOT YET STARTED)

**Phase 3 / Part 8D — Low-risk / zero-import source clusters.**

Target candidates (in expected order of safety):

| Cluster | Files | App+component imports | Risk |
|---|---:|---:|---|
| `mkcrm/` (`dapMkcrm*`) | 8 | 2 | low |
| `source/` (`dapSource*`) | 4 | 0 | low |
| `client/` (`clientBuilder*`) | 3 | 0 | low |
| `architecture/` (`siteArchitecture*`) | 3 | 2 | low |
| `action/` (`dapAction*`) | 3 | 4 | low |

Each cluster moves on its own commit, validated against all four
gates, before the next cluster begins.

**Do not start Phase 3 / Part 8D until explicitly approved.**

---

## What is explicitly OUT OF SCOPE for this workstream

- Route consolidation (`app/businesses/...` → `app/projects/...`)
- Public URL changes (`app/dental-advantage-plan/...`,
  `app/guides/...`, `app/treatments/...`)
- Resolving the AI-review duplicate (`dapStageReviewer.ts` is wired
  into the live API; `lib/cbcc/aiReview.ts` is built but unwired —
  the cutover is medium-risk and belongs in its own future part)
- Splitting giant files (`dapCmsExport.ts` 1414 LOC,
  `mockData.ts` 1053 LOC)
- Migrating `dapStageGates.ts` content into `lib/cbcc/adapters/dap/`
  (most-imported file in the repo, deferred until clusters settle)
- Supabase migration changes
- CBCC engine logic changes
- DAP product logic changes

---

## Part 8X Addendum — Route Repair + Rubric Layer Inspection

**Date:** 2026-05-01 (later same day as Part 8C)
**Type:** Runtime repair + UX bug fix + advisory rubric layer.
**Not a structural-move phase** — Risk rules 5–8 (no runtime change /
constant test count) do **not** apply here. This is the runtime work
foreshadowed by Risk rule #4 ("AI-review duplicate resolution is
runtime consolidation"), but only the route-repair and rubric portion;
the duplicate resolution itself remains deferred.

### 1. What was broken

- **v2 routes returned 404 on the "Get Opus 4.7 Review" button.** The
  panel posted `{stageSlug}` only. The legacy review route resolved
  by full DAP slug (`"3-truth-schema"`).
- **Slug mismatch source.** Both v2 stage-page builders set
  `slug: String(stageNumber)` instead of the canonical DAP slug:
  - `lib/cb-control-center/cbccStagePageModelTranslator.ts:163`
    (engine-backed DAP path)
  - `lib/cb-control-center/cbccProjectStageAdapter.ts:49`
    (generic v2 projects path)
- **404 behavior.** Route called `getDapStageGateBySlug("3")` →
  `undefined` → returned 404. Fail-closed for an advisory channel
  (no safety impact), but the button was effectively broken on every
  v2 stage detail page, including for the DAP project itself when
  reached via `/projects/dental-advantage-plan/stages/N`.
- **Cross-project leak risk.** If the route had been "fixed" by
  numeric fallback alone, a generic v2 project (e.g. `acme-co`)
  posting `stageNumber: 3` would have received DAP's Stage 3 truth
  schema review — masquerading as that project's review. This was
  latent risk, not yet exercised.

No CBCC engine logic, locking logic, or approval logic was broken.
The four advisory-only invariants from the original Part 8X audit
remained true in the broken state — the fail-closed 404 was the
visible symptom.

### 2. What was repaired

**Files changed (8):**

| File | Change |
|---|---|
| `app/api/businesses/dental-advantage-plan/stages/review/route.ts` | Body shape now `{projectSlug?, stageSlug?, stageNumber?}`. Resolves by slug → falls back to number. `projectSlug` guard returns 404 for any non-DAP slug. |
| `lib/cb-control-center/dapStageGates.ts` | Added `getDapStageGateByNumber(n)` helper. |
| `lib/cb-control-center/dapStageReviewer.ts` | Threads stage rubric into system prompt. User payload now includes `advisoryNotice`, `projectSlug: 'dental-advantage-plan'`, and `rubric`. |
| `lib/cb-control-center/dapStageRubrics.ts` | NEW. Data-driven 7-stage rubric map. |
| `components/cb-control-center/StageAiReviewPanel.tsx` | Added optional `stageNumber?` and `projectSlug?` props; both posted to API. |
| `components/cb-control-center/StageDetailPage.tsx` | Added optional `projectSlug?` prop forwarded to panel. v1 caller passes nothing → defaults preserve old behavior. |
| `app/projects/[slug]/stages/[stageNumber]/page.tsx` | Passes `projectSlug={slug}` to `StageDetailPage`. |
| (test files) | See below. |

**Routes restored / verified:**

- ✓ Legacy v1: `/businesses/dental-advantage-plan/build/stages/3-truth-schema` — slug lookup hits, behavior unchanged.
- ✓ v2 DAP: `/projects/dental-advantage-plan/stages/3` — slug lookup misses ("3" not a DAP slug), falls back to `stageNumber=3`, resolves DAP gate 3.
- ✓ v2 generic: `/projects/<other>/stages/N` — `projectSlug` guard returns 404 with explicit "not yet supported" message. Generic v2 projects no longer leak DAP review output.

**Tests added (30 new, total 5782 passed / 1 skipped, +30 from baseline 5752):**

- `lib/cb-control-center/dapStageRubrics.test.ts` (NEW) — 4 groups:
  data integrity (7 rubrics, no gaps, ≥2 focus areas + ≥2 red flags
  each), lookup, format-for-prompt, Stage 3 truth-schema coverage.
- `app/api/businesses/dental-advantage-plan/stages/review/route.test.ts` (NEW)
  — 7 groups: static safety invariants (no supabase / no approval-action
  imports / POST-only), input validation (400), `projectSlug` guard,
  legacy slug resolution, v2 numeric resolution, approval-action
  decoupling (re-asserted), no DB schema column. Mocks `reviewStage` so
  no real Anthropic calls in CI.
- `lib/cb-control-center/dapStageReviewer.test.ts` — +3 assertions:
  rubric threaded, payload contains `rubric:` and `advisoryNotice:`,
  "owner approval is separate" copy present.

**Validation commands run (all clean):**

```bash
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors (49 pre-existing warnings; none in new files)
pnpm test        # 5782 passed | 1 skipped (was 5752; +30 new)
pnpm build       # succeeded; one pre-existing NFT-trace warning on next.config.ts
```

### 3. Rubric layer status

**Current location:** `lib/cb-control-center/dapStageRubrics.ts`.

**Where it belongs by content:**

- The rubric content is unambiguously **DAP-specific** (references
  truth schema, StoryBrand, Core30, AEO, dental claim safety, the 7
  named DAP stages by headline). It does **not** belong in
  `lib/cbcc/` core — placing it there would re-introduce vertical
  language to the engine and trip `coreBoundary.test.ts`.
- The cleaner long-term home is `lib/cbcc/adapters/dap/dapRubrics.ts`,
  consistent with how `dapStages.ts` and `dapArtifacts.ts` already sit
  inside the DAP adapter folder. The rubric is structurally an
  adapter-supplied input to the (eventual) generic AI-review engine.
- For today, the file lives in `lib/cb-control-center/` because the
  legacy reviewer (`dapStageReviewer.ts`) is also there and they are
  imported from each other. Keeping them colocated is consistent with
  the existing legacy bridge cluster.

**Leakage check — DAP-specific logic into generic CBCC:**

- `lib/cbcc/aiReview.ts` and `lib/cbcc/aiReviewProvider.ts` —
  unchanged in this pass. Still zero imports of `dapStageRubrics`,
  `dapStageReviewer`, `DAP_STAGE_RUBRICS`, or any other DAP symbol.
  Verified by grep: `grep -rln "dap" lib/cbcc/*.ts` returns nothing.
- `coreBoundary.test.ts` — the existing CBCC engine boundary test
  was already passing pre-repair and continues to pass post-repair.
  No DAP language was added to `lib/cbcc/`.
- The rubric type (`DapStageRubric`) is intentionally DAP-prefixed;
  if/when migrated under the adapter, a parallel generic
  `CbccStageRubric` type can be added to the engine and the DAP
  rubric becomes its first concrete instance.

**Conclusion:** No DAP-specific rubric logic is leaking into generic
CBCC today. Future migration into `lib/cbcc/adapters/dap/` is a
clean structural move (per Phase 3 / Part 8D pattern), not a redesign.

### 4. Architecture implications

This pass **confirms** the recommendations in the doc above:

- Risk rule #4 (AI-review consolidation belongs in its own future
  part with its own verification) is reaffirmed. Today's pass is
  consistent with that rule — it improved the legacy reviewer and
  added route-level safety asserts, but **did not** wire
  `lib/cbcc/aiReview.ts`. The duplicate remains.
- The folder split between `lib/cbcc/`, `lib/cb-control-center/`,
  and `lib/cbcc/adapters/dap/` remains appropriate. The repair
  added one new file and edited five existing ones, all in their
  natural homes; no structural move was needed.
- The "out-of-scope: Resolving the AI-review duplicate" line in the
  workstream remains accurate. Today's work does not cross that line
  — `dapStageReviewer.ts` is still the sole production review path.

**Additional migration that would now be cleaner than before:**

- Move `dapStageRubrics.ts` and `dapStageReviewer.ts` into
  `lib/cbcc/adapters/dap/` alongside `dapStages.ts`. Pure relocation;
  no logic change. Fits the Phase 3 / Part 8D template (low-risk,
  test-validated, single commit).
- Once relocated, the eventual cutover to `lib/cbcc/aiReview.ts`
  becomes a same-folder swap inside the DAP adapter, drastically
  reducing the surface area of Risk rule #4's "medium-risk" cutover.

### 5. Risks / open questions

**Still duplicated:**

- `dapStageReviewer.ts` (legacy, live) vs `lib/cbcc/aiReview.ts`
  (generic, unwired). Decision vocabulary diverges — legacy returns
  `'approve' | 'disapprove' | 'request_revision'`; generic returns
  `'pass' | 'pass_with_concerns' | 'fail' | 'inconclusive'` and
  forbids "approve" in its action set. This is fine while only the
  legacy path is wired, but the cutover must reconcile the two.

**Still hardcoded:**

- The review route remains DAP-hardcoded by URL
  (`app/api/businesses/dental-advantage-plan/stages/review/route.ts`).
  Today's `projectSlug` guard makes that hardcoding explicit and
  enforced at runtime, but the route path itself still encodes the
  business slug. Generic v2 projects fail closed (404) by design.
- The 7 DAP truth rules are still inline in `dapStageReviewer.ts`
  (not loaded from `dapStages.ts` or the engine). Acceptable while
  the reviewer is DAP-only; should be lifted into the rubric or
  adapter when the cutover happens.

**Future route drift:**

- The slug-mismatch root cause (`String(stageNumber)`) still exists
  in `cbccStagePageModelTranslator.ts:163` and
  `cbccProjectStageAdapter.ts:49`. The repair handled it at the
  consumer side (the route accepts both forms). If a future caller
  re-introduces a similar slug shape mismatch, the route is now
  resilient — but the underlying field is still misnamed. Worth
  renaming `slug → stageRef` (or making the field accurately reflect
  that it is the stage number string) in a future structural pass.

**CBCC bypass risk:**

- None introduced. The 6 invariants still hold (route-test-asserted):
  reviewer imports no Supabase; no mutation API; approval actions
  import no review symbols; no DB column for AI review; route source
  imports no approval action; `projectSlug` guard prevents non-DAP
  projects from hitting DAP review logic.
- Theoretical: if a future generic project ever adopted the literal
  slug `dental-advantage-plan`, the guard would let it through. This
  is impossible by design (DAP is the singleton owner of that slug),
  but worth flagging.

### 6. Final recommendation

**Minor cleanup only — do not promote to a Part 9 yet.**

The repair pass landed cleanly with all four gates green and no
structural move. The recommended next action is a small **Phase 3 /
Part 8D-style** relocation of two files into the DAP adapter, in a
single test-validated commit:

```
lib/cb-control-center/dapStageReviewer.ts   →  lib/cbcc/adapters/dap/dapStageReviewer.ts
lib/cb-control-center/dapStageRubrics.ts    →  lib/cbcc/adapters/dap/dapRubrics.ts
```

Both have shallow caller graphs (route + tests + reviewer ↔ rubrics
internal cycle). Fits the existing cluster-relocation template.

**Defer to a future controlled Part 9 migration:** the actual
generic-engine cutover (`dapStageReviewer.ts` → `lib/cbcc/aiReview.ts`).
Risk rule #4 still applies; today's repair did not change that
calculus, only made the eventual cutover smaller in surface area.

**Do not** undertake either of those without explicit approval — the
present state is correct, tested, and stable.

---

# Part 9 Addendum — Navigation Integrity and Bypass Risk Review

**Date:** 2026-05-01 (closure pass for Part 8 work)
**Type:** Inspection-first integrity audit. No file moves, no route
renames, no business-logic changes. The audit confirmed the system is
coherent and produced no must-fix repairs; only the documentation and
the new test count baseline are updated below.

## 1. Route Map

| Route | File | Source of Data | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | `listProjects()` + `mergeProjectsWithEngineBacked()` | OK |
| `/projects` | `app/projects/page.tsx` | `redirect('/')` | OK |
| `/projects/[slug]` | `app/projects/[slug]/page.tsx` | DAP: `translateDapProjectForPipeline()`. Other: `getProjectBySlug` + `getProjectStages` | OK |
| `/projects/[slug]/charter` | `app/projects/[slug]/charter/page.tsx` | charter store | OK (not in scope this audit) |
| `/projects/[slug]/stages/[stageNumber]` | `app/projects/[slug]/stages/[stageNumber]/page.tsx` | DAP: `buildDapStageGateFromEngine(n)` w/ approval overlay. Other: `buildGenericStageGate(project, row)` | OK |
| `/projects/dental-advantage-plan` | same as `[slug]` (slug `=dental-advantage-plan`) | engine adapter | OK |
| `/projects/dental-advantage-plan/stages/1`–`/7` | same as `[stageNumber]` (n = 1..7) | engine adapter (`DAP_STAGE_DEFINITIONS`) | OK |
| `/projects/new` | `app/projects/new/page.tsx` | new-project form | OK (not in scope this audit) |
| `/businesses/dental-advantage-plan` | `app/businesses/dental-advantage-plan/page.tsx` | legacy v1 — still live | OK |
| `/businesses/dental-advantage-plan/build` | `app/businesses/dental-advantage-plan/build/page.tsx` | legacy v1 — `DAP_STAGE_GATES` | OK |
| `/businesses/dental-advantage-plan/build/stages/[stageSlug]` | `app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx` | legacy v1 — `getDapStageGateBySlug` (slugs `business-definition`, `discovery-audit`, `truth-schema`, `positioning-storybrand`, `seo-aeo-content`, `architecture-wireframes`, `build-qa-launch`) | OK |
| `/api/businesses/dental-advantage-plan/stages/review` (POST) | `app/api/businesses/dental-advantage-plan/stages/review/route.ts` | `dapStageReviewer.reviewStage()` (advisory) | OK (Part 8X repair) |
| `/api/dap/requests` | `app/api/dap/requests/route.ts` | DAP request intake | OK (not in scope this audit) |

Both v2 and legacy v1 stage routes are live and reachable. v2 hydrates
from the DAP adapter via the engine; legacy v1 still reads
`DAP_STAGE_GATES` directly. Both render `<StageDetailPage>` with the
same component surface — content density differs only by which data
path populates the gate object.

## 2. Stage Detail Page Status

For each DAP stage, the engine-backed v2 path produces a
`DapStageGate` shape the `<StageDetailPage>` component renders. The
checks below are derived by reading the data path
(`buildDapStageGateFromEngine` → `translateModelToGate`) and the
component (`StageDetailPage.tsx`), and are reinforced by existing
test groups noted in column "Test Coverage".

| Stage | Title | Number | Project Slug | Status Badge | Locked Render | Prerequisite Shown | Purpose | Required Artifact | Expected Evidence | Approval Gate | AI Review Display-only | Cannot Self-Approve | Test Coverage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Stage 1 — Business Intake / Definition | 1 | dental-advantage-plan | ✓ | n/a (no predecessor) | n/a | ✓ | ✓ artifact | ✓ | ✓ via `DapStageOwnerApprovalForm` (when blockers cleared) | ✓ | ✓ — `approveDapStage` requires non-locked; Stage 1 has no predecessor | `StageDetailPage.test.tsx` G1+G2, `dapStagePart7.test.ts`, `cbccStageLocking.test.ts` G1 |
| 2 | Stage 2 — Discovery / Scrape / Existing Asset Audit | 2 | dental-advantage-plan | ✓ | ✓ "Directive Preview — Locked" red banner + locked rationale | ✓ "Stage 1 must be owner-approved" | ✓ | ✓ artifact (placeholder until generated) | ✓ | ✓ form gated on `blockers.length === 0 && !approvedByOwner` | ✓ | ✓ — `isStageLocked(effectiveProject, def.id)` enforces predecessor | `cbccStageLocking.test.ts` G2+G3, `lockedStageDirectiveUx.test.tsx` |
| 3 | Stage 3 — Truth Schema / Compliance / Claims Lock | 3 | dental-advantage-plan | ✓ | ✓ same locked rendering | ✓ "Stage 2 must be owner-approved" | ✓ | ✓ artifact | ✓ | ✓ same gate | ✓ | ✓ same enforcement | `cbccStageLocking.test.ts` G3, `dapAcceptance.test.ts` |
| 4 | Stage 4 — Positioning / StoryBrand / Messaging | 4 | dental-advantage-plan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `cbccStageLocking.test.ts` G3 |
| 5 | Stage 5 — SEO / AEO / Core30 / Content Strategy | 5 | dental-advantage-plan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `cbccStageLocking.test.ts` G3 |
| 6 | Stage 6 — Page Architecture / Wireframes / Content Briefs | 6 | dental-advantage-plan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `cbccStageLocking.test.ts` G3 |
| 7 | Stage 7 — Build / QA / Launch | 7 | dental-advantage-plan | ✓ | ✓ "Directive Preview — Locked" with red warning | ✓ "Stage 6 must be owner-approved" | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `lockedStageDirectiveUx.test.tsx` G1 |

Locked stages render a useful detail page, not a 404, with these
sections: stage header + status badge, anti-bypass banner, purpose,
"Reviewable Artifact — not generated yet" placeholder, evidence trail,
"Directive Preview — Locked" red-banner section (warning that the
directive is "visible for planning only" and "not authorized for
execution until all blockers are cleared and the prior stage is
owner-approved"), blockers, next-stage unlock rule, and the advisory
Opus 4.7 review panel. Tests assert this in
`lockedStageDirectiveUx.test.tsx`.

Invalid stage numbers (≤ 0, ≥ 8, non-integer) hit `notFound()` in the
v2 page (line ~22 of `app/projects/[slug]/stages/[stageNumber]/page.tsx`).

**No new tests added in Part 9 — existing coverage matrix is sufficient.**

## 3. Boundary Integrity

| Question | Answer | Source |
|---|---|---|
| Does `lib/cbcc/` import anything from DAP? | **No.** | `grep -rln "adapters/dap" lib/cbcc/*.ts` returns only `lib/cbcc/adapters.test.ts` and `lib/cbcc/index.ts`; the index re-exports `./adapters` (the generic adapter contract), not `./adapters/dap`. |
| Does `lib/cbcc/` import from `lib/cb-control-center/`? | **No.** | Asserted by `lib/cbcc/coreBoundary.test.ts` (4 describe blocks, including "test files do not import restricted runtimes"). |
| Does generic CBCC contain DAP-specific stage names, slugs, claims, or business rules? | **No.** | `coreBoundary.test.ts` greps each `lib/cbcc/*.ts` runtime file for `\bDAP\b`, `\bdental\b`, `\bpatient\b`, `\bpractice\b`, `\bprovider\b`, `\bmkcrm\b`, `\bmembership\b`, `\btreatment\b` — all return zero hits. |
| Does the DAP adapter depend on generic CBCC through clean interfaces? | **Yes.** | `lib/cbcc/adapters/dap/index.ts` imports `CbccProjectAdapter`, `createProjectAdapter` from generic engine; exports `DAP_ADAPTER`, `DAP_PROJECT`, `DAP_STAGE_DEFINITIONS` for downstream use. No deep imports into engine internals. |
| Are there duplicate stage systems still competing? | **Partially — by design.** | Two systems coexist: (a) generic `CBCC_STAGE_DEFINITIONS` via `lib/cbcc/adapters/dap/dapStages.ts` (engine-canonical, used by v2 routes); (b) legacy `DAP_STAGE_GATES` in `lib/cb-control-center/dapStageGates.ts` (v1-only, used by `/businesses/dental-advantage-plan/build/stages/[slug]` routes). The Risk-rule-#4 cutover (deferred) is what eventually retires (b). |
| Are there files in `lib/cb-control-center/` that should eventually move but should not move in Part 9? | **Yes — at least 4 candidates.** | `dapStageReviewer.ts`, `dapStageRubrics.ts`, `dapStageGates.ts`, `dapStageActions.ts`. All belong long-term in `lib/cbcc/adapters/dap/` but each move has shallow caller graphs that make them safe Part 8D-style relocations. **Deferred per directive.** |

### Boundary Findings

| Finding | Severity | Fix Now? | Reason |
|---|---|---|---|
| `lib/cbcc/coreBoundary.test.ts` references DAP-language regex patterns explicitly | Low | No | Test fixture only — these are negative assertions ("source files must NOT contain DAP language"). Correct pattern. |
| `lib/cb-control-center/dapStageReviewer.ts` lives outside the DAP adapter folder | Low | No | Out of scope for Part 9; recommended Part 10/Part 8D-style relocation. |
| `lib/cb-control-center/dapStageGates.ts` (v1 registry) duplicates engine stage data | Medium | No | Risk rule #4 — runtime cutover, not a structural move. Belongs in a separate future part with curl-level verification. |
| `lib/cbcc/aiReview.ts` is built but unwired | Medium | No | Same reason — Risk rule #4. |

**No high-severity findings.** No fixes applied in Part 9.

## 4. CBCC Bypass Risk

| Risk | Current Protection | Gap | Recommendation |
|---|---|---|---|
| Agent creates DAP pages without stage approval | Stage lock model + `isStageLocked(effectiveProject, def.id)` enforcement at `dapStageActions.ts:86` | A future agent could still author pages directly under `app/dental-advantage-plan/` without touching CBCC. The lock model gates stage approval, not file creation. | Document in CLAUDE.md: "no new public DAP pages without prior CBCC stage approval." Consider Part 10 policy test that scans for new files under `app/dental-advantage-plan/` against the latest approved stage. |
| Stages marked complete without evidence | Approval action requires `approvedBy`; engine `isStageLocked` requires predecessor approval; idempotent reject for already-approved | Today the approval action does NOT independently require `evidenceLedger` entries (the engine's `evidenceLedger.ts` is a primitive but no approval flow consumes it as a precondition) | Part 10 candidate: gate `approveDapStage` on a minimum evidence count or a definition-supplied `requiredEvidence` set. |
| AI review used as approval | `dapStageReviewer.ts` returns advisory JSON only; route imports no approval action; approval actions import no review symbols. 6 invariants asserted by route + reviewer tests. | None at the type/runtime level. Theoretical: a future component could read the AI review result and auto-submit the approval form — but that requires an active code change. | Document the invariant in `CLAUDE.md` and keep the `route.test.ts` Group 6 + 7 assertions as guardrails. |
| Owner approval skipped | `approveDapStageAction` requires `approvedBy` form field; rejects empty string; charter approval requires `approvedBy` and an existing `charterJson` | None. Stage 1 unlock requires charter approval first; each subsequent stage requires the previous stage approved. | Adequate. |
| Stage status mutated directly | All stage status writes go through `getDapStageApprovalStore().approve()` (single store) and the charter approval write to Supabase. No other server actions write to stage status. | A future direct Supabase migration could in theory modify stage rows, but that's a one-way migration audit concern, not runtime. | Adequate at runtime. |
| Business-specific rules written into generic core | `coreBoundary.test.ts` enforces zero DAP language in `lib/cbcc/*.ts` runtime files | None at the test level. A future contributor must run tests; CI must enforce. | Adequate while CI runs the test suite. |
| Future stages reached without prior approval | Engine `computeStageVisibilities` + `isStageLocked` enforce sequential unlocking. `cbccStageLocking.test.ts` Group 3 asserts approving stages 1..k unlocks exactly stage k+1. | None. | Adequate. |

No must-fix bypass risks identified. The asymmetric weakness is that
**evidence is observable but not enforced** as an approval
precondition — that's a Part 10 candidate, not a Part 9 repair.

## 5. Repairs Made

**None.** All Step 5 trigger conditions are absent:

- No route 404s. (Part 8X repair covered the previously-known case.)
- All stage cards link to existing routes via `/projects/${slug}/stages/${stageNumber}`.
- Locked stages render the full `<StageDetailPage>` with the locked-directive variant — confirmed by reading the component and by `lockedStageDirectiveUx.test.tsx`.
- Generic CBCC has no DAP imports — confirmed by grep + `coreBoundary.test.ts`.
- DAP logic is not duplicated in generic core. Where DAP logic lives in `lib/cb-control-center/`, it is not in `lib/cbcc/`. Two stage registries (v1 `DAP_STAGE_GATES` + v2 `DAP_STAGE_DEFINITIONS`) coexist by design pending the deferred Risk-rule-#4 cutover.
- Approval/locking behavior is intact — `isStageLocked` enforcement at `dapStageActions.ts:86`, predecessor-approval requirement, idempotent rejection of already-approved.
- Tests do not falsely pass — yesterday's 30 new tests assert the route shape that the panel actually posts, with the project guard exercised.

## 6. Remaining Cleanup

Carried forward from Part 8X (still deferred, still correct deferrals):

| Item | Class | When |
|---|---|---|
| Move `dapStageReviewer.ts` + `dapStageRubrics.ts` into `lib/cbcc/adapters/dap/` | Structural — Part 8D template | Future controlled directive. Pure file relocation, single commit. |
| Migrate `dapStageGates.ts` content into the engine via the adapter | Runtime cutover (Risk rule #4) | Separate future part with curl-level verification. |
| Wire `lib/cbcc/aiReview.ts` to replace `dapStageReviewer.ts` | Runtime cutover (Risk rule #4) | Same future part as above; surface area shrinks once the relocation above is done. |
| Rename misleading `slug: String(stageNumber)` field | Cosmetic — naming clarity | Low priority; route-level fix in Part 8X already neutralized the impact. |

New observations from Part 9:

| Item | Class | When |
|---|---|---|
| Approval flow does not require `evidenceLedger` entries as precondition | Architecture risk (mild) | Part 10 candidate — "evidence-gated approval." |
| No policy test scans `app/dental-advantage-plan/` for files added without a corresponding approved stage | Architecture risk (mild) | Part 10 candidate — "page-creation-after-approval guard." |
| Test count baseline in this doc still reads `5752 passed | 1 skipped` from Part 8C | Documentation-only | Updated below. **New baseline: `5782 passed | 1 skipped`** (Part 8X added 30 tests). Future structural-move phases (Risk rule #7) should compare against 5782, not 5752. |

## 7. Final Recommendation

**CBCC is structurally safe to continue building on.**

- DAP is correctly isolated as an adapter under `lib/cbcc/adapters/dap/`.
- Each of Stages 1–7 opens to a full `<StageDetailPage>` via the v2 route; locked stages render meaningful read-only content with explicit lock rationale; legacy v1 routes remain live and unchanged.
- Generic CBCC core (`lib/cbcc/*.ts`) is verifiably free of DAP language and DAP imports — asserted by `coreBoundary.test.ts`.
- Approval and lock semantics enforce predecessor approval; AI review is structurally advisory-only by 6 route+reviewer invariants asserted in tests.
- No major route or folder migration is required now. The recommended Part 8D-style relocation of `dapStageReviewer.ts`+`dapStageRubrics.ts` remains optional and deferred.

**Should we proceed to the next product phase?** Yes — Part 10.

**Should more folder migration happen now or later?** Later. None of
the deferred relocations block product work. Risk rule #4 still
applies to the runtime cutover.

**Part 10 focus (recommendation):**

The audit surfaced two specific, bounded gaps that would make CBCC
*proactive* instead of merely *protective*:

1. **Evidence-gated approval.** Today `approveDapStage` requires
   `approvedBy` and predecessor approval but does not require any
   evidence-ledger entries. The engine has `evidenceLedger.ts` as a
   primitive; threading it as an approval precondition (per-stage
   minimum evidence count or definition-supplied required-evidence
   set) is the next force-multiplier.
2. **Page-creation-after-approval guard.** A test or pre-commit
   check that flags new files under `app/dental-advantage-plan/`,
   `app/guides/`, or `app/treatments/` if their target stage isn't
   yet owner-approved. Today the lock model gates *stage approval*,
   not *file creation* — Part 10 would close that asymmetry.

These two together deliver "next allowed action" semantics without
new orchestration, schema changes, or DAP business-logic edits.

Update Part 10 should NOT include: agent orchestration changes,
new database features beyond what evidence-gating requires, route
moves, or DAP product redesign.

---

# Part 10 Addendum — Evidence-Gated Approval and Next Allowed Action

**Date:** 2026-05-01
**Type:** Enforcement primitives. Pure additions to the engine (`lib/cbcc/`)
+ DAP adapter wiring + one server-action change. No route moves, no DB
schema changes, no UI redesign, no DAP business-logic changes.

## 1. What Changed

| Layer | Change |
|---|---|
| Generic CBCC engine | Added `canApproveStageWithEvidence` predicate to `lib/cbcc/stageApproval.ts`. Added `getNextAllowedAction` engine to `lib/cbcc/nextAllowedAction.ts`. Added `enforcePageCreationPolicy` to `lib/cbcc/pageCreationPolicy.ts`. All three pure, deterministic, no I/O. |
| DAP adapter | Added `DAP_STAGE_REQUIRED_EVIDENCE`, `getDapStageEvidenceRequirements(stageNumber)`, `buildDapApprovalEvidenceLedger()` in `lib/cbcc/adapters/dap/dapEvidence.ts`. |
| DAP server action | `lib/cb-control-center/dapStageActions.ts` — `approveDapStage` now consults `canApproveStageWithEvidence` after the existing predecessor-lock check. New optional `evidence` parameter for tests; production defaults to `buildDapApprovalEvidenceLedger()`. New rejection code: `missing_required_evidence` (carries `missingEvidence: string[]`). |
| Tests | `lib/cbcc/stageApproval.test.ts` (+10), `lib/cbcc/nextAllowedAction.test.ts` (NEW, +11), `lib/cbcc/adapters/dap/dapEvidenceRequirements.test.ts` (NEW, +13), `lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts` (NEW, +7), `lib/cb-control-center/dapStagePart7.test.ts` (+6 Part 10 cases; existing approval tests updated to inject explicit evidence so they continue to test what they originally tested). |
| Documentation | This addendum. |

## 2. Evidence-Gated Approval

### Engine primitive

```ts
// lib/cbcc/stageApproval.ts
export interface CbccStageApprovalCheckInput {
  project: CbccProject
  projectId: string
  stageId: CbccStageId
  evidence: CbccEvidenceLedger
  requirements: ReadonlyArray<CbccEvidenceRequirement>
  options?: LockingOptions
}

export type CbccStageApprovalCheckResult =
  | { ok: true; missingEvidence: readonly [] }
  | {
      ok: false
      reason: 'stage_not_found' | 'stage_locked' | 'missing_required_evidence'
      lockReason?: string
      missingEvidence: ReadonlyArray<CbccEvidenceRequirement>
    }

export function canApproveStageWithEvidence(input): CbccStageApprovalCheckResult
```

### Matching rules

- **By id, not by type.** A requirement with `id: 'truth_schema'` is satisfied
  only by an evidence entry with `id: 'truth_schema'`. An AI review entry
  with `id: 'opus_stage_review'` cannot satisfy a `'truth_schema'`
  requirement, even if both are `type: 'note'`. This is the explicit
  "AI review never satisfies required evidence unless explicitly registered"
  rule.
- **Project-scoped.** `e.projectId === input.projectId`.
- **Stage-scoped.** `e.stageId === input.stageId`.
- **Status-strict.** Only `status: 'valid'` evidence satisfies. Pending,
  invalid, or missing evidence is treated as if absent.
- **Lock-first.** If the stage is locked by a predecessor, the check
  returns `stage_locked` *before* evaluating evidence — locking is the
  cheaper precondition and clearer error.

### DAP adapter wiring

```ts
// lib/cbcc/adapters/dap/dapEvidence.ts
export const DAP_STAGE_REQUIRED_EVIDENCE = {
  1: ['business_definition'],
  2: ['discovery_asset_audit'],
  3: ['truth_schema'],
  4: ['positioning_messaging'],
  5: ['seo_aeo_content_strategy'],
  6: ['page_architecture_wireframes'],
  7: ['build_qa_launch_evidence'],
}
```

The IDs reuse the existing `artifact.type` strings where they exist
(`business_definition`, `truth_schema`) and adopt stable forward-compatible
strings for stages whose artifacts are still placeholders. When a future
adapter author produces (say) the Stage 4 positioning artifact, they set
`type: 'positioning_messaging'` and the gate satisfaction is automatic.

`buildDapApprovalEvidenceLedger()` emits one ledger entry per stage whose
artifact is in `'reviewable'` or `'approved'` status — placeholder
artifacts (`'not_started'`) contribute nothing. Today this is two stages
(Stage 1 + Stage 3). The remaining 5 placeholder stages cannot be
approved until their artifact is produced and lifted past the placeholder
state.

### Server-action behavior

```ts
// lib/cb-control-center/dapStageActions.ts
const result = await approveDapStage({ stageNumber: 2, approvedBy: 'Owner' })
// result === { ok: false, code: 'missing_required_evidence',
//   message: 'Stage 2 cannot be approved — missing required evidence: discovery_asset_audit',
//   missingEvidence: ['discovery_asset_audit'] }
```

Tests inject an `evidence` parameter to exercise specific gate states.

## 3. Next Allowed Action Engine

```ts
// lib/cbcc/nextAllowedAction.ts
export type CbccNextAllowedAction =
  | { kind: 'generate_required_artifact', projectSlug, stageNumber, stageId, requiredEvidenceId, label }
  | { kind: 'submit_for_owner_approval',  projectSlug, stageNumber, stageId }
  | { kind: 'approve_stage',              projectSlug, stageNumber, stageId }
  | { kind: 'work_blocked',               projectSlug, stageNumber, stageId, reason, missingEvidence? }
  | { kind: 'project_complete',           projectSlug }

export function getNextAllowedAction(input): CbccNextAllowedAction
```

### Resolution order

1. Walk stages in `order` ascending.
2. Skip `approved` and `rejected` (terminal).
3. For the first non-terminal stage:
   - **Locked** (predecessor not approved or blocked) → `work_blocked`.
   - **Unlocked + missing required evidence** → `generate_required_artifact`
     with the first missing requirement's id and label.
   - **Unlocked + evidence present + status `awaiting_owner_approval`** →
     `approve_stage`.
   - **Unlocked + evidence present + any other unlocked status** →
     `submit_for_owner_approval`.
4. If every stage is approved → `project_complete`.

The function never calls AI, never mutates state, and runs in O(stages).

## 4. Page-Creation Policy Guard

```ts
// lib/cbcc/pageCreationPolicy.ts (engine — generic)
export interface CbccPageCreationPolicyRule {
  pathPrefix: string
  requiredStageNumber: number
  allowedBaselineFiles: ReadonlyArray<string>
}
export function enforcePageCreationPolicy(input): CbccPageCreationPolicyResult
```

```ts
// lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts (DAP-specific guard)
export const DAP_PAGE_CREATION_POLICY = [
  { pathPrefix: 'app/dental-advantage-plan/', requiredStageNumber: 7, allowedBaselineFiles: [...13 files...] },
  { pathPrefix: 'app/guides/',                 requiredStageNumber: 7, allowedBaselineFiles: [...2 files...] },
  { pathPrefix: 'app/treatments/',             requiredStageNumber: 7, allowedBaselineFiles: [...2 files...] },
]
```

The test walks the filesystem under each prefix and asserts every found
file is either in the baseline allowlist or that the required stage is
approved. Today only Stage 1 is approved in the DAP baseline; the
allowlist captures every restricted file currently in the repo, so
the test is green at HEAD.

A new file added under any restricted prefix without being in the
allowlist will fail this test until Stage 7 is owner-approved or the
file is added to the allowlist as a deliberate, reviewed exception.
This is the policy contract; it is intentionally narrow (no agent
orchestration, no runtime middleware).

## 5. Boundary Integrity

| Question | Answer |
|---|---|
| Does generic CBCC core import DAP? | No. `lib/cbcc/coreBoundary.test.ts` (279 cases, +24 from baseline due to two new engine files) still passes; new files `nextAllowedAction.ts` and `pageCreationPolicy.ts` are scanned and contain zero DAP language and zero `cb-control-center` imports. |
| Does the DAP adapter own DAP-specific evidence rules? | Yes. `DAP_STAGE_REQUIRED_EVIDENCE`, `buildDapApprovalEvidenceLedger`, and `getDapStageEvidenceRequirements` all live in `lib/cbcc/adapters/dap/dapEvidence.ts`. The engine never names a DAP stage. |
| Are AI review modules still walled off from approval? | Yes. `dapStageActions.ts` imports `canApproveStageWithEvidence` from the engine, not from any AI module. `aiReview.ts`/`aiReviewProvider.ts` import nothing from `dapStageApprovalStore` or `approveDapStage` (Part 7 acceptance test #6, still green). |
| Is the page-policy primitive vertical-neutral? | Yes. `lib/cbcc/pageCreationPolicy.ts` knows nothing about DAP, dentists, or stages by name — it operates on `pathPrefix`/`requiredStageNumber`/`allowedBaselineFiles` records the adapter supplies. |

## 6. Tests Added

| File | Tests added | Total in file |
|---|---:|---:|
| `lib/cbcc/stageApproval.test.ts` | 10 | 25 |
| `lib/cbcc/nextAllowedAction.test.ts` (NEW) | 11 | 11 |
| `lib/cbcc/adapters/dap/dapEvidenceRequirements.test.ts` (NEW) | 13 | 13 |
| `lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts` (NEW) | 7 | 7 |
| `lib/cb-control-center/dapStagePart7.test.ts` | 6 | 43 |

The test count delta vs. the Part 9 baseline (5782) is +82 — the
authored tests are 47, the rest come from `coreBoundary.test.ts`'s
parameterized scans which now iterate over two additional engine files
(`nextAllowedAction.ts`, `pageCreationPolicy.ts`).

### What the tests assert

- **Evidence approval** — cannot approve when required evidence is
  missing; can approve when present + predecessor approved; rejects
  cross-project / cross-stage / pending-status / id-mismatch evidence;
  AI review entry does not satisfy a non-AI-review requirement;
  optional requirements do not block; pure (no input mutation).
- **Next allowed action** — returns each of the five `kind`s under the
  appropriate state; cross-project / cross-stage / pending evidence
  does not satisfy the gate; pure (no input mutation).
- **Page policy** — current baseline files all pass; synthetic future
  file under any restricted prefix fails until corresponding stage is
  approved; explicitly allowlisted file passes regardless; file outside
  every prefix is ignored.

## 7. Gate Results

| Gate | Result |
|---|---|
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (5864 / 1 skipped — was 5782, +82) |
| `pnpm lint` | Pass with existing warnings (0 errors, 49 warnings — back to baseline; one accidental new warning was removed before commit) |
| `pnpm build` | Pass (Compiled successfully; 199 static pages generated, unchanged) |

## 8. Remaining Risks

| Risk | Class | Notes |
|---|---|---|
| Generic CBCC engine still co-resident with `lib/cb-control-center/` legacy adapters | Architectural — deferred from Part 9 | Unchanged. Risk-rule-#4 cutover still belongs in a controlled future part. |
| Page policy is test-time only, not runtime middleware | Coverage gap by design | The directive explicitly said "test is sufficient for Part 10." A pre-commit hook or CI step would close this gap; out of scope. |
| Page policy `allowedBaselineFiles` must be hand-edited when adding deliberate baseline files | Operational | Acceptable cost — that hand-edit is the review checkpoint. |
| Production approval action now requires evidence; if the adapter's `buildDapApprovalEvidenceLedger` ever returns nothing for an artifact that *should* exist, approvals silently fail | Operational | Today this is impossible to misconfigure (Stage 1 + Stage 3 artifacts are statically `approved`/`reviewable`). Stages 4–7 cannot be approved until their artifacts move out of placeholder — exactly the intended behavior. |
| Next-allowed-action engine is not yet consumed by any UI | Adoption gap | By design — Part 10 ships primitives; Part 11 wires them. |
| Stage 2's required evidence (`discovery_asset_audit`) has no concrete artifact yet | Adapter-level | Owner workflow: produce the discovery audit, set its `type` to `'discovery_asset_audit'`, set its status to `'reviewable'` or `'approved'`. The gate then unblocks. |

## 9. Recommendation for Part 11

**Wire the new primitives into operator UI.** The engine now exposes
`getNextAllowedAction(...)` deterministically, but no surface in the
app consumes it. A small read-only "Next Allowed Action" card on
`/projects/[slug]` plus a per-stage hint on
`/projects/[slug]/stages/[stageNumber]` would close the loop without
new orchestration:

1. **Operator card** — bind `<NextAllowedActionCard project, evidence,
   requirements />` at the top of the project page. Displays the
   single sentence "Generate truth_schema artifact" / "Submit Stage 2
   for owner approval" / etc. that the engine returns.
2. **Stage detail hint** — when the page renders a non-approved stage,
   surface the `missingEvidence` list (or "Ready to approve") above
   the existing approval section. The data path is already in place.
3. **Surface `missing_required_evidence` rejections in the approval form**
   — `DapStageOwnerApprovalForm` should render the new
   `result.missingEvidence` array as a clear "evidence needed" list,
   not just a text error.

These are all wiring changes — no new engine code, no DB migrations,
no AI calls, no route moves. After Part 11 lands, CBCC becomes an
operator-visible permission system, not just a backend constraint set.

Defer the controlled `lib/cb-control-center/` cleanup (`dapStageReviewer.ts`
+ `dapStageRubrics.ts` → `lib/cbcc/adapters/dap/`) to its own directive
once Part 11 stabilizes — it remains correct, low-risk, and not
blocking.

---

## Part 11 Addendum — Proactive Stage Control Loop + Approval Enforcement

**Date:** 2026-05-01
**Type:** Test-only hardening pass. No code changes. Single canonical
acceptance file consolidates the Part 11 contract end-to-end.

### What was inspected

- `docs/cbcc-reorganization.md` (this doc) through Part 10.
- `lib/cbcc/stageApproval.ts` (`canApproveStage`, `canApproveStageWithEvidence`).
- `lib/cbcc/stageLocking.ts` (`getStageLockReason`, `isStageLocked`).
- `lib/cbcc/evidenceLedger.ts` (append-only ledger primitives).
- `lib/cbcc/stagePageModel.ts` (page model assembly + lock state).
- `lib/cbcc/aiReview.ts`, `lib/cbcc/aiReviewProvider.ts` (advisory contract).
- `lib/cbcc/adapters/dap/` (DAP definitions, evidence, artifacts).
- `lib/cb-control-center/dapStageActions.ts` (server action — single
  authority for persisting approvals).
- `app/projects/[slug]/stages/[stageNumber]/page.tsx` and
  `app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx`
  (both render the same `<StageDetailPage>` component).
- All boundary tests under `lib/cbcc/coreBoundary.test.ts` and the
  Part 7 acceptance suite at `lib/cb-control-center/dapStagePart7.test.ts`.

### What was already working

The runtime control loop was complete after Parts 8X / 9 / 10:

| Behavior | Where it's enforced |
|---|---|
| Every stage opens to a full detail page | `app/projects/[slug]/stages/[stageNumber]/page.tsx` always builds a gate via the engine; `notFound()` only fires for invalid stage numbers (≤0 or ≥8). |
| Locked stages render full content (purpose, artifact placeholder, evidence trail, advisory AI review, "Directive Preview — Locked" warning) | `<StageDetailPage>` locked-directive variant. |
| Locked stages show a clear prerequisite line | "Next-Stage Unlock Rule" section — `Stage N-1 must be owner-approved before this stage's directive is issued.` |
| Locked stages do not display the approval form | `app/projects/[slug]/stages/[stageNumber]/page.tsx:89` — `showDapApprovalForm = isDap && stage.blockers.length === 0 && !stage.approvedByOwner`. The engine produces a blocker for any locked stage. |
| Approval action enforces predecessor approval | `dapStageActions.ts:86` — `isStageLocked(effectiveProject, def.id)` returns `{ok: false, code: 'stage_locked'}`. |
| Approval action enforces evidence presence (Part 10) | `canApproveStageWithEvidence(...)` — id-level matcher, project+stage scoped, status='valid' required. |
| AI review is structurally advisory-only | Six invariants asserted: reviewer imports no Supabase; route imports no approval action; approval actions import no review symbols; no DB column for AI review; engine AI review module exports no mutation API; route returns JSON only. |
| Evidence ledger is append-only | `appendEvidence` returns a new array; never mutates input (Part 7 acceptance #9). |
| Generic core has no DAP language | `coreBoundary.test.ts` (279 cases). |
| v1 and v2 routes converge on the same component | `<StageDetailPage>` consumed by both routes; only the data path differs. |

### What was vulnerable to bypass

**Nothing structurally.** The runtime guards were already in place. What
was missing was a **single canonical integration test** that exercised
the whole control loop as one guarantee — including the prereq-flip
scenario — so any future refactor that subtly broke one piece would
fail one obvious test rather than several scattered ones.

### What was changed

| File | Change |
|---|---|
| `lib/cb-control-center/dapStagePart11.test.tsx` | NEW — 35 tests. The single canonical Part 11 acceptance suite. Six sections (A–F + Boundary regression). |
| `docs/cbcc-reorganization.md` | This addendum. |

No production source files were modified.

### Approval enforcement behavior (re-asserted)

Every `approveDapStage` call passes through, in order:

1. `stageNumber` integer 1–7 → else `invalid_stage`.
2. `approvedBy` non-empty → else `missing_approved_by`.
3. Stage definition exists in `DAP_STAGE_DEFINITIONS` → else `unknown_stage`.
4. Persisted approval doesn't already exist → else `already_approved`.
5. `isStageLocked(effectiveProject, def.id)` is false → else `stage_locked`.
6. `canApproveStageWithEvidence(...)` is ok → else `missing_required_evidence`
   (returned with `missingEvidence: string[]`).
7. Persist via `store.approve(...)` and revalidate paths.

There is no other code path into `store.approve` from the application.
The only paths from any UI surface to a write are:
- `DapStageOwnerApprovalForm` → `approveDapStageAction` → `approveDapStage`.
- `CbccCharterPanel` → `approveCharterAction` (charter, not a stage).

Both gate on `approvedBy` form data and explicit project lookup. Neither
imports any AI review symbol (asserted by Part 11 Section E and Part 7
acceptance #6 / Part 8X route Group 6).

### Locked stage behavior (re-asserted)

For every locked stage (Stages 5, 6, 7 by current DAP baseline; Stages
2, 3, 4 once their predecessors are approved without their own
prerequisites flowing through):

- The page renders without throwing (Section A).
- `data-stage-detail-page`, `data-anti-bypass-rule`, `data-ai-review-panel`,
  `data-stage-evidence-panel` anchors are present.
- `data-locked-directive-warning` red-banner section is present with
  the copy "This directive is visible for planning only. It is not
  authorized for execution until all blockers are cleared and the
  prior stage is owner-approved."
- The "Reviewable Artifact" section shows the placeholder summary or
  "Not generated yet" copy.
- The evidence panel shows "No evidence submitted yet."
- The "Next-Stage Unlock Rule" section names the prerequisite stage.
- `gate.approvedByOwner === false` and `gate.approvedAt === null`.
- The approval form is not rendered (UI gate at `page.tsx:89`).
- The approval action rejects with `stage_locked` if anyone POSTs
  directly (Section C).

### AI review boundary (re-asserted)

Six invariants, all test-asserted:

1. Reviewer module source contains no `supabase` / `getSupabaseAdminClient` (`dapStageReviewer.test.ts` Group 2 + Part 11 E).
2. Reviewer module imports no approval store / approve function (Part 11 E).
3. Reviewer module exports no `update|approve|reject|delete|create|set|mark|unlock|persist|commit` function (Part 11 E).
4. Approval action imports no AI review module (Part 7 #6 + Part 11 E).
5. Engine public barrel (`lib/cbcc/index.ts`) exposes no name containing `approveStage|unlockStage|persist|commit|updateStage` (Part 7 + Part 11 E).
6. AI review with `decision: 'pass'` attached to the engine page model does not change `lock.isLocked` or `approval.canApprove` (Part 7 #8 + Part 11 E).

In addition, the route boundary is enforced by Part 8X tests:
returning JSON only, no Supabase, no approval-action imports, `projectSlug`
guard rejects non-DAP, no DB column for AI review.

### Evidence ledger behavior

Append-only. `appendEvidence` returns a new array; tests in Part 7 #9
and Part 11 F assert input mutation does not occur. Approving a later
stage does not modify or delete a prior approval record (Part 11 F).

The Part 10 evidence gate matches by *requirement.id ↔ evidence.id*,
project+stage scoped, status='valid' required. AI review entries (if
ever ledger-shaped) cannot satisfy a non-AI-review requirement
because their id will differ — Part 10 has explicit tests for this.

### Tests added/updated

| File | Tests | New / Updated |
|---|---:|---|
| `lib/cb-control-center/dapStagePart11.test.tsx` | 35 | NEW |

Test count: 5864 (post-Part-10) → 5899 (post-Part-11), +35 — all from
the new Part 11 acceptance file.

The file has 7 describe blocks:
- A. All seven DAP stages open via engine-backed v2 path (12 tests)
- B. Locked stage UX — no enabled approval action (6 tests)
- C. Approval action enforces the control model (6 tests)
- D. Prerequisite flip — sequential unlock with evidence (1 multi-step test)
- E. AI review boundary (7 tests)
- F. Evidence ledger append-only (2 tests)
- Boundary regression — generic core stays free of DAP language (2 tests)

### Final validation results

| Gate | Result |
|---|---|
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (5899 / 1 skipped — was 5864, +35) |
| `pnpm lint` | Pass with existing warnings (0 errors, 49 pre-existing warnings; **0 new warnings introduced by Part 11**) |
| `pnpm build` | Pass (Compiled successfully in 1813ms; 199 static pages generated, unchanged) |

### Remaining risks or follow-up recommendations

| Item | Class | When |
|---|---|---|
| `lib/cb-control-center/dapStageReviewer.ts` + `dapStageRubrics.ts` still live in the legacy folder rather than `lib/cbcc/adapters/dap/` | Cosmetic — Part 8D-style relocation | Carried forward from Part 8X / 9 / 10 — still optional, still low-risk, still not blocking. |
| `app/preview/dap/practice-decision-emails/page.tsx` and `components/cb-control-center/tabs/SiteArchitectureTab.tsx` are modified in the working tree but unrelated to Part 11 | Operational | These changes pre-exist the Part 11 directive scope; they are intentionally NOT included in the Part 11 commit. They should be committed (or reverted) under their own directive. |
| Page-creation policy guard (Part 10) is test-time only, not runtime middleware | Coverage gap by design | Operator can promote it to a pre-commit hook or CI step; out of scope for Part 11. |
| Next-allowed-action engine (Part 10) is not yet consumed by any UI | Adoption gap by design | Carried forward as the most natural Part 12 candidate (operator card + per-stage hint + form-error rendering). |
| AI review remains the legacy `dapStageReviewer.ts` path; the engine-shaped `lib/cbcc/aiReview.ts` is built but unwired | Architectural — Risk rule #4 | Same posture as Parts 8X and 10. Belongs in a controlled separate part. |

**CBCC is now a real approval control system.** Display does not imply
state; approval requires logic; AI advises, owner approves; locked stages
are visible but not approvable. The Part 11 acceptance suite is the
single guarantee against future regressions of any of these properties.

---

## Part 12 Addendum — Wire next-allowed-action into operator UI (2026-05-01)

Part 11 made the engine safer (evidence-gated approval, predecessor lock,
mutation boundary, next-allowed-action engine). Part 12 makes the engine's
decisions **visible**: the operator can now see, on the project page and on
each stage page, what the engine has already decided about the next legal
move and why approval is unavailable.

This part is a **UI wiring pass only**. No engine behavior was added or
changed. No DB migrations. No route moves. No AI calls.

### What Part 12 changed

Three operator-facing surfaces, all consuming existing engine output:

1. **`<NextAllowedActionCard>`** on `/projects/[slug]` — read-only render of
   `getNextAllowedAction(...)` output. The card identifies the next allowed
   stage/action, surfaces the blocker reason for `work_blocked`, and
   surfaces the missing-evidence id for `generate_required_artifact`. For
   non-engine-backed projects it is omitted entirely (no fallback action).

2. **Missing-evidence panel** on `/projects/[slug]/stages/[stageNumber]`
   (engine-backed projects). Renders a pre-approval list of required
   evidence items the engine reports as missing. Suppressed when the stage
   is locked (the locked-directive UX already covers that case) or when
   the stage has no missing items. Threaded into `<StageDetailPage>` as a
   new optional `missingEvidence` prop so the v1 caller's behavior is
   unchanged.

3. **Approval form result rendering** in `<DapStageOwnerApprovalForm>`. The
   four discriminated `ApproveDapStageResult` failure codes now have
   distinct, operator-readable surfaces with stable test anchors:
   - `missing_required_evidence` — renders every id in the
     `result.missingEvidence` list.
   - `stage_locked` — renders a predecessor-not-approved message.
   - `already_approved` — renders an idempotency-friendly message.
   - generic — falls back to `result.message` with the code anchor still
     present so tests can target the exact code.

### What engine behavior was reused (and not changed)

| Engine surface | Reused by Part 12 |
|---|---|
| `getNextAllowedAction({ project, stageDefinitions, evidenceRequirementsByStage, evidenceLedger })` | Computed on the project page; output passed to the card unmodified. |
| `canApproveStageWithEvidence({ project, projectId, stageId, evidence, requirements })` | Computed on the stage detail page; `gate.missingEvidence` passed to the panel unmodified. |
| `buildDapEffectiveProject` + `buildDapApprovalEvidenceLedger` + `getDapStageEvidenceRequirements` | DAP adapter helpers used to feed both engines; no new logic added. |
| `ApproveDapStageResult` discriminated union | Form rendering switches on `result.code`; the action layer is untouched. |

The engine never sees the UI surfaces; the UI never makes a decision.

### Stable test anchors added

| Surface | Anchor |
|---|---|
| Project page card | `data-next-allowed-action-card` |
| Project page card | `data-next-allowed-action="<kind>"` |
| Project page card | `data-next-allowed-stage="<n>"` |
| Project page card | `data-next-allowed-reason="<text>"` (work_blocked only) |
| Project page card | `data-next-allowed-missing-evidence="<id>"` (generate_required_artifact only) |
| Stage page panel | `data-missing-evidence-panel` |
| Stage page panel | `data-missing-evidence-item` |
| Stage page panel | `data-missing-evidence-id="<id>"` |
| Approval form | `data-approval-error` (alongside legacy `data-form-error`) |
| Approval form | `data-approval-error-code="<code>"` |
| Approval form | `data-approval-missing-evidence` |
| Approval form | `data-approval-missing-evidence-item` |
| Approval form | `data-approval-missing-evidence-id="<id>"` |

### What was intentionally not changed

- No engine modules edited. `lib/cbcc/nextAllowedAction.ts`,
  `stageApproval.ts`, `evidenceLedger.ts`, `pageCreationPolicy.ts` are
  byte-for-byte unchanged.
- No DB migrations.
- No route file added or moved. Static page count stays at 199.
- No AI module wired into any new place. The reviewer surface is
  unchanged.
- The two unrelated working-tree files
  (`app/preview/dap/practice-decision-emails/page.tsx` and
  `components/cb-control-center/tabs/SiteArchitectureTab.tsx`) are
  intentionally NOT included in the Part 12 commit, per directive scope.
- The `<DapStageOwnerApprovalForm>` retains its original `data-form-error`
  anchor for backward compat with existing Part 11 tests.

### Files changed

| File | Type | What |
|---|---|---|
| `components/cb-control-center/NextAllowedActionCard.tsx` | NEW | Read-only card for the engine's next-allowed-action output. |
| `components/cb-control-center/StageMissingEvidencePanel.tsx` | NEW | Read-only list of missing required evidence items. |
| `components/cb-control-center/StageDetailPage.tsx` | UPDATED | New optional `missingEvidence` prop; renders panel above approval surfaces when non-empty. |
| `components/cb-control-center/DapStageOwnerApprovalForm.tsx` | UPDATED | Result-aware error rendering; new `ApprovalErrorView` exported for tests. |
| `app/projects/[slug]/page.tsx` | UPDATED | Computes next-allowed-action for engine-backed projects and mounts the card. |
| `app/projects/[slug]/stages/[stageNumber]/page.tsx` | UPDATED | Computes missing evidence for engine-backed projects and threads it into `<StageDetailPage>`. |
| `lib/cb-control-center/dapStagePart12.test.tsx` | NEW | 26-test acceptance suite covering all four surfaces and regression boundaries. |
| `docs/cbcc-reorganization.md` | UPDATED | This addendum. |

### Test coverage added

| File | Tests | New / Updated |
|---|---:|---|
| `lib/cb-control-center/dapStagePart12.test.tsx` | 26 | NEW |

Test count: 5899 (post-Part-11) → 5925 (post-Part-12), +26 — all from
the new Part 12 acceptance file.

The file has 6 describe blocks:
- A. Project page next-allowed-action card (4 tests)
- B. NextAllowedActionCard renders each engine action kind (5 tests)
- C. StageDetailPage missing-evidence panel (5 tests)
- D. DapStageOwnerApprovalForm result rendering (5 tests)
- E. Regression boundaries (6 tests — AI/persistence isolation, route invariants)
- Engine root stays generic (1 cheap re-assertion)

### Validation results

| Gate | Result |
|---|---|
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (5925 / 1 skipped — was 5899, +26) |
| `pnpm lint` | Pass (0 errors; 49 pre-existing warnings, **0 new warnings introduced by Part 12**) |
| `pnpm build` | Pass (Compiled successfully in 1767ms; 199 static pages generated, unchanged) |

### Remaining recommendations

| Item | Class | When |
|---|---|---|
| `lib/cb-control-center/dapStageReviewer.ts` + `dapStageRubrics.ts` still live in the legacy folder rather than `lib/cbcc/adapters/dap/` | Cosmetic — relocation | Part 13 candidate (folder cleanup). |
| Page-creation policy guard remains test-only, not pre-commit / CI | Coverage gap by design | Part 14 candidate (CI / pre-commit guard). |
| Two unrelated working-tree files (`practice-decision-emails/page.tsx`, `SiteArchitectureTab.tsx`) still uncommitted | Operational | Part 15 candidate (separate inspect-and-decide pass). |
| AI review still routed through legacy `dapStageReviewer.ts`; engine-shaped `lib/cbcc/aiReview.ts` remains unwired | Architectural — Risk rule #4 | Same posture as Parts 8X / 10 / 11. Carry forward to a controlled future part. |
| Non-DAP / generic v2 projects: no `NextAllowedActionCard` rendered | Adoption gap | When a second engine-backed project lands, generalize the project-page wiring (the card already takes a vertical-neutral `CbccNextAllowedAction`). |

**Part 12 closes the visibility gap.** The engine has had the answer to
"what is the next legal move?" since Part 10. Part 12 makes that answer
something the operator can actually see — on the project page, on each
stage page, and inside the approval form when an attempt fails.

---

## Part 13 Addendum — Adapter purity boundary preserved (2026-05-01)

The original Part 13 directive proposed relocating
`lib/cb-control-center/dapStageReviewer.ts` and
`lib/cb-control-center/dapStageRubrics.ts` into
`lib/cbcc/adapters/dap/`, on the surface a clean architectural cleanup.

While executing the move, we discovered that `lib/cbcc/adapters/dap/` is
already protected as a **pure-data, no-IO, no-app-layer-import zone** by
two pre-existing test groups, and that the reviewer file structurally
violates the contract of that folder. Moving it would have required
either weakening the existing tests (forbidden by the directive) or
silently expanding the SDK-touching surface inside the adapter folder.

We therefore reverted the move and re-scoped Part 13 to a documentation
+ boundary-affirmation pass.

### What was attempted

1. `git mv` of four files:
   - `lib/cb-control-center/dapStageReviewer.ts`        → `lib/cbcc/adapters/dap/`
   - `lib/cb-control-center/dapStageRubrics.ts`         → `lib/cbcc/adapters/dap/`
   - `lib/cb-control-center/dapStageReviewer.test.ts`   → `lib/cbcc/adapters/dap/`
   - `lib/cb-control-center/dapStageRubrics.test.ts`    → `lib/cbcc/adapters/dap/`
2. Path updates inside the moved reviewer
   (`'./anthropicClient'` → `'@/lib/cb-control-center/anthropicClient'`,
    `'./dapStageGates'`   → `'@/lib/cb-control-center/dapStageGates'`).
3. Path updates at three importers:
   `app/api/businesses/dental-advantage-plan/stages/review/route.ts`,
   `…/route.test.ts`,
   `components/cb-control-center/StageAiReviewPanel.tsx`.
4. Path updates at two grep-based boundary tests (`dapStagePart11.test.tsx`,
   `dapStagePart12.test.tsx`) that resolve the reviewer source by
   `__dirname`-relative path.

`pnpm typecheck` was clean after the move.
`pnpm test` failed with **2** pre-existing boundary tests:

| Test file | Failing assertion |
|---|---|
| `lib/cbcc/adapters/dap/dapAdapter.test.ts` | `adapters/dap/dapStageReviewer.ts does not contain "getAnthropicClient"` |
| `lib/cb-control-center/dapStagePart7.test.ts` | `no adapter file imports lib/cb-control-center (the DAP-specific app layer)` |

### The boundary conflict

`lib/cbcc/adapters/dap/` enforces, via existing tests, that every
`*.ts` file in the folder must NOT contain any of:

- `@anthropic-ai/sdk`
- `getAnthropicClient`
- `fetch(`
- `supabase`
- `from "next/"`
- `from "react"`
- `'use server'`
- `'use client'`
- the substring `cb-control-center` (i.e. no imports back into the
  legacy/app-layer folder)

The reviewer module, by contract, **does** call `getAnthropicClient()` and
imports it — plus the `DapStageGate` type — from `lib/cb-control-center/`.
It is fundamentally an SDK-touching, app-layer-coupled module. The
adapter folder's existing rules therefore apply to it as a *negative*
constraint: any file like the reviewer is currently disqualified from
living there.

### Why the move was rejected (corrected interpretation)

The original Part 13 directive treated `lib/cbcc/adapters/dap/` as
"DAP stuff." It is, in fact, narrower than that:

- `lib/cbcc/`                 = generic engine
- `lib/cbcc/adapters/dap/`    = **pure** DAP adapter / data / translation layer
- `lib/cb-control-center/`    = current UI / control-center + legacy DAP runtime surface

An SDK-touching reviewer is not adapter logic in this sense. Moving it
into the pure zone would have made the file tree *look* cleaner while
actually **weakening** an architecture invariant we want to preserve:
that the adapter folder is deterministic, side-effect-free, and free of
runtime/app-layer coupling.

The directive's three explicit constraints — "Do not weaken or delete
prior tests", "Preserve behavior exactly", "Do not refactor unrelated
files" — are mutually exclusive in this case, given the pre-existing
adapter contract. Reverting the move is the only option that honors all
three.

### What was kept (no behavior change, no test weakening)

- `lib/cb-control-center/dapStageReviewer.ts` — unchanged.
- `lib/cb-control-center/dapStageRubrics.ts`  — unchanged.
- `lib/cb-control-center/dapStageReviewer.test.ts` / `dapStageRubrics.test.ts` — unchanged.
- All importers (`route.ts`, `route.test.ts`, `StageAiReviewPanel.tsx`)
  — unchanged.
- All path-based grep tests in Parts 11 / 12 — unchanged.
- All pre-existing adapter boundary tests (`dapAdapter.test.ts`,
  `dapStagePart7.test.ts`) — unchanged.

### What was added

A single new boundary-affirmation suite that documents the discovery
and re-asserts the adapter folder's purity contract co-located with the
Part 13 narrative:

| File | Type | Purpose |
|---|---|---|
| `lib/cb-control-center/dapStagePart13.test.ts` | NEW | 4-group acceptance suite re-asserting the rules below; references the legacy reviewer location to lock the reverted state. |

The suite asserts:

1. **Group 1 — legacy paths preserved**: reviewer/rubric still live in
   `lib/cb-control-center/`, still import `getAnthropicClient`, still
   import `DapStageGate` from cb-control-center, still read-only (no
   supabase / no approval-store coupling).
2. **Group 2 — `lib/cbcc/adapters/dap/` remains pure**: every impl file
   is scanned for an expanded forbidden-pattern set (the union of the
   pre-existing `dapAdapter.test.ts` rules + a new ban on
   `dapStageReviewer` / `dapStageRubrics` / `reviewStage` /
   `DapStageRubric` / `StageAiReview` references, so a future move
   attempt must explicitly defeat both gates).
3. **Group 3 — engine root stays vertical-neutral**: no top-level
   `lib/cbcc/*.ts` file (and nothing in `lib/cbcc/index.ts`) imports or
   re-exports DAP review symbols.
4. **Group 4 — importers still wire to the legacy reviewer**: API
   route, route test mock, and `StageAiReviewPanel.tsx` all import from
   `@/lib/cb-control-center/dapStageReviewer`; none point at a
   premature relocation under `@/lib/cbcc/adapters/dap/`.

### Boundaries now enforced (and why they hold together)

| Boundary | Enforced by |
|---|---|
| Generic engine root cannot import DAP review surface | `dapStagePart11.test.tsx` (engine-root grep), Part 13 Group 3 |
| Engine barrel cannot re-export DAP review symbols | Part 13 Group 3 |
| Adapter folder cannot use SDK / IO / app-layer imports | `dapAdapter.test.ts`, Part 13 Group 2 |
| Adapter folder cannot import `lib/cb-control-center/` | `dapStagePart7.test.ts`, Part 13 Group 2 |
| Adapter folder cannot reference DAP review symbols (yet) | Part 13 Group 2 |
| Reviewer remains read-only | Parts 7 / 11 / 12, Part 13 Group 1 |
| AI review cannot mutate approval state | Parts 11 / 12 (re-asserted), unchanged |

These rules together encode a single principle: **AI review is an
SDK-touching app-layer concern. It does not belong inside the pure
adapter zone until it has a port that hides the SDK and the legacy
DapStageGate dependency.**

### Future migration path (NOT for Part 13)

When AI review is redesigned as a clean port:

1. Define the generic interface in `lib/cbcc/aiReview.ts` (already
   exists as a contract layer). Keep it provider-neutral, no SDK
   types.
2. Implement the Anthropic provider **outside** the pure adapter
   folder — e.g. `lib/cbcc/runtime/anthropicProvider.ts` or
   `lib/cb-control-center/runtime/...` — and wire it via dependency
   injection at the route boundary, not via direct import inside the
   adapter.
3. Move the **rubric data** (`dapStageRubrics.ts`) into the adapter
   first — it is pure data, has no SDK or app-layer imports, and would
   pass every existing rule. This is the safest first step and can be
   done independently as its own part.
4. Refactor the reviewer's call site to consume the engine port +
   provider, freeing it from `getAnthropicClient` and `DapStageGate`.
5. Once the reviewer no longer touches the SDK directly and no longer
   imports from `lib/cb-control-center/`, it can move into
   `lib/cbcc/adapters/dap/` without weakening any existing rule.

### Test coverage added

| File | Tests | New / Updated |
|---|---:|---|
| `lib/cb-control-center/dapStagePart13.test.ts` | 82 | NEW |

Test count: 5925 (post-Part-12) → 6007 (post-Part-13), +82 — all from
Part 13 Group 2's per-file × per-pattern matrix and the four
documentation groups. No prior tests were modified.

### Validation results

| Gate | Result |
|---|---|
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (6007 / 1 skipped — was 5925, +82) |
| `pnpm lint` | Pass (0 errors; 49 pre-existing warnings, **0 new warnings introduced by Part 13**) |
| `pnpm build` | Pass (Compiled successfully in 1954ms; 199 static pages generated, unchanged) |

### Remaining recommendations

| Item | Class | When |
|---|---|---|
| AI review still routed through legacy `dapStageReviewer.ts` with direct SDK + legacy-folder coupling | Architectural — Risk rule #4 | Carry forward to a dedicated provider-port part (see Future migration path above). |
| `dapStageRubrics.ts` could be moved into `lib/cbcc/adapters/dap/` independently — it has no forbidden imports | Adapter purity-compatible cleanup | A self-contained future part — single file, single `from './dapStageRubrics'` rewrite in the reviewer, and a corresponding update in this file's Group 1 + Group 2 expectations. |
| Page-creation policy guard remains test-only, not pre-commit / CI | Coverage gap by design | Part 14 candidate (CI / pre-commit guard). |
| Two unrelated working-tree files (`practice-decision-emails/page.tsx`, `SiteArchitectureTab.tsx`) still uncommitted | Operational | Part 15 candidate (separate inspect-and-decide pass). |

**Part 13's most valuable output is not a relocation.** It is the
explicit, test-asserted statement that `lib/cbcc/adapters/dap/` is a
purity boundary, not a junk drawer for "anything DAP-shaped" — and the
documented migration path that lets the reviewer eventually move there
without compromising the boundary.


