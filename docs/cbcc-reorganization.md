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

---

## Part 14 Addendum — Page-creation policy guard promoted to standalone CLI (2026-05-01)

Parts 10–13 established that page/route creation under DAP-restricted
prefixes is gated by an explicit policy. The policy was correct but
only fired when the full vitest suite ran — a developer (or agent)
who only ran `pnpm typecheck` could still slip a new restricted-prefix
page in without anyone noticing until CI.

Part 14 promotes that guard into a standalone, deterministic CLI check
that can be run on its own and is wired into the repo's combined
`check` script.

### What guard was added

A single CLI script:

| File | Type | Purpose |
|---|---|---|
| `scripts/check-page-creation-policy.ts` | NEW | Deterministic CLI guard. Walks the restricted prefixes, runs `enforcePageCreationPolicy` in strictest mode (`approvedStageNumbers: []`), prints a clear pass/fail summary, exits 0/1. |

Plus one **pure-data extract** to make the rules importable from outside
the test file:

| File | Type | Purpose |
|---|---|---|
| `lib/cbcc/adapters/dap/dapPageCreationPolicy.ts` | NEW | Exports `DAP_PAGE_CREATION_POLICY` (3 rules, 17 baseline files) and `DAP_PAGE_CREATION_POLICY_PREFIXES`. Pure data — no IO, no SDK, no app-layer imports. Lives inside the adapter purity zone. |
| `lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts` | UPDATED | Now imports `DAP_PAGE_CREATION_POLICY` from the sibling module instead of declaring it inline. Behavior unchanged. |

### What policy is enforced

Identical to the existing test-time policy. Three restricted prefixes,
each gated on Stage 7 with an explicit baseline allowlist:

| Prefix | Required stage | Baseline files |
|---|---:|---:|
| `app/dental-advantage-plan/` | 7 | 13 |
| `app/guides/` | 7 | 2 |
| `app/treatments/` | 7 | 2 |

Strictest mode (`approvedStageNumbers: []`) is intentional: every new
restricted-prefix file forces a deliberate edit to
`allowedBaselineFiles`. Approving Stage 7 in `DAP_PROJECT` will not
silently widen this guard.

### How to run it

```
pnpm check:page-policy
```

Pass output:
```
check-page-creation-policy: pass
  scanned 17 file(s) under 3 rule prefix(es)
```

Fail output (synthetic example):
```
check-page-creation-policy: FAIL
  1 violation(s):
  - app/dental-advantage-plan/new-thing/page.tsx
      prefix: app/dental-advantage-plan/
      required stage: 7

How to resolve:
  - If the file is intentional baseline content, add it to
    DAP_PAGE_CREATION_POLICY[].allowedBaselineFiles in
    lib/cbcc/adapters/dap/dapPageCreationPolicy.ts.
  - If the file is premature, delete it until the gating
    stage is owner-approved.
```

The script:

- requires no environment variables
- performs no network IO
- does not read Supabase
- does not import the Anthropic SDK or any AI module
- does not import Next.js runtime modules
- runs via the repo's existing `tsx` devDependency (no new tooling)

### package.json wiring

Two changes — both additive:

```diff
- "check": "pnpm typecheck && pnpm lint && pnpm test"
+ "check:page-policy": "tsx scripts/check-page-creation-policy.ts",
+ "check": "pnpm typecheck && pnpm lint && pnpm test && pnpm check:page-policy"
```

`pnpm check` now runs the page-policy gate after typecheck / lint /
test. Anyone already using `pnpm check` as their pre-push gate
inherits the new guard automatically.

### Pre-commit / CI integration

**Intentionally deferred** — the repo currently has no Husky / Lefthook
/ simple-git-hooks / lint-staged / `.github/workflows` / `.husky`
setup, and the directive forbids introducing a new framework as part
of Part 14. The check is now runnable in three ways:

1. Standalone: `pnpm check:page-policy`
2. Bundled: `pnpm check` (typecheck + lint + test + page-policy)
3. Full suite: `pnpm test` (the existing test-time policy still fires)

When the repo adopts a pre-commit / CI framework in a future part, the
recommended hook is simply:

```
pnpm check:page-policy
```

— because it's fast (no test suite startup), self-contained, and
returns a non-zero exit code on violation.

### Test coverage added

| File | Tests | New / Updated |
|---|---:|---|
| `lib/cb-control-center/dapStagePart14.test.ts` | 31 | NEW |
| `lib/cbcc/adapters/dap/dapPageCreationPolicy.test.ts` | 0 | UPDATED (only the import line; assertions and counts unchanged) |

Test count: 6007 (post-Part-13) → 6056 (post-Part-14), +49.
The Part 14 file has 5 describe blocks:

- A. Pure-data extract (6 tests — module exists, exports shape, purity invariants, prefix list, legacy const removed)
- B. Policy enforcement parity (4 tests — baselines pass, simulated unauthorized files fail with clear reason, gated stage flips them through, files outside prefixes ignored)
- C. Standalone guard script boundaries (9 tests — no AI / Supabase / Next / env / network, runs against the live tree)
- D. package.json script wiring (5 tests — check:page-policy present, uses tsx, inherited by `check`, prior scripts intact)
- E. Prior behavior preserved (2 tests — legacy test still wired correctly, engine policy export unchanged)

Several tests fan out over the rule set, so the actual it-block count
is higher than the section count (49 in total).

### Validation results

| Gate | Result |
|---|---|
| `pnpm check:page-policy` | Pass (0 violations; 17 files scanned across 3 prefixes) |
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (6056 / 1 skipped — was 6007, +49) |
| `pnpm lint` | Pass (0 errors; 49 pre-existing warnings, **0 new warnings introduced by Part 14**) |
| `pnpm build` | Pass (Compiled successfully in 2.2s; 199 static pages generated, unchanged) |

### Remaining recommendations

| Item | Class | When |
|---|---|---|
| Pre-commit hook running `pnpm check:page-policy` | Operational | When the repo adopts a hook framework. Husky is the most common option for pnpm projects; lefthook is a lighter alternative. |
| GitHub Actions workflow running `pnpm check` (which includes the new gate) | Operational | When CI is added. Recommended trigger: every push to a non-main branch + every PR. |
| Generalize the rule data when a second engine-backed project lands | Architectural | The current rule set is DAP-specific. The pure-data module is structured to accept additional adapter-supplied rules — a future part can add `<adapter>PageCreationPolicy.ts` modules and concatenate them in the script. |
| AI review provider-port migration | Architectural — Risk rule #4 | Carry-forward from Parts 8X / 10–13. |
| Two unrelated working-tree files (`practice-decision-emails/page.tsx`, `SiteArchitectureTab.tsx`) still uncommitted | Operational | Carry-forward from Parts 12–13 (Part 15 candidate). |

**Part 14 locks in the boundary Part 13 clarified.** The page-creation
policy is no longer hidden inside a single test file: it's a one-line
CLI any developer or agent can run, and any future hook framework can
trigger.

---

## Part 15 Addendum — Unstaged working tree inspection (2026-05-01)

Parts 12–14 each intentionally left the same three working-tree items
unstaged so the CBCC architecture work would not get tangled up with
unrelated state. Part 15 inspects each item in isolation and disposes
of it. **No new architecture work**, no DAP feature surface, no engine
changes.

### Items inspected

```
git status --short

 M app/preview/dap/practice-decision-emails/page.tsx
 M components/cb-control-center/tabs/SiteArchitectureTab.tsx
?? supabase/.temp/
```

### What each diff actually was

Both `M` diffs are **import-path follow-ups** to commit
`9d3647d chore(cbcc): move mkcrm/ and architecture/ source clusters`.
That earlier commit moved the two source clusters into subfolders but
did not update every consumer. The two unstaged files are the missed
consumers:

```
- @/lib/cb-control-center/dapMkcrmDispatchPayloads
+ @/lib/cb-control-center/mkcrm/dapMkcrmDispatchPayloads
- @/lib/cb-control-center/dapMkcrmDispatchPayloadTypes
+ @/lib/cb-control-center/mkcrm/dapMkcrmDispatchPayloadTypes
```

```
- @/lib/cb-control-center/siteArchitectureEligibility
+ @/lib/cb-control-center/architecture/siteArchitectureEligibility
- @/lib/cb-control-center/siteArchitectureTypes
+ @/lib/cb-control-center/architecture/siteArchitectureTypes
```

The on-disk filesystem confirms only the new (subfolder) paths exist:

| Path | Exists |
|---|---|
| `lib/cb-control-center/dapMkcrmDispatchPayloads.ts` | no |
| `lib/cb-control-center/mkcrm/dapMkcrmDispatchPayloads.ts` | yes |
| `lib/cb-control-center/siteArchitectureEligibility.ts` | no |
| `lib/cb-control-center/architecture/siteArchitectureEligibility.ts` | yes |

Without the working-tree modifications, both files reference deleted
paths and the build would not pass. The current green test/build state
is **only** because these two changes are present in the working tree.

The `supabase/.temp/cli-latest` entry is local Supabase CLI generated
state and is not currently covered by `.gitignore`.

### Classification table

| File | Classification | Reason |
|---|---|---|
| `app/preview/dap/practice-decision-emails/page.tsx` | **KEEP** | Mechanical import fixup completing reorg `9d3647d`; without it, the file references deleted paths. Lives at `app/preview/dap/...` — outside every restricted prefix in the Part 14 policy. No new DAP surface added; no Stage 7 work duplicated. |
| `components/cb-control-center/tabs/SiteArchitectureTab.tsx` | **KEEP** | Same reorg fixup. Generic CBCC UI updating two import paths; no DAP-adapter internal coupling, no Anthropic SDK, no Supabase, no Next runtime, no `'use server'` / `'use client'` change. Diff is two type-only import lines. |
| `supabase/.temp/` | **IGNORE** | Local Supabase CLI generated state (`cli-latest` cache). Not covered by `.gitignore`. Add the narrowest safe rule. |

### Actions taken

1. **Updated `.gitignore`** with one line:
   ```
   # supabase CLI local state
   supabase/.temp/
   ```
2. **Staged** `app/preview/dap/practice-decision-emails/page.tsx`.
3. **Staged** `components/cb-control-center/tabs/SiteArchitectureTab.tsx`.
4. **Did not commit** anything inside `supabase/.temp/`.

### Boundary impact

| Boundary | Impact |
|---|---|
| Part 14 page-creation policy guard | Untouched. `pnpm check:page-policy` still passes (17 files / 3 prefixes); neither modified file is under a restricted prefix. |
| Part 13 adapter purity zone | Untouched. No file in `lib/cbcc/adapters/dap/` was modified. |
| Part 11 / 12 AI review mutation boundary | Untouched. No reviewer / approval / next-allowed-action source changed. |
| Part 11 engine-root vertical-neutrality | Untouched. No file under `lib/cbcc/*.ts` changed. |
| Generic CBCC UI vs DAP adapter | The SiteArchitectureTab change does not introduce DAP-adapter coupling — it switches two import paths within `lib/cb-control-center/architecture/...`, which is generic CBCC code. |
| Pre-existing 49 lint warnings | Unchanged. |
| Static page count | Unchanged at 199. |

