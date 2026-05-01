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

## Phases completed

| Phase | Description | Commit |
|---|---|---|
| 8A — Tooling | pnpm pin, typecheck/check scripts, kill stale `package-lock.json` | `7e821ed` |
| 8B — TS gate | Fix 16 pre-existing TS errors in test files | `71a89e0` |
| 8B.5 — Lint gate | Fix 75 pre-existing lint errors (require imports, unescaped JSX entities, html-link-for-pages, setState-in-effect) | `3be40d1` |
| 8C — Phase tests folder | Move 51 historical `dapPhase*.test.{ts,tsx}` into `dap-phase-tests/` | `c20fc76` |

---

## Next proposed phase (NOT YET STARTED)

**Phase 3 — Low-risk / zero-import source clusters.**

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

**Do not start Phase 3 until explicitly approved.**

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
