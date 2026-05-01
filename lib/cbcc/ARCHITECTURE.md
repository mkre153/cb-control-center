# CBCC Generic Engine — Architecture

## Core rule

```
AI recommends.
CBCC enforces deterministic rules.
Owner approves.

Agents may produce artifacts, recommendations, or evidence candidates.
Agents may not approve stages or unlock stages.
```

The engine is the source of truth for **identity** (project + stage), **lock
state**, **evidence requirements**, and **approval gates**. AI output is
advisory data the page model surfaces; it never alters the deterministic
state machine.

## Module responsibilities

| Module | Responsibility |
|---|---|
| `types.ts` | Shared generic types (project, stage, evidence, approval, AI review, page model). |
| `projectRegistry.ts` | Pure in-memory project registration + validation. No DB. |
| `stageLocking.ts` | Deterministic lock checks. Predecessor-approval rule, project-status gates, terminal-state cascading. |
| `stageApproval.ts` | Pure approval primitives: `applyStageApproval`, `applyStageRejection`, `getApprovalState`. Returns updated objects, never persists. |
| `evidenceLedger.ts` | Append-only ledger. Evidence requirements, validation, summaries, requirement-coverage helpers. |
| `stagePageModel.ts` | Read model for a full stage detail page. Composes locking + evidence + (optional) AI review into one model. |
| `aiReview.ts` | AI review **contract**: types, prompt-packet builder, raw-output normalizer (safety boundary). |
| `aiReviewProvider.ts` | Injectable AI **runtime**: `CbccAiReviewProvider` interface + `runCbccAiReview()` runner with typed errors. No SDK is imported here. |
| `adapters.ts` | Adapter interface for project-specific systems + an in-memory adapter registry. |
| `index.ts` | Public barrel. Importers should pull from here, not from individual modules. |

## What the engine does NOT do

The engine ships zero of:

- React components / UI
- Next.js routes or server actions
- Supabase / persistence
- Real AI SDKs (Anthropic, OpenAI, etc.) — `aiReviewProvider.ts` defines an
  interface; concrete adapters live elsewhere
- Vertical-specific code (healthcare, finance, etc.)
- Mutation-authority exports (`approveStage`, `unlockStage`, `persist`, …)

These constraints are enforced by `coreBoundary.test.ts`.

## AI review surfacing on the page model

Part 4C makes `buildStagePageModel` accept an optional `aiReviewResult`.
The result is surfaced to `model.aiReview` as **display-only data**:

- `decision`, `summary`, `recommendation`, `risks`, `reviewedAt`,
  `model`, `promptVersion`

It does **not**:

- Make missing required evidence approvable
- Unlock a locked stage
- Re-open an already-approved stage
- Add to the deterministic `model.blockers` list

Identity safety: if a result is supplied with mismatched `projectId` or
`stageId`, the builder throws `CbccStagePageModelMismatchError`. We prefer
deterministic safety over silent drift.

## Versioning rule

When an existing exported name's behavior changes, prefer adding a new
function over mutating the old one. The engine's surface should be
expandable without breaking importers.