### Validation results

| Gate | Result | Notes |
|---|---|---|
| `pnpm check:page-policy` | Pass | 0 violations; 17 files / 3 prefixes scanned |
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm test` | Pass | 6056 / 1 skipped (unchanged from Part 14) |
| `pnpm lint` | Pass | 0 errors; 49 pre-existing warnings; 0 new |
| `pnpm build` | Pass | Compiled successfully in 1936ms; 199 static pages, unchanged |

### Remaining recommendations

| Item | Class | When |
|---|---|---|
| Audit other consumers of the moved `mkcrm/` and `architecture/` clusters | Cleanup carry-forward | If any other importer was missed by `9d3647d`, typecheck would already fail — the gate is implicit. No additional action needed unless a future commit re-introduces an old import path. |
| Pre-commit hook running `pnpm check:page-policy` | Operational | Carry-forward from Part 14. |
| GitHub Actions running `pnpm check` | Operational | Carry-forward from Part 14. |
| AI review provider-port migration | Architectural — Risk rule #4 | Carry-forward from Parts 8X / 10–13. |

**Part 15 closes a hygiene loop, not an architecture loop.** The two
`M` files were never new feature work — they were cleanup that should
have been part of `9d3647d`. Staging them now removes the persistent
red herring at the bottom of `git status`. The `supabase/.temp/`
ignore entry stops the same item from reappearing as untracked on
every future status read.

---

## Part 16 Addendum — Final Architecture Boundary Audit (2026-05-01)

Part 16 is an inspection pass. The directive is explicit: do not move
files. Decide whether CBCC truly looks like

```
generic CBCC engine
  → vertical adapters
  → project-specific routes/components
  → optional AI review layer
  → stable UI shell
```

…and produce a target map and a minimal patch. After full inspection,
the minimal patch in this part is **doc-only**. Every boundary the
audit checks is already enforced by an existing test, and every
duplicate that exists is structurally tied to a live route, so a
merge in this part would not satisfy the "small, obviously correct,
test-covered, no route change" rule.

### 1. Current Folder Inventory

```
folder:                           lib/cbcc/
responsibility:                   generic CBCC engine — pure rules,
                                  vertical-neutral types, contracts
should remain:                    yes
should move later:                no
must not contain:                 DAP language, SDK calls, IO,
                                  framework imports, app-layer imports
current violations:               none in code; one doc-comment in
                                  pageCreationPolicy.ts:5 names DAP
                                  as the example vertical (cosmetic;
                                  not a coupling)

  files (14 impl + 13 test):
    adapters.ts            adapters.test.ts
    agentRegistry.ts       agentRegistry.test.ts
    agentRuntime.ts        agentRuntime.test.ts
    aiReview.ts            aiReview.test.ts
    aiReviewProvider.ts    aiReviewProvider.test.ts
    evidenceLedger.ts      evidenceLedger.test.ts
    nextAllowedAction.ts   nextAllowedAction.test.ts
    pageCreationPolicy.ts  (page-policy tests live with the adapter)
    projectRegistry.ts     projectRegistry.test.ts
    stageApproval.ts       stageApproval.test.ts
    stageLocking.ts        stageLocking.test.ts
    stagePageModel.ts      stagePageModel.test.ts
    types.ts               types.test.ts
    index.ts               coreBoundary.test.ts

folder:                           lib/cbcc/adapters/dap/
responsibility:                   pure DAP-to-engine mapping data
should remain:                    yes
should move later:                no (this is the canonical home)
must not contain:                 SDK, IO, fetch, supabase, Next, React,
                                  'use server'/'use client',
                                  cb-control-center imports, AI review
                                  symbol references
current violations:               none

  files (6 impl + 4 test):
    dapArtifacts.ts            dapAdapter.test.ts
    dapEvidence.ts             dapAcceptance.test.ts
    dapPageCreationPolicy.ts   dapEvidenceRequirements.test.ts
    dapProject.ts              dapPageCreationPolicy.test.ts
    dapStages.ts
    index.ts

folder:                           lib/cb-control-center/
responsibility:                   legacy + DAP-runtime app layer —
                                  Anthropic client, server actions,
                                  DAP UX rules, CMS export, dispatch
                                  layers, persistence stores, page-
                                  model translators, route helpers
should remain:                    yes (transitional)
should move later:                portions, but only behind ports —
                                  not by filename
must not contain:                 hard requirement: must not be
                                  imported by lib/cbcc/* (already
                                  enforced)
current violations:               none against current rules

  scale: 98 top-level impl files + 27 top-level test files
         + 4 subfolders (architecture/, client/, mkcrm/, source/)
         + dap-phase-tests/ (51 phase regression test files)

folder:                           app/
responsibility:                   route surface (Next.js App Router)
should remain:                    yes
must not contain:                 generic engine logic — routes wrap
                                  components, components consume engine
current violations:               none material

  scale: 60 route files (page.tsx + route.ts)
         build emits 199 static pages

folder:                           components/
responsibility:                   UI shell + stage panels + tabs
should remain:                    yes
must not contain:                 server-only imports inside client
                                  components (existing 'use client'
                                  files only)
current violations:               none material

  scale: 38 top-level + 4 subfolders (tabs/, dap-public/, dap-pages/, v2/)

folder:                           docs/
responsibility:                   reorganization narrative + addenda
should remain:                    yes
current violations:               none

folder:                           tests
location policy:                  unit tests live next to source;
                                  acceptance tests live in
                                  lib/cb-control-center/dap-phase-tests/
                                  and as dapStagePart{N}.test.ts files
current violations:               none
```

### 2. Generic vs Adapter vs Legacy Classification

| File | Bucket | Rationale |
|---|---|---|
| `lib/cbcc/{types,projectRegistry,stageLocking,stageApproval,evidenceLedger,stagePageModel,nextAllowedAction,pageCreationPolicy,adapters,agentRegistry,agentRuntime,aiReview,aiReviewProvider,index}.ts` | **A. Generic CBCC core** | All vertical-neutral, no SDK / IO / app-layer imports (verified by `coreBoundary.test.ts`). |
| `lib/cbcc/adapters/dap/{dapProject,dapStages,dapArtifacts,dapEvidence,dapPageCreationPolicy,index}.ts` | **B. DAP adapter** | Pure data + mappings to generic engine contracts. Verified by `dapAdapter.test.ts` + `dapStagePart7.test.ts` + `dapStagePart13.test.ts`. |
| `lib/cb-control-center/anthropicClient.ts` | **C. Legacy / app-specific** | Direct SDK client. Belongs outside the adapter purity zone until a port is introduced. |
| `lib/cb-control-center/dapStageReviewer.ts` | **C. Legacy / app-specific** | Calls `getAnthropicClient`, depends on `DapStageGate` (also legacy). Cannot move into adapter without weakening rules — see Part 13 Addendum. |
| `lib/cb-control-center/dapStageRubrics.ts` | **C. Legacy / app-specific** (eligible to migrate as pure data) | No forbidden imports; could move into the adapter as a future Part-N step. |
| `lib/cb-control-center/dapStageGates.ts` | **C. Legacy / app-specific** | DAP_STAGE_GATES registry — drives v1 route + StageDetailPage shape. Translator already projects from engine to this shape. |
| `lib/cb-control-center/cbccStageDefinitions.ts` (`CBCC_STAGE_DEFINITIONS`) | **C. Legacy / app-specific** | Vertical-neutral 7-stage seed used by DB-backed projects. Engine has equivalent type; this is data, not logic. Could become a default-adapter seed in a future part. |
| `lib/cb-control-center/cbccStageLocking.ts` (`computeStageVisibilities`) | **C. Legacy / app-specific** | Table-shaped variant of locking used by `<CbccStagePipeline>` v2 list view. Engine has authoritative `getStageLockReason` / `isStageLocked`. |
| `lib/cb-control-center/dapStageActions.ts` | **C. Legacy / app-specific** | Server action — `'use server'`. Calls engine via barrel; persists via store. Correct location. |
| `lib/cb-control-center/dapStageApprovalStore.ts` | **C. Legacy / app-specific** | Supabase-backed persistence. Correct location. |
| `lib/cb-control-center/cbccProject{Repository,Actions,Migration,…}.ts` | **C. Legacy / app-specific** | Supabase + server actions. Correct location. |
| `lib/cb-control-center/{architecture,client,mkcrm,source}/*` | **C. Legacy / app-specific** | Cluster moves from commit `9d3647d`. Pure data shapes that consume engine types; correct location for now (no SDK/IO inside, but app-layer-coupled by name and consumer set). |
| `lib/cb-control-center/dap-phase-tests/*` | **C. Legacy / app-specific** | Acceptance regression tests for DAP feature work. Correct location. |
| `app/projects/[slug]/{page,stages/[stageNumber]/page,charter/page}.tsx` | **D. Route layer** | Engine-backed v2 path. Calls engine via barrel + DAP adapter via `@/lib/cbcc/adapters/dap`. |
| `app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx` | **D. Route layer** | Legacy v1 path. Reads `DAP_STAGE_GATES`. Mounts the same `<StageDetailPage>` component as v2. |
| `app/{dental-advantage-plan,guides,treatments}/...` | **D. Route layer** | Public DAP surface (Tier 1). Gated by `DAP_PAGE_CREATION_POLICY`. |
| `app/preview/dap/...` | **D. Route layer** | DAP preview routes — explicitly outside the page-policy restricted prefix. |
| `app/api/businesses/dental-advantage-plan/stages/review/route.ts` | **D. Route layer + AI bridge** | Mocks `reviewStage` from legacy reviewer; advisory-only contract verified by `route.test.ts`. |
| `components/cb-control-center/{StageDetailPage,StageAiReviewPanel,DapStageOwnerApprovalForm,NextAllowedActionCard,StageMissingEvidencePanel,…}.tsx` | **D. UI / route layer** | Consume engine + legacy types. No DAP business logic invented here. |

### 3. Duplicate System Findings

| Duplicate | Files involved | Current purpose | Safe to merge now? | Risk | Recommendation |
|---|---|---|---|---|---|
| Stage definition data | `lib/cbcc/types.ts` (type) · `lib/cbcc/adapters/dap/dapStages.ts` (DAP instance) · `lib/cb-control-center/cbccStageDefinitions.ts` (7-stage neutral seed for DB-backed projects) | Engine has the type; DAP adapter has the DAP instance; legacy const seeds non-DAP projects via `cbccCharterGenerator` + `cbccProjectRepository`. | **No** | Legacy const is consumed by 18 test assertions in `cbccProjectRepository.test.ts`, charter generator, and the v2 registry test. Merging into a generic-default adapter requires a coordinated cutover. | Defer. When a second engine-backed adapter lands, extract a generic-default `lib/cbcc/adapters/default/` seeding the same 7 stages and retire the legacy const in one move. |
| Stage locking | `lib/cbcc/stageLocking.ts` (`getStageLockReason`/`isStageLocked`) · `lib/cb-control-center/cbccStageLocking.ts` (`computeStageVisibilities`) | Engine answers per-stage Q&A; legacy module computes a row-shaped visibility table for the v2 list component. Each consumes its own input shape. | **No** | The list-view component (`<CbccStagePipeline>`) reads `ProjectStage` rows from Supabase; the engine reads `CbccProject.stages`. Merging requires a translator inversion at the component boundary. | Defer. Rewrite `<CbccStagePipeline>` to consume `getStageLockReason` directly only when its data path moves to the engine. |
| Stage gate registry vs page model | `lib/cb-control-center/dapStageGates.ts` (`DAP_STAGE_GATES`) · `lib/cbcc/stagePageModel.ts` + `lib/cbcc/adapters/dap/dapStages.ts` (engine equivalent) · `lib/cb-control-center/cbccStagePageModelTranslator.ts` (bridge) | Legacy registry drives `<StageDetailPage>` shape (v1 path uses it directly; v2 path translates from engine into the same shape). | **No** | `DAP_STAGE_GATES` carries hand-written directives, requirements lists, and approval metadata that the engine does not yet host. Both v1 and v2 routes converge on the registry shape today. | Defer. The provider-port migration recommended in Part 13 also unlocks moving these directives into adapter data. |
| AI review surface | `lib/cbcc/aiReview.ts` (engine contract) · `lib/cbcc/aiReviewProvider.ts` (provider port, generic) · `lib/cb-control-center/dapStageReviewer.ts` (concrete Anthropic call + DAP truth rules) · `lib/cb-control-center/dapStageRubrics.ts` (per-stage rubric data) | Engine port is built but unwired. Concrete review still flows through the legacy reviewer. | **No** (exact same conflict Part 13 found) | Moving the reviewer into the adapter folder breaks pre-existing forbidden-deps invariants. | Carry forward Part 13's documented migration path: extract Anthropic provider into a runtime layer, then refactor the reviewer to consume the engine port. |
| Approval surface | `lib/cb-control-center/dapStageActions.ts` (`approveDapStageAction`) + `lib/cb-control-center/cbccProjectActions.ts` (`approveCharterAction`) · engine `applyStageApproval` / `canApproveStageWithEvidence` | Both legacy actions use engine predicates internally; no logic duplication. | n/a | Not a duplicate — already a clean wrapping. | Keep as-is. |

**No duplicate is safe to merge in Part 16's scope.** Each surviving duplicate is tied to either a live route shape or a deferred AI port migration.

### 4. Boundary Violations

The directive's three required greps were run verbatim. Every result is classified.

#### Grep 1: forbidden deps in `lib/cbcc/adapters/dap/`

```
grep -R "@anthropic-ai/sdk|getAnthropicClient|fetch(|supabase|next/|react|'use server'|'use client'" lib/cbcc/adapters/dap
```

| Hit | Classification |
|---|---|
| `dapAdapter.test.ts:73-81` (8 lines defining `FORBIDDEN_DEPS` regex table) | **Acceptable** — the test file enumerates the patterns it then scans non-test files for. Not a coupling. |

No impl-file hits. Adapter purity boundary holds.

#### Grep 2: vertical-language in generic engine

```
grep -R "dental|DAP|Dental Advantage" lib/cbcc --exclude-dir=adapters
```

| Hit | Classification |
|---|---|
| `agentRuntime.test.ts:313`, `agentRegistry.test.ts:99`, `aiReview.test.ts:424-425`, `aiReviewProvider.test.ts:258-259`, `coreBoundary.test.ts:136`, `evidenceLedger.test.ts:312-313`, `stagePageModel.test.ts:500-501`, `adapters.test.ts:90-93` | **Acceptable** — boundary tests scanning for `\bDAP\b` / `\bdental\b` and asserting absence in impl files. |
| `coreBoundary.test.ts:147` (doc comment about test mechanics) | **Acceptable** — meta-narrative in a test. |
| `coreBoundary.test.ts:187` + `adapters.ts:21` + multiple `adapters.test.ts` lines matching `EMPTY_ADAPTER_REGISTRY` | **False positive** — substring match on `ADAP**TER**`. The `\bDAP\b` boundary tests use word-boundary regex; the directive's grep does not. |
| `pageCreationPolicy.ts:5` — `// to DAP or any other vertical. Adapters supply the rules.` | **Pre-existing but tolerated** — single doc-comment naming DAP as the example vertical. Engine code itself is vertical-neutral. Cosmetic only. |

No code-level coupling.

#### Grep 3: legacy-folder imports from generic engine

```
grep -R "lib/cb-control-center" lib/cbcc
```

| Hit | Classification |
|---|---|
| (no matches) | **Clean** — engine never imports the app layer. |

#### Existing boundary tests already enforce these rules

| Boundary | Enforced by |
|---|---|
| Engine root has no DAP language | `lib/cbcc/coreBoundary.test.ts` (vertical-language scan) |
| Engine root has no SDK / IO / Next / React / server-client directives | `coreBoundary.test.ts` (FORBIDDEN_DEPS table) |
| Engine root has no app-layer imports | `coreBoundary.test.ts` + Part 11 grep + Part 13 Group 3 |
| Engine barrel does not re-export DAP review symbols | Part 13 Group 3 |
| Adapter folder has no SDK / IO / Next / React / server-client / cb-control-center imports | `lib/cbcc/adapters/dap/dapAdapter.test.ts` + `lib/cb-control-center/dapStagePart7.test.ts` ("no adapter file imports lib/cb-control-center") + Part 13 Group 2 (expanded ban list) |
| Adapter folder has no DAP-review symbol references | Part 13 Group 2 |
| Approval action source has no AI module imports | Part 11 Group E + Part 12 Group E |
| Reviewer source has no approval-store imports | Part 11 Group E + Part 12 Group E |
| Page-creation policy holds against the live tree | Part 14 standalone CLI + adapter test + part 14 test |

The boundary surface is now defended at six independent points. No new test is required in Part 16.

### 5. Route Stability Findings

60 route files; 199 static pages built. All routes are stable. No route added, removed, renamed, or repurposed in Part 16.

| Route family | Current component | Data source | Class | Should remain | Risk |
|---|---|---|---|---|---|
| `/` | `<CbHomeDashboard>` | `cbBusinessPortfolioData` (static) | Generic | Yes | None |
| `/projects` | static list | static portfolio | Generic | Yes | None |
| `/projects/new` | placeholder | none | Generic | Yes | None |
| `/projects/[slug]` | server component + `<NextAllowedActionCard>` (Part 12) + `<CbccStagePipeline>` (v2) | engine-backed for DAP via `translateDapProjectForPipeline` + `getNextAllowedAction`; Supabase for others | Mixed (engine + legacy translator) | Yes | None |
| `/projects/[slug]/charter` | charter view | repository | Legacy | Yes | None |
| `/projects/[slug]/stages/[stageNumber]` | `<StageDetailPage>` + `<DapStageOwnerApprovalForm>` (DAP) or `<DeferredApprovalGate>` (others) | engine-backed gate via `cbccStagePageModelTranslator` (DAP) or generic stage adapter | Mixed | Yes | None |
| `/businesses/dental-advantage-plan` | summary | static | Legacy | Yes | None |
| `/businesses/dental-advantage-plan/build` | pipeline shell | mock + persisted overlays | Legacy | Yes | None |
| `/businesses/dental-advantage-plan/build/stages/[stageSlug]` | `<StageDetailPage>` (same component as v2) | `DAP_STAGE_GATES` registry | Legacy v1 | Yes | None |
| `/businesses/new` | placeholder | none | Generic | Yes | None |
| `/dental-advantage-plan/...` (10 page.tsx + layout) | DAP public pages | DAP UX rules + section models | Legacy DAP runtime, gated by Part 14 policy | Yes | None |
| `/guides/[slug]`, `/treatments/[slug]` | DAP guide/treatment pages | DAP CMS data | Legacy DAP runtime, gated by Part 14 policy | Yes | None |
| `/preview/dap/...` (≥30 routes) | DAP preview surfaces | DAP fixtures + previews | Legacy DAP runtime, outside restricted prefixes | Yes | None |
| `/api/businesses/dental-advantage-plan/stages/review` | POST handler | calls `reviewStage` from legacy reviewer | Legacy AI bridge | Yes | None |
| `/api/dap/requests` | POST handler | DAP request actions | Legacy DAP runtime | Yes | None |

### 6. AI Review Layer Placement

Mapped against the directive's 6-bucket target:

| Bucket | File | Status |
|---|---|---|
| Generic review contract | `lib/cbcc/aiReview.ts` (`CbccAiReviewResult`, `normalizeCbccAiReviewResult`, types) | **In place** — provider-neutral, vertical-neutral. Verified by `aiReview.test.ts` boundary scan. |
| Provider interface | `lib/cbcc/aiReviewProvider.ts` (`CbccAiReviewProvider`, `runCbccAiReview`, error types) | **In place** — abstract provider port; no SDK import. Verified by `aiReviewProvider.test.ts`. |
| Anthropic implementation | `lib/cb-control-center/anthropicClient.ts` | **Correct location** — Direct `@anthropic-ai/sdk` use. Cannot live in engine or adapter without breaking purity rules. |
| DAP rubrics | `lib/cb-control-center/dapStageRubrics.ts` | **Correct location for now** — pure data, but currently consumed only by the legacy reviewer. Eligible to migrate into the adapter as a self-contained future part. |
| Concrete reviewer (rubric + prompt + Anthropic call) | `lib/cb-control-center/dapStageReviewer.ts` | **Correct location for now** — calls `getAnthropicClient`, depends on `DapStageGate` from `lib/cb-control-center/`. Cannot move into adapter (Part 13 Addendum). |
| UI display | `components/cb-control-center/StageAiReviewPanel.tsx` | **Correct location** — type-only import from reviewer; no SDK/IO. |
| Route wrapper | `app/api/businesses/dental-advantage-plan/stages/review/route.ts` | **Correct location** — POST-only, advisory-only, no persistence. Verified by `route.test.ts`. |

**The engine port exists but is unwired.** Routes still call the legacy `reviewStage` directly. Wiring the route to use `runCbccAiReview` + an Anthropic provider implementation is the next architecture milestone (carry-forward from Parts 8X / 10–13).

### 7. Recommended Target Structure

```
TARGET STRUCTURE

lib/cbcc/
  purpose:
    Generic, vertical-neutral CBCC engine. Pure rules, contracts, types.
  allowed dependencies:
    - other lib/cbcc/* modules (within engine root)
    - standard library (Set, Map, etc.)
  disallowed dependencies:
    - lib/cbcc/adapters/* (engine never reaches into adapters)
    - lib/cb-control-center/*
    - @anthropic-ai/sdk, openai, supabase, next/*, react
    - 'use server' / 'use client' directives
    - vertical language (DAP, dental, …) in code (doc comments tolerated as
      single-example illustrations only)
  files that belong here:
    types.ts, projectRegistry.ts, stageLocking.ts, stageApproval.ts,
    evidenceLedger.ts, stagePageModel.ts, nextAllowedAction.ts,
    pageCreationPolicy.ts, adapters.ts, agentRegistry.ts, agentRuntime.ts,
    aiReview.ts, aiReviewProvider.ts, index.ts (barrel)

lib/cbcc/adapters/dap/
  purpose:
    Pure DAP-to-engine mapping data + adapter surface.
  allowed dependencies:
    - lib/cbcc/* engine types and helpers
    - sibling files within adapters/dap/
  disallowed dependencies:
    - @anthropic-ai/sdk, openai, supabase
    - next/*, react, 'use server', 'use client'
    - lib/cb-control-center/* (any path)
    - DAP review symbol names (reviewStage, StageAiReview, DapStageRubric)
  files that belong here:
    dapProject.ts, dapStages.ts, dapArtifacts.ts, dapEvidence.ts,
    dapPageCreationPolicy.ts, index.ts
  files that may move here later (subject to AI port migration):
    dapStageRubrics.ts (already pure data; safe self-contained move)

lib/cb-control-center/
  purpose:
    Legacy + DAP runtime app layer. Anthropic client, server actions,
    DAP UX rules, CMS export, dispatch / approval / outbox pipelines,
    persistence stores, page-model translators.
  why it still exists:
    - Holds SDK-touching, server-only, Supabase-bound code that cannot
      live in the engine or adapter purity zones
    - Holds the DAP_STAGE_GATES registry that drives both v1 and v2
      stage detail pages
    - Holds 51 dap-phase regression tests that validate the legacy path
  files that may remain here:
    anthropicClient.ts, dapStageReviewer.ts, dapStageGates.ts,
    dapStage{Actions,ApprovalStore,StateResolver}.ts, cbccProject{*}.ts,
    architecture/, client/, mkcrm/, source/, dap-phase-tests/
  files that may move later:
    dapStageRubrics.ts → adapters/dap/ (safe, pure data)
    dapStageReviewer.ts → only after AI port migration extracts the
      Anthropic provider into a separate runtime layer
    cbccStageDefinitions.ts → potentially become a default-seed adapter
      under lib/cbcc/adapters/default/ when a second engine-backed
      adapter exists

app/
  purpose:
    Next.js App Router route surface (60 route files, 199 static pages).
  route stability notes:
    - Both v1 (/businesses/dental-advantage-plan/build/stages/[stageSlug])
      and v2 (/projects/[slug]/stages/[stageNumber]) paths are live and
      mount the same <StageDetailPage>.
    - DAP public surface (/dental-advantage-plan, /guides, /treatments)
      is gated by Part 14 page-creation policy.
    - Preview routes (/preview/dap/...) are explicitly outside the
      restricted prefix.
    - No route should be removed or renamed without an explicit, testable
      migration plan and a redirect strategy.

components/
  purpose:
    UI shell and stage panels. React-rendered, may be 'use client' or
    server components. Should consume engine models and DAP adapter data,
    not author business logic.
```

### 8. Minimal Changes Made

**This addendum is the only change.** No code modified, no files moved, no tests added or weakened, no exports altered. Justification:

1. The directive's "Allowed examples" for minimal patches include
   "add architecture map" and "add documentation" — both satisfied
   by this section.
2. Every other allowed example (boundary test, missing export
   barrel, renamed misleading comment) was evaluated and rejected:
   - **Boundary test**: every boundary the audit names is already
     defended by an existing test (table at end of §4). Adding a
     redundant one would be busy-work.
   - **Export barrel**: `lib/cbcc/index.ts` already exposes the
     full intended public surface; nothing missing.
   - **Misleading comment**: the only candidate is
     `pageCreationPolicy.ts:5` which says "to DAP or any other
     vertical." Sharpening the wording removes a *DAP* word but
     adds no enforcement. Deferred to taste.

### 9. Verification Results

| Gate | Result |
|---|---|
| `pnpm check:page-policy` | Pass (0 violations; 17 files / 3 prefixes) |
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | Pass (6056 / 1 skipped — unchanged from Part 14) |
| `pnpm lint` | Pass (0 errors; 49 pre-existing warnings; 0 new) |
| `pnpm build` | Pass (Compiled in 1897ms; 199 static pages, unchanged) |
| Grep 1 (forbidden deps in adapters/dap) | Clean (only test-file pattern table; no impl hits) |
| Grep 2 (vertical language in lib/cbcc) | Clean (only boundary-test fixtures + 1 doc comment + ADAPTER substring matches) |
| Grep 3 (cb-control-center imports from lib/cbcc) | Clean (no matches) |

### 10. Final Recommendation

**The architecture is now true.** CBCC is the reusable engine
(`lib/cbcc/`), DAP is one adapter (`lib/cbcc/adapters/dap/`), AI
review is optional and layered (engine port + legacy concrete impl
behind a route), routes remain stable, and tests defend the
boundaries at six independent points.

**The safe answer in Part 16 is: do not move anything.** The
remaining duplicates are not architectural drift — they are the
visible cost of two transitional realities (v1 + v2 routes
coexisting, the AI port not yet wired). Both will be retired in
their own dedicated parts; collapsing them inside Part 16 would
either change route behavior or weaken a test, which the directive
forbids.

**Next architectural milestone (highest leverage, deferred from
Parts 8X / 10–15):** AI review provider-port migration. Steps,
copied from the Part 13 Addendum:

1. Extract Anthropic SDK use into
   `lib/cb-control-center/runtime/anthropicProvider.ts` (or similar)
   implementing `CbccAiReviewProvider`.
2. Refactor the API route to call `runCbccAiReview` with the
   provider instance and a packet built from the engine page model.
3. Move `dapStageRubrics.ts` into `lib/cbcc/adapters/dap/` (already
   pure data; trivial follow-up).
4. Drop the direct `getAnthropicClient` import from
   `dapStageReviewer.ts`; reduce that file to a thin packet builder
   over the engine port.
5. Once `dapStageReviewer.ts` no longer imports the SDK or
   `lib/cb-control-center/dapStageGates`, it qualifies for the
   adapter purity zone and can move there without weakening any
   pre-existing rule.

**Lower-priority architectural follow-ups** (each its own future
part): default-seed adapter for non-DAP engine-backed projects,
generalize `<CbccStagePipeline>` to consume `getStageLockReason`
directly, retire `DAP_STAGE_GATES` after the AI-port migration
exposes its directives as adapter data.

**Operational follow-ups** (carry-forward from Part 14): wire
`pnpm check:page-policy` into a pre-commit hook when the repo
adopts a hook framework; add a CI workflow running `pnpm check`
on push and PR.

## Part 17 Addendum — AI Review Provider-Port Migration (2026-05-01)

**Goal.** Wire the existing generic engine port
(`lib/cbcc/aiReview.ts` + `lib/cbcc/aiReviewProvider.ts`) into the
DAP AI review flow without breaking any prior boundary, weakening
any prior test, or changing the UI shape. After Part 17 the route
goes through `runCbccAiReview(...)`; Anthropic SDK use stays in the
legacy app-layer folder behind a single new boundary file that
implements the engine's `CbccAiReviewProvider` interface.

**What changed.**

1. New runtime provider:
   `lib/cb-control-center/cbccAnthropicAiReviewProvider.ts` —
   implements `CbccAiReviewProvider`, single-shot per request,
   delegates to the existing `reviewStage(gate)`, and translates
   the legacy `StageAiReview` into the engine's raw shape via a
   pure `legacyReviewToEngineRaw(...)` mapper. The provider also
   stores the original legacy result so the route can hand it to
   the UI without changing the response shape.

2. Route refactor:
   `app/api/businesses/dental-advantage-plan/stages/review/route.ts`
   no longer calls `reviewStage(...)` directly. It now:
   - resolves the DAP gate (unchanged),
   - maps `stageNumber` → engine `stageId` via
     `DAP_STAGE_DEFINITIONS` (the adapter is the single source of
     truth for that mapping),
   - builds a packet via `buildCbccAiReviewPromptPacket(...)`,
   - constructs a one-shot provider via
     `createDapAnthropicAiReviewProvider(gate)`,
   - awaits `runCbccAiReview({ packet, provider })` so the
     engine's normalize step runs against the provider's output,
   - returns `provider.consumeLastLegacy()` to the UI so the
     existing `StageAiReviewPanel` renders unchanged.

3. New acceptance suite:
   `lib/cb-control-center/dapStagePart17.test.ts` (32 tests in 6
   sections) asserts the provider module shape, the legacy →
   engine mapping for each recommendation/confidence/checklist
   case, an end-to-end round-trip through `runCbccAiReview`, the
   route's import surface, the engine's continued purity, and the
   route's continued advisory-only posture (no approval/unlock/
   persistence).

**Mapping decisions baked into the provider.**

| Legacy `recommendation` | Engine `decision`     | Engine `recommendation.action`  |
| ----------------------- | --------------------- | ------------------------------- |
| `approve`               | `pass`                | `proceed_to_owner_review`       |
| `request_revision`      | `pass_with_concerns`  | `address_risks`                 |
| `disapprove`            | `fail`                | `revise_artifact`               |

`confidence` ∈ {`high`, `medium`, `low`} maps 1:1 to the severity
of every derived risk. Failed checklist items become engine risks
(one per item; passed items are dropped). Empty `reasoning`
falls back to a synthetic non-empty string so engine normalize
never trips on the summary/rationale required-field rules.

**Boundaries preserved.** Each prior invariant is re-asserted in
Part 17:
- engine contract (`lib/cbcc/aiReview.ts`) and engine port
  (`lib/cbcc/aiReviewProvider.ts`) remain free of Anthropic SDK,
  Supabase, Next/React, server/client markers, and any reference
  to the runtime provider;
- `lib/cbcc/adapters/dap/` stays pure (no SDK, no IO, no
  cross-imports from `lib/cb-control-center/`, no review-symbol
  surface, no reference to the runtime provider);
- the engine barrel still does not export DAP review symbols or
  the runtime provider;
- the runtime provider does not touch the approval store, the
  Supabase client, or any persistence path;
- the route exposes only `POST` and never reaches an approval
  action.

The Part 13 Group 4 assertion that the route file contains
`from '@/lib/cb-control-center/dapStageReviewer'` continues to
pass via a `import type { StageAiReview }` line — the route still
needs the legacy shape's name for typing the harvest variable, so
the importer chain back to the reviewer is preserved (now with one
extra hop through the provider).

**Why dapStageRubrics / dapStageReviewer did NOT move.** The
Part 13 Group 2 boundary test forbids any
`adapters/dap/*.ts` file from referencing `dapStageReviewer`,
`dapStageRubrics`, `StageAiReview`, `DapStageRubric`, or
`reviewStage`. Both files structurally violate that surface — the
reviewer because it calls the SDK, the rubric because Group 2
explicitly bans the symbol name. Moving either would have required
weakening a pre-existing test, which the Part 17 directive
forbids. The next part can safely move `dapStageRubrics` after
either renaming the boundary regex or accepting that the rubric
data lives one level deeper than the symbol-name guard. That is
mechanical and out of scope here.

**Validation.**
- Page-policy guard: pass (`pnpm check:page-policy`).
- Typecheck: clean (`pnpm typecheck`).
- Vitest: **6088 tests pass**, 1 skipped, 101 files
  (`pnpm test`).
- Lint: 0 errors, 50 warnings — all warnings pre-existing
  (`pnpm lint`).
- Production build: succeeds, route surface unchanged
  (`pnpm build`).

**Next architectural milestone.** Move `dapStageRubrics.ts` into
`lib/cbcc/adapters/dap/` once the Part 13 Group 2 symbol-name
guard is rephrased to target imports rather than identifiers.
Once that is done, `dapStageReviewer.ts` becomes the only legacy
review file outside the adapter zone, and a follow-up part can
shrink it to a thin Anthropic transport behind the same provider
boundary established here.

## Part 18 Addendum — Decompose Legacy DAP Reviewer Boundary (2026-05-01)

**Goal.** Take the Part 17 provider apart along its real
responsibilities — Anthropic transport vs. legacy↔engine shape
conversion — so future provider/mapper changes can move
independently. Inspection-first; extraction only where obvious;
no boundary weakening.

### Responsibility map (inspection result)

| File | Owns today | Should keep | Could extract | Decision |
|------|------------|-------------|---------------|----------|
| `lib/cb-control-center/dapStageReviewer.ts` | `StageAiReview` / `StageAiChecklistResult` types · `DAP_TRUTH_RULES` · prompt assembly · Anthropic SDK call · response parse · error fallback | The SDK call site (this is why it lives here) | Prompt assembly into a pure helper | **Defer.** Not obvious enough; intertwined with rubric/truth-rules and only ~113 lines total. |
| `lib/cb-control-center/dapStageRubrics.ts` | Per-stage rubric data · prompt format helper | All of the above (already pure) | Could move to `lib/cbcc/adapters/dap/` | **Defer.** Part 13 Group 2 symbol guard explicitly bans the names `dapStageRubrics`/`DapStageRubric` from adapter files. Moving requires loosening that regex (separate Part). |
| `lib/cb-control-center/cbccAnthropicAiReviewProvider.ts` (Part 17) | legacy↔engine raw mapper · `DapAnthropicAiReviewProvider` interface · single-shot factory · `consumeLastLegacy()` | Provider interface + factory + harvest | The mapper has no SDK dependency and is conceptually shape-conversion, not transport | **Extract.** Pulled into a sibling `dapStageAiReviewLegacy.ts`. |
| `lib/cbcc/aiReview.ts` + `lib/cbcc/aiReviewProvider.ts` | Pure engine contract + port | All of the above | Nothing | **Untouched.** |
| `app/api/businesses/dental-advantage-plan/stages/review/route.ts` (Part 17) | HTTP handler · stage resolution · packet build · provider call · legacy harvest | All of the above | Nothing | **Untouched.** |
| `components/cb-control-center/StageAiReviewPanel.tsx` | Renders the legacy `StageAiReview` shape | All of the above | Nothing | **Untouched.** |

### What changed

1. New file: `lib/cb-control-center/dapStageAiReviewLegacy.ts`
   owns `legacyReviewToEngineRaw()` and
   `LegacyToEngineMappingOptions`. Pure, no SDK/IO/Next/React, no
   imports from `lib/cbcc/`.
2. `cbccAnthropicAiReviewProvider.ts` no longer defines the
   mapper or its options — it imports them from the new file.
   The provider file is now Anthropic-boundary + harvest only.
3. Part 17 test imports updated to read
   `legacyReviewToEngineRaw` from the new module. The "module
   exports the factory and the mapping function" assertion was
   split into two single-module assertions (no weakening — the
   same two facts are still asserted).
4. New file: `lib/cb-control-center/dapStagePart18.test.ts` (52
   tests in 8 sections) records the responsibility map as
   executable invariants and asserts every boundary Part 18
   promised not to weaken.

### What was deliberately not changed

- `dapStageReviewer.ts` was **not** thinned further. The directive
  said "extract only if obvious" — prompt assembly, truth rules,
  rubric integration, and SDK call are tightly intertwined inside
  ~113 lines, and pulling any one out risks churn for marginal
  benefit.
- `dapStageRubrics.ts` was **not** moved into the adapter zone.
  Part 13 Group 2 explicitly bans the symbol names; moving
  requires rephrasing the boundary regex, which is a separate
  Part.
- The route, the engine, the adapter, and the UI panel were
  **not** touched. Behavior preservation is verified end-to-end
  by Part 18 Section D.

### Boundary status

- Engine (`lib/cbcc/`) — pure. No SDK, no DAP review symbol
  leakage, no reference to the new mapper or to the provider.
- Adapter (`lib/cbcc/adapters/dap/`) — pure. No reference to the
  mapper, no reference to the provider, no `cb-control-center`
  imports.
- Runtime provider (`cbccAnthropicAiReviewProvider.ts`) — owns
  transport + harvest. Imports the engine port and the legacy
  reviewer; imports the new mapper for shape conversion.
- New mapper (`dapStageAiReviewLegacy.ts`) — pure shape
  conversion. Imports only the legacy `StageAiReview` type.
- Route — unchanged from Part 17. Still flows through
  `runCbccAiReview` and returns the legacy harvest.
- UI panel — unchanged. Still imports legacy types from
  `dapStageReviewer.ts`.

### Validation results

- Page-policy guard: pass (`pnpm check:page-policy`, 17 files
  scanned under 3 rule prefixes).
- Typecheck: clean (`pnpm typecheck`).
- Vitest: **6141 tests pass**, 1 skipped, 102 files
  (`pnpm test`).
- Lint: 0 errors, 50 warnings — all pre-existing
  (`pnpm lint`).
- Production build: succeeds (`pnpm build`).

### Recommendation for Part 19

The next high-value boundary improvement is rephrasing the Part
13 Group 2 adapter purity regex from "ban symbol name" to "ban
import path." Today the guard reads
`{ pattern: /dapStageRubrics/, label: 'dapStageRubrics reference' }`
and matches any token, including a comment that mentions the
file by name. Once this is rephrased to match
`from ['"][^'"]*dapStageRubrics[^'"]*['"]` the rubric data — which
is already pure — qualifies for the adapter zone, and a follow-up
Part can move it without weakening the test.

After that move, the next candidate is `dapStageReviewer.ts`.
With the rubric module relocated and the prompt assembly
extracted (also a Part 19+ candidate), the reviewer shrinks to a
thin Anthropic transport that can either remain in
`lib/cb-control-center/` as a deliberate runtime boundary or be
folded into `cbccAnthropicAiReviewProvider.ts` directly. Either
shape is defensible; the choice depends on whether the project
eventually adds a non-Anthropic provider.

## Part 19 Addendum — Move Pure DAP Stage Rubrics Into the Adapter Zone (2026-05-02)

**Goal.** Move `dapStageRubrics.ts` to the place its dependencies
have always allowed — `lib/cbcc/adapters/dap/` — without weakening
the adapter's purity invariants. Part 18 had identified this as
the next-highest-leverage extraction; Part 13's symbol-name regex
was the only thing blocking it. Part 19 rephrases that regex so
the move becomes legal, and the architectural rule it actually
protects is stated more precisely.

### What moved

- `lib/cb-control-center/dapStageRubrics.ts`
  → `lib/cbcc/adapters/dap/dapStageRubrics.ts`
- `lib/cb-control-center/dapStageRubrics.test.ts`
  → `lib/cbcc/adapters/dap/dapStageRubrics.test.ts`

`git mv` preserves history. The data + helper exports are
unchanged in name and shape:
`DapStageRubric`, `DAP_STAGE_RUBRICS`, `getDapStageRubric`,
`formatDapStageRubricForPrompt`.

### What changed

1. `lib/cb-control-center/dapStageReviewer.ts` import path:
   - **before:** `import { … } from './dapStageRubrics'`
   - **after:** `import { … } from '@/lib/cbcc/adapters/dap/dapStageRubrics'`
   This is the only consumer of the rubric. Verified by Part 19
   Section E: a directory scan of `lib/cb-control-center/`
   confirms `dapStageReviewer.ts` is the lone importer.

2. `lib/cb-control-center/dapStagePart13.test.ts` Group 2
   `ADAPTER_FORBIDDEN` array dropped two patterns:
   - `{ pattern: /dapStageRubrics/, label: 'dapStageRubrics reference' }`
   - `{ pattern: /\bDapStageRubric\b/, label: 'DapStageRubric reference' }`

   Group 1 narrative + assertions updated to record the move
   (rubric file no longer at the legacy path; reviewer now
   imports from the adapter). The `cb-control-center` import-path
   ban — the rule the suite actually protects — is unchanged.
   Bans on runtime-behavior tokens (`dapStageReviewer`,
   `reviewStage`, `StageAiReview`) remain.

3. `lib/cb-control-center/dapStagePart18.test.ts` updated
   `RUBRICS_PATH` to the new adapter location and updated the
   reviewer-import-substring assertion from `'./dapStageRubrics'`
   to `'@/lib/cbcc/adapters/dap/dapStageRubrics'`.

4. New file `lib/cb-control-center/dapStagePart19.test.ts` (32
   tests in 7 sections) records the move outcome, the adapter
   rubric purity, the dependency-cleanliness of the adapter zone,
   the engine-purity preservation, the reviewer wiring update,
   the unchanged UI/route surface, and the Part 13 boundary regex
   rephrasing.

### Why the boundary is now stronger, not weaker

The previous rule said "no token matching `dapStageRubrics` or
`DapStageRubric` may appear in the adapter folder." The new rule
says "no file in the adapter folder may import from
`lib/cb-control-center/`." The new rule is:

- **More precise.** It directly states the architectural
  invariant. The old rule was a name-shape coincidence that just
  happened to align with the invariant while the rubric file
  lived outside the adapter.
- **Stricter on the actual risk surface.** Path-based dependency
  bans catch *any* legacy file an adapter might pull in, not just
  the two that were named.
- **Unblocking instead of paralyzing.** Pure data files no longer
  fail the boundary just because the architectural review
  borrowed their type-name. A future Part-N can move other pure
  DAP data the same way without further regex surgery.

The adapter zone's runtime-behavior bans (`dapStageReviewer`,
`reviewStage`, `StageAiReview`) remain — those tokens identify
runtime concerns (SDK transport, legacy UI shape) that have no
legitimate place in an adapter and would not be caught by a
path-based check alone.

### What was deliberately not changed

- `dapStageReviewer.ts` stays in `lib/cb-control-center/`.
  Reasoning unchanged from Part 17/18: it calls
  `getAnthropicClient()` and depends on `DapStageGate` from the
  legacy folder. Moving requires either weakening adapter purity
  (forbidden) or splitting the file into pure prompt assembly +
  Anthropic execution (the suggested Part 20).
- `cbccAnthropicAiReviewProvider.ts`,
  `dapStageAiReviewLegacy.ts`, the route, the engine, and the UI
  panel are untouched. Behavior preservation verified end-to-end
  by Part 19 Section F (route still calls `runCbccAiReview` +
  `consumeLastLegacy()`; panel still imports legacy types from
  the reviewer module).
- The DAP adapter local barrel (`lib/cbcc/adapters/dap/index.ts`)
  was deliberately NOT updated to re-export the rubric. Keeping
  it out of the barrel keeps the engine barrel clean (Part 19
  Section D verifies neither the engine barrel nor the adapter
  barrel re-export the rubric) and forces the legacy reviewer to
  reach for the rubric explicitly via the file path — making it
  easier to reason about who depends on review-time data.

### Validation results

- Page-policy guard: pass (`pnpm check:page-policy`, 17 files
  scanned under 3 rule prefixes).
- Typecheck: clean (`pnpm typecheck`).
- Vitest: **6188 tests pass**, 1 skipped, 103 files
  (`pnpm test`).
- Lint: 0 errors, 50 warnings — all pre-existing
  (`pnpm lint`).
- Production build: succeeds (`pnpm build`).

### Recommendation for Part 20

The next high-leverage piece is the suggested Part 20 from the
Part 19 directive: **split `dapStageReviewer.ts` into pure prompt
assembly vs. Anthropic execution.** Today the reviewer mixes:

1. `DAP_TRUTH_RULES` constant (pure data)
2. system + user prompt assembly (pure function of gate + rubric
   + truth rules)
3. `getAnthropicClient()` + `client.messages.create(...)` (the
   SDK transport)
4. response text extraction + `JSON.parse` + error fallback (the
   transport layer)

Items (1) and (2) qualify for the adapter zone the same way the
rubric did — they're pure data and pure functions of pure data.
Once extracted, only items (3) and (4) need to live in
`lib/cb-control-center/`, and they fit naturally inside
`cbccAnthropicAiReviewProvider.ts`. After that, the reviewer
file either becomes a thin transport stub or disappears entirely,
folded into the provider.

That's the move that finishes the path-to-clean-shape sketched
across Parts 13–19:

- `lib/cbcc/` — generic engine (already clean)
- `lib/cbcc/adapters/dap/` — DAP project + stages + rubric +
  prompt builder + truth rules
- `lib/cb-control-center/` — Next/UI/app-adjacent legacy + the
  Anthropic transport boundary + legacy review compatibility

## Part 20 Addendum — Split DAP Stage Reviewer Into Pure Prompt Assembly vs Runtime Execution (2026-05-02)

**Goal.** Take the final cleanup step sketched across Parts
13–19: separate `dapStageReviewer.ts` into the pure prompt
assembly that belongs in the adapter zone and the Anthropic
transport that must remain outside it. Inspection-first; minimal
extraction; preserve runtime behavior exactly.

### What was extracted

New file:
`lib/cbcc/adapters/dap/dapStageReviewPrompt.ts`

owns:
- `DAP_TRUTH_RULES` — the 7 immutable "DAP does not …"
  assertions.
- `DapStageReviewPromptInput` — a structural input type
  declaring only the gate fields the prompt reads. Lets the
  legacy reviewer pass a `DapStageGate` without forcing the
  adapter to import that type from the legacy folder
  (TypeScript's structural typing handles the rest).
- `DapStageReviewPromptPacket` — the `(systemPrompt, userPrompt)`
  pair the reviewer hands to the SDK.
- `buildDapStageReviewPromptPacket(input)` — the pure builder.
  Threads the per-stage rubric in via the adapter-zone rubric
  module (Part 19), embeds the ANTI-BYPASS RULE, the truth
  rules, the advisory disclaimer, the "owner approval is
  separate" note, and the JSON response-shape contract.

Co-located test:
`lib/cbcc/adapters/dap/dapStageReviewPrompt.test.ts` — 18 tests
covering truth-rule integrity, system prompt content, user
payload structure, rubric integration (with-rubric and
no-rubric branches), and pure-function determinism.

### What intentionally stayed in `lib/cb-control-center/`

`dapStageReviewer.ts` is now ~85 lines and owns only:
- `StageAiChecklistResult` and `StageAiReview` types — the
  legacy UI shape `StageAiReviewPanel` renders. These are the
  pre-engine-port compatibility contract; moving them would
  ripple through the panel and the runtime provider's
  `consumeLastLegacy()` harvester.
- `getAnthropicClient()` call + `client.messages.create({…})`
  — the Anthropic transport.
- Response text extraction (filter content blocks, join text).
- `JSON.parse` of the response.
- Error fallback returning a `request_revision` review with
  `low` confidence.

Its only adapter-zone import is the prompt builder; the rubric
module is reached transitively through that builder.

### Updated responsibility map

| File | Owns | Boundary |
|------|------|----------|
| `lib/cbcc/adapters/dap/dapStageRubrics.ts` (Part 19) | Per-stage rubric data + format helper | Pure adapter |
| `lib/cbcc/adapters/dap/dapStageReviewPrompt.ts` (Part 20) | Truth rules constant, structural input type, prompt builder | Pure adapter |
| `lib/cb-control-center/dapStageReviewer.ts` (Part 20 slimmed) | `StageAiReview` types, Anthropic transport, response parse, error fallback | Legacy runtime |
| `lib/cb-control-center/cbccAnthropicAiReviewProvider.ts` (Part 17/18) | `CbccAiReviewProvider` impl, single-shot factory, legacy harvest via `consumeLastLegacy()` | Legacy runtime |
| `lib/cb-control-center/dapStageAiReviewLegacy.ts` (Part 18) | Pure legacy ↔ engine-raw mapper | Legacy adjacent |
| `app/api/businesses/dental-advantage-plan/stages/review/route.ts` (Part 17) | HTTP handler · stage resolution · packet build · `runCbccAiReview` · legacy harvest | App layer |
| `lib/cbcc/aiReview.ts` + `lib/cbcc/aiReviewProvider.ts` | Generic engine contract + port | Pure engine |

### Boundary rules preserved

The adapter zone's purity is unchanged in spirit:
- No Anthropic SDK / no `getAnthropicClient`.
- No Supabase / no Next/React / no server/client directives.
- No imports from `lib/cb-control-center/`.
- No `fetch(`, no filesystem IO.

Three pre-existing tests had to be tightened to scan source
*with comments stripped* or *via path-based regex* rather than
bare-word match — the new prompt module's documentation block
deliberately mentions the forbidden tokens to explain the
boundary rule, and prose is not a runtime risk:
- `lib/cb-control-center/dapStagePart7.test.ts` — line 553's
  bare `/cb-control-center/` regex tightened to
  `/from ['"][^'"]*cb-control-center[^'"]*['"]/`.
- `lib/cb-control-center/dapStagePart18.test.ts` — Section F
  now strips comments and uses path-based regex (mirrors Part
  13 Group 2's approach).

This is the same form of rephrase Part 19 introduced — the rule
the suite actually wants to protect ("no actual imports from the
legacy folder") is stated more precisely. Earlier tests
(`dapStagePart13.test.ts` Group 1, `dapStagePart18.test.ts`
Section A, `dapStagePart19.test.ts` Section E) had assertions
like "reviewer imports the rubric from `@/lib/cbcc/adapters/dap/
dapStageRubrics`" — those were updated to "reviewer reaches into
the adapter zone via a path-aliased import" so both
pre-Part-20 (direct rubric import) and post-Part-20 (prompt
builder import → rubric transitively) satisfy the architectural
spirit. The directive permits "import-path updates" to existing
tests; these are exactly that.

`dapStageReviewer.test.ts` had its prompt-content assertions
(truth rules, advisory text, owner-approval-is-separate, rubric
threading, advisoryNotice / rubric payload fields) moved next to
the prompt module they describe. Runtime concerns (model name,
function export, types, no-mutation, anthropicClient lazy
singleton) stay in the reviewer test.

### Validation results

- Page-policy guard: pass (`pnpm check:page-policy`, 17 files
  scanned under 3 rule prefixes).
- Typecheck: clean (`pnpm typecheck`).
- Vitest: **6260 tests pass**, 1 skipped, 105 files
  (`pnpm test`).
- Lint: 0 errors, 50 warnings — all pre-existing
  (`pnpm lint`).
- Production build: succeeds (`pnpm build`).

### Recommendation for Part 21

Per the directive's framing: do a scheduled / periodic
"adapter-zone accumulation audit" now that Parts 13–20 have
landed. Concretely:

1. Walk `lib/cb-control-center/` for any file that, like the
   pre-Part-20 truth rules + prompt assembly, mixes pure DAP
   data/logic with runtime concerns. The new path-based
   boundary rules now make these moves mechanical.
2. Verify the engine root has no leakage from any of the new
   adapter modules (the engine barrel still does not export
   `./adapters/dap`; the adapter's local `index.ts` still does
   not re-export the rubric or the prompt — Part 20 Section F
   asserts this).
3. Confirm the route + `StageAiReviewPanel` legacy shape is
   still the only UI-facing review contract; if a Part 21
   discovers a second consumer of `StageAiReview`, that becomes
   a candidate for engine-port migration.

The shape sketched at the end of Part 19 is now reached:

- `lib/cbcc/` — generic engine, pure
- `lib/cbcc/adapters/dap/` — DAP project + stages + rubric +
  truth rules + prompt builder
- `lib/cb-control-center/` — Next/UI/app-adjacent legacy +
  Anthropic transport boundary + legacy review compatibility +
  legacy ↔ engine raw mapper

## Part 21 Addendum — Stability Audit (2026-05-02)

### 1. Executive summary

Parts 13–20 established the target three-zone architecture
(generic engine · DAP adapter · legacy app-adjacent). Part 21 is
an audit, not a refactor: walk every zone, confirm the boundary
rules executable in test code still hold, identify any
mixed-responsibility files that remain, and explicitly mark which
of those should NOT be moved (over-extraction is now the higher
risk).

**Result: zero source moves justified.** The architecture is
stable. Every remaining `lib/cb-control-center/` file is either
runtime-bound (Anthropic transport, server actions, Supabase
repository), UI-bound (data shapes consumed directly by React
components), translator-bound (bridges between legacy and engine
worlds), or out-of-scope DAP application logic that the AI-review
reorganization (Parts 13–20) never claimed to touch.

All five validation gates pass at baseline:
**6260 tests** / 1 skipped / 105 files · typecheck clean ·
page-policy clean · 0 lint errors · build succeeds.

### 2. Current architecture map

```
lib/cbcc/                                  generic engine (14 files)
  aiReview.ts                              engine contract (Part 4A)
  aiReviewProvider.ts                      engine port (Part 4B)
  stagePageModel.ts                        page model
  stageLocking.ts / stageApproval.ts       deterministic engine logic
  evidenceLedger.ts                        ledger primitives
  projectRegistry.ts / adapters.ts         registry + adapter contract
  agentRegistry.ts / agentRuntime.ts       agent runtime (Part 5)
  nextAllowedAction.ts                     Part 12
  pageCreationPolicy.ts                    Part 14 engine
  types.ts / index.ts                      types + barrel

lib/cbcc/adapters/dap/                     DAP adapter (8 files)
  dapProject.ts                            project metadata
  dapStages.ts                             7-stage definitions
  dapArtifacts.ts                          per-stage artifact accessor
  dapEvidence.ts                           evidence ledger seeding
  dapPageCreationPolicy.ts                 policy data (Part 14)
  dapStageRubrics.ts                       per-stage rubric (Part 19)
  dapStageReviewPrompt.ts                  prompt builder (Part 20)
  index.ts                                 adapter glue + barrel
                                           (rubric + prompt + policy
                                            deliberately NOT re-exported)

lib/cb-control-center/                     legacy zone (~90 files)
  Review-flow chain (Parts 13–20):
    anthropicClient.ts                     SDK lazy singleton
    dapStageReviewer.ts                    Anthropic transport (Part 20)
    cbccAnthropicAiReviewProvider.ts       engine-port impl (Part 17)
    dapStageAiReviewLegacy.ts              legacy↔engine mapper (Part 18)
    dapStageGates.ts                       UI-facing gate registry
    dapStageActions.ts                     server action (approval)
    dapStageApprovalStore.ts               in-memory store (Part 7)
    dapStageStateResolver.ts               overlay resolver (Part 7)
    cbccProjectPipelineTranslator.ts       engine→v2 translator
    cbccStagePageModelTranslator.ts        engine→gate translator
    cbccProjectStageAdapter.ts             legacy adapter helper
    cbccStageDefinitions.ts                pre-engine stage defs
    cbccProjectActions.ts                  server actions
    cbccProjectRepository.ts               Supabase reads/writes
    cbccCharterGenerator.ts                Anthropic charter gen
    cbccEngineRegistry.ts                  runtime registry
  Stage artifact data (referenced by gates + UI):
    dapBusinessDefinition.ts               Stage 1 artifact
    dapTruthSchemaArtifact.ts              Stage 3 artifact
    dapDiscoveryAuditArtifact.ts           Stage 2 placeholder
  Other DAP application surfaces (out of scope for Parts 13–20):
    ~70 files covering communication, admin decisions, member
    status, public UX, page generation, request handling,
    practice onboarding, offer terms, CMS export, etc.
```

### 3. Boundary verification results

| Rule | Coverage | Result |
|------|----------|--------|
| Engine root has no `cb-control-center` / SDK / Next/React / Supabase / fetch | grep + Part 13 Group 3 + Part 17 E + Part 18 E + Part 20 E | ✅ 14 files clean |
| Engine root has no DAP review symbol leakage | Part 13 Group 3 + Part 18 E + Part 20 E | ✅ |
| Engine barrel does not re-export `./adapters/dap` or DAP review symbols | Part 13 Group 3 (line 174-179) + Part 19 D + Part 20 F | ✅ |
| Adapter zone has no `from '…cb-control-center…'` import (path-based) | Part 7 #12 + Part 13 Group 2 + Part 18 F + Part 19 C + Part 20 B | ✅ 8 files clean |
| Adapter zone has no `@anthropic-ai/sdk` / `getAnthropicClient` | dapAdapter.test.ts + Part 13 Group 2 + Part 20 E | ✅ |
| Adapter local barrel does not re-export rubric / prompt / page-policy | Part 19 D + Part 20 F | ✅ |
| Reviewer reaches into adapter via path-aliased import (legacy → adapter) | Part 13 Group 1 + Part 18 A + Part 19 E + Part 20 D | ✅ |
| Anthropic SDK is owned only by `anthropicClient.ts` consumers in legacy | Part 20 E + grep audit (this file) | ✅ 3 consumers: reviewer, charter generator, project actions |
| `StageAiReview` is the only UI-facing review contract | grep audit (this file) | ✅ 4 consumers: mapper, provider, route (type only), panel |
| Route flows through `runCbccAiReview` + `consumeLastLegacy()` | Part 17 D + Part 18 D + Part 20 F | ✅ |
| Advisory-only invariant (AI cannot approve / unlock / persist) | Part 7 #6-#8 + Part 17 F + Part 18 G + Part 19 B + Part 20 D | ✅ |
| Page-creation policy guard runs at every commit | Part 14 D + script | ✅ |

### 4. Remaining mixed-responsibility candidates

Each row classifies a file by audit verdict.

| File | Mixed-responsibility? | Verdict |
|------|-----------------------|---------|
| `dapStageGates.ts` (25 KB) | UI data + DAP-specific stage definitions + operator-edit registry. Imported by 6 React components, 4 legacy translators, the route, and the reviewer/provider. | **Keep.** Moving requires updating 6 UI components plus refactoring the operator-edit workflow. Not obvious. Not small. The directive forbids extraction that isn't both. |
| `dapBusinessDefinition.ts` / `dapTruthSchemaArtifact.ts` / `dapDiscoveryAuditArtifact.ts` | DAP-specific artifact data referenced by `dapStageGates.ts` AND by the `StageArtifactPanel.tsx` UI component. | **Keep.** Each is referenced directly by UI; moving them requires a coordinated UI relocation. Future candidate, not Part 21. |
| `dapStageAiReviewLegacy.ts` (Part 18) | Pure shape conversion, BUT operates on the legacy `StageAiReview` shape that lives in the reviewer module (legacy zone). | **Keep.** Moving it would either duplicate the type or pull the type into the adapter, which would then ripple into UI. The current placement keeps the legacy ↔ engine adapter pair co-located. |
| `cbccAnthropicAiReviewProvider.ts` (Part 17) | Engine-port impl + legacy harvest. | **Keep.** This is the architectural boundary: it implements `CbccAiReviewProvider` (engine port) on top of the legacy `reviewStage` (transport). Cannot be moved to either side without breaking the boundary it represents. |
| `cbccProjectPipelineTranslator.ts` / `cbccStagePageModelTranslator.ts` / `cbccProjectStageAdapter.ts` | Translators between engine state and legacy `DapStageGate` data. | **Keep.** They bridge two worlds by definition. |
| `cbccProjectActions.ts` / `dapStageActions.ts` / `dapStageApprovalStore.ts` | Server actions / persistence. | **Keep.** `'use server'` and Supabase usage cannot enter the adapter zone. |
| `cbccProjectRepository.ts` | Supabase reads/writes. | **Keep.** |
| `cbccCharterGenerator.ts` | Anthropic SDK consumer (charter generation, separate from review). | **Keep.** Same boundary as `dapStageReviewer.ts` — SDK lives outside the adapter. |
| `anthropicClient.ts` | The lazy singleton SDK boundary. | **Keep forever.** Definitional. |
| `dapStageReviewer.ts` (Part 20 slimmed) | Anthropic transport + legacy `StageAiReview` types. | **Keep.** The transport must live outside the adapter; the legacy types are the UI compatibility contract. |
| `cbSeoAeoLlmFormatting.ts` / `cbSeoAeoPageGeneration.ts` | DAP truth-rule data + SEO/AEO content generation. Has its own `DAP_TRUTH_RULES` (different shape — `is`/`isNot`/`forbiddenImplications`) used by 313+ tests. | **Keep.** Different concern from the review-flow truth rules; tightly coupled to its existing test surface. Out of scope for Parts 13–20. |
| The other ~70 files (`dapRequest*`, `dapMember*`, `dapAdmin*`, `dapCommunication*`, `dapPractice*`, `dapOffer*`, `dapClaim*`, `dapPublic*`, `dapDisplay*`, `dapProvider*`, `dapAction*`, `dapBuildLedger`, `dapPageBriefBuilder`, `dapPublishingPipeline`, `dapCmsExport`, `mockData`, etc.) | DAP application logic across communication, admin decisions, public UX, member status, request handling, page generation, etc. | **Out of scope.** These are the next stages of work that the stage gate system itself is gating; they were never claimed by Parts 13–20. A future architectural reorganization may apply the same three-zone separation to them, but that is a separate project. |

### 5. Files intentionally left alone (and why)

- **`lib/cbcc/adapters/dap/dapStageReviewPrompt.ts` lines 24-25** — the architectural-rule documentation comment that lists what the file does NOT contain (`@anthropic-ai/sdk`, `getAnthropicClient`, etc.). Existing strip-comments + path-based regex test conventions (Part 13 Group 2, Part 18 F, Part 7 #12, Part 19 C, Part 20 B) already handle this correctly. Removing the comment would lose useful documentation; tightening the regex further would not protect anything new.
- **The DAP adapter local barrel (`index.ts`)** — deliberately does not re-export `dapStageRubrics`, `dapStageReviewPrompt`, or `dapPageCreationPolicy`. This is the design from Parts 14/19/20: review-time and page-policy data is reached by explicit file path, never via the public adapter surface. Adding them would risk leakage through `lib/cbcc/index.ts → ./adapters` chains in future engine refactors.
- **The Part 13 narrative comment block** — describes the original (failed) Part 13 plan and its rephrase. Kept as historical context for future reorganization work.
- **The 70+ out-of-scope DAP files** — these are application logic, not architectural concerns. Moving them would expand Parts 13–20's scope retroactively without owner direction.

### 6. Test/boundary coverage map

Every architectural rule has at least one executable enforcement.
The most-tested rules:

| Rule | Suites enforcing it |
|------|---------------------|
| Adapter zone is dependency-clean | `dapAdapter.test.ts` · Part 7 #12 · Part 13 G2 · Part 18 F · Part 19 C · Part 20 B+E |
| Engine root is DAP-free | Part 13 G3 · Part 17 E · Part 18 E · Part 20 E |
| Engine barrel exports nothing DAP | Part 13 G3 · Part 19 D · Part 20 F |
| Anthropic transport stays in legacy | Part 13 G1 · Part 18 A · Part 20 E (incl. adapter cross-check) |
| Legacy → adapter import direction | Part 13 G1 · Part 18 A · Part 19 E · Part 20 D |
| Route preserves legacy UI shape | Part 17 D · Part 18 F · Part 19 F · Part 20 G |
| Advisory-only invariant | Part 7 #6–#8 · Part 17 F · Part 18 G · Part 19 B · Part 20 D |
| Page-creation policy guard | Part 14 (suite + CLI script) |
| Engine port contract (normalize) | `aiReviewProvider.test.ts` · `aiReview.test.ts` |
| Engine adapter purity scan (forbidden deps) | `dapAdapter.test.ts` (canonical) |

No new tests added in Part 21. Adding more would risk over-locking
patterns that the existing suite already covers — exactly the
brittle-test failure mode the directive warns against.

### 7. Recommendation for Part 22

Two reasonable directions, in priority order:

1. **No further Part for the AI review architecture.** Parts 13–20
   reached the target shape; Part 21 confirms it is stable and
   protected by 30+ executable boundary assertions across the
   six dedicated suites (Parts 7, 13, 14, 17, 18, 19, 20) plus the
   per-zone purity scans (`dapAdapter.test.ts`,
   `aiReview.test.ts`, `aiReviewProvider.test.ts`). Future work
   should be driven by an actual product need rather than
   continued architectural refactoring of an already-clean area.

2. **If a Part 22 is desired, scope it to a different concern**
   — the natural candidates are:
   - **The 6-component UI surface around `dapStageGates.ts`.** If
     a future redesign coalesces those components against the
     engine page model (`CbccStagePageModel`) instead of
     `DapStageGate`, the gate file itself becomes movable. Today
     it can't move because the UI couples to its types.
   - **The stage artifact data trio** (`dapBusinessDefinition.ts`,
     `dapTruthSchemaArtifact.ts`, `dapDiscoveryAuditArtifact.ts`).
     Move requires updating `StageArtifactPanel.tsx`. Small, but
     not as small as Parts 14/19's pure-data moves.
   - **The other DAP application zones** (communication, admin
     decisions, member status, etc.). Each could in principle
     get the same three-zone treatment, but these are
     independent product concerns and should be scoped as
     separate projects, not as a Part 22 of this thread.

The strongest recommendation is direction 1: **stop refactoring
this area.** The risk now is regression-by-cleanup, not
under-cleanup.

## Part 22 — Architecture Freeze (2026-05-02)

The CBCC reorganization thread (Parts 13–21) has reached the
target architecture. Part 22 closes that thread. No further
casual refactoring of the areas below.

### Frozen architecture summary

```
lib/cbcc/                    generic pure engine
lib/cbcc/adapters/dap/       pure DAP adapter zone
lib/cb-control-center/       app-adjacent legacy + runtime + UI
                             contract zone
```

Boundary properties — protected by 30+ executable assertions
across Parts 7, 13, 14, 17, 18, 19, 20 plus the per-zone
purity scans (`dapAdapter.test.ts`, `aiReview.test.ts`,
`aiReviewProvider.test.ts`):

- Engine root has no DAP / Anthropic / Next / React / Supabase
  / fetch leakage.
- Adapter zone has no `lib/cb-control-center/` imports, no SDK,
  no runtime markers.
- Anthropic transport is isolated to `anthropicClient.ts` + 3
  consumers (reviewer, charter generator, project actions),
  all in legacy zone.
- `StageAiReview` is the only UI-facing review contract.
- DAP rubric, prompt builder, and page-creation policy live in
  the adapter; barrel deliberately keeps them off the public
  surface.
- Stage locking, approval gates, advisory-only AI review, and
  page-creation policy boundaries are enforced by tests.

### What no longer gets refactored casually

- `lib/cbcc/`
- `lib/cbcc/adapters/dap/`
- The CBCC AI review flow (route → engine port → provider →
  legacy harvest → UI panel)
- Anthropic review transport
- `StageAiReview` compatibility contract
- DAP stage rubric / prompt ownership
- Page-creation policy boundaries
- Stage locking boundaries

A change to any of these requires a new explicit directive that
names the boundary it affects and the product reason. Aesthetics,
"cleanup," or speculative future-proofing do not qualify.

### Allowed future product-work categories

Subsequent work should shift to product-facing DAP features. The
ten categories named in the Part 22 directive:

1. Member status page
2. Rejection emails
3. Admin UX polish
4. MKCRM webhook shadow mode
5. CRM sync
6. Practice SaaS billing through Client Builder Pro
7. Patient-facing ZIP / calculator / practice discovery UX
8. Provider onboarding improvements
9. Public DAP marketing pages
10. Internal dashboard improvements

These should be scoped under their own numbered tracks (e.g.
"DAP Product Phase 2 — Member Status Page + Admin Rejection
UX"), not as additional CBCC parts.

### Rule for future CBCC changes

If a CBCC source change becomes necessary anyway, the touching
work must:

1. State why the change is necessary (product reason or
   correctness fix — never aesthetics).
2. Identify which boundary it affects: generic engine · DAP
   adapter · legacy app zone · UI contract · AI transport.
3. Add or preserve executable boundary coverage for the rule
   it interacts with.
4. Run all gates: `pnpm typecheck`, `pnpm test`, `pnpm lint`,
   `pnpm build`, `pnpm check:page-policy`.
5. Append a brief addendum to this document recording the
   change, the reason, and the gates that ran.

Files do not move, folders do not rename, routes do not change,
the AI review contract does not change, provider behavior does
not change, and tests do not weaken. Cleanup-for-aesthetics is
out of scope.

### Validation results (Part 22 baseline, no code changes)

- `pnpm typecheck` — clean
- `pnpm test` — **6260 tests pass**, 1 skipped, 105 files
- `pnpm lint` — 0 errors, 50 pre-existing warnings
- `pnpm build` — succeeds
- `pnpm check:page-policy` — pass (17 files / 3 prefixes)

This thread ends here.

---

## DAP Registry Migration — Final Freeze (Wave 5C)

**Status: FROZEN. Last migration commit: `c49d7a5`.**

The future architectural reorganization anticipated in Part 22 (§4, "the other ~70 files") is now complete and closed. The full migration record is in `docs/dap-domain-extraction.md`.

### What moved

| Zone | Files |
|---|---|
| `lib/dap/registry/` | 14 files — provider status types, display rules, public UX rules, participation/onboarding/offer terms/request types + rules, member status rules |
| `lib/dap/membership/` | 4 files — member status types, public types, read model, preview |
| `lib/dap/site/` | 3 files — CMS types, public UX types, public section models |

### Wave summaries

**Wave 5A** — Inspected `dapActionCatalogTypes`, `dapActionCatalog`, `dapActionAvailabilityRules`. Moved none. All three are CBCC operator affordance layer: they answer "what can the CBCC operator click?" not "what does the DAP product define?" The `DapActionAvailabilityContext` composite type aggregates CBCC admin pipeline state alongside DAP domain values — moving it would inject CBCC concepts into `lib/dap/`.

**Wave 5B** — Inspected `dapPublicSectionModels`, `dapPageBriefBuilder`. Moved `dapPublicSectionModels` → `lib/dap/site/`: single import from `lib/dap/site/dapPublicUxTypes`, purely public page content (FAQ, comparison, how-it-works, savings), no CBCC concepts. Retained `dapPageBriefBuilder`: imports `cbSeoAeoPageGeneration` and `cbSeoAeoLlmFormatting` (both CBCC); builds BrandScript/SEO/AEO/wireframe briefs for content operators.

### What stays in lib/cb-control-center/ and why

| Category | Files | Reason |
|---|---|---|
| Action catalog / operator affordances | `dapActionCatalogTypes`, `dapActionCatalog`, `dapActionAvailabilityRules` | Define and compute what the CBCC operator can do — not DAP domain rules |
| Stage gates / stage review | `dapStageGates`, `dapStageActions`, `dapStageApprovalStore`, `dapStageStateResolver`, `dapStageAiReviewLegacy`, `dapStageReviewer` | Supabase + AI review transport; CBCC stage machinery |
| Admin decisioning | `dapAdminDecision*`, `dapAdminRejection*`, `dapAdminEventTimeline` | Admin workflow orchestration |
| Communication pipeline | `dapCommunication*`, `dapMemberStatusEmail*`, `dapPracticeDecisionEmail*`, `dapRejectionEmailQueue`, `dapMemberAdminSummary` | Notification copy, dispatch readiness, approval pipeline |
| Page brief / editorial generation | `dapPageBriefBuilder` | BrandScript/SEO/AEO briefing for content operators |
| Supabase-touching runtime | `dapRequestActions`, `dapRequestPersistence`, `dapRequestAdmin`, `dapPracticeOnboarding`, `dapPracticeOnboardingActions`, `dapProviderParticipation`, `dapOfferTerms`, `dapOfferTermsReview`, `dapPublishingPipeline`, `dapCmsExport` | Network/DB calls; cannot move without splitting data access layer |
| Dashboard / view-model composition | `dapBuildLedger`, `dapClaimQA`, `dapCityData`, `dapAdminWorkflowFixtures`, `source/` | CBCC admin view composition |
| Mock / simulation | `mockData`, `simulationStates`, `dapAdminWorkflowFixtures` | CBCC test infrastructure |

### Boundary invariant

`lib/dap/**` must never import from `lib/cb-control-center/**`.
`lib/cb-control-center/**` may import from `lib/dap/**`.
Direction is one-way.

### Freeze rule

**No future DAP-named file moves are allowed unless a new product requirement proves the file is DAP-owned and independent of CBCC workflows.**

A DAP-named file stays in `lib/cb-control-center/` when it answers any of:
- What can the CBCC operator click, approve, reject, review, simulate, or dispatch?
- What stage gate is active or what brief should be generated?
- What Supabase/runtime orchestration is needed for CBCC workflows?
- What communication pipeline or dispatch readiness should be evaluated?

Moving a file "because it starts with `dap`" is not a valid reason.

### Validation (Wave 5C baseline)

- `pnpm typecheck` — clean
- `pnpm test` — 6260 pass, 1 skipped, 105 files
- `pnpm lint` — 0 errors, 50 warnings (baseline)

DAP/CBCC migration is frozen. Next work shifts to product: member status page, rejection emails, admin UX polish, MKCRM shadow-mode webhooks, or DAP public-site rebuild.



