/**
 * DAP Build Ledger
 *
 * Operator-updated completion record for the DAP site rebuild.
 * Not live synced — intentionally updated at the end of each completed phase.
 *
 * Each entry captures what was done, what verifies it, and what comes next.
 * No entry may claim a stronger verification level than it actually has.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DapBuildStatus =
  | 'complete'
  | 'in_progress'
  | 'blocked'
  | 'pending'

export type DapBuildVerification =
  | 'verified_in_repo'      // file or artifact confirmed to exist in the CBCC repo
  | 'verified_by_test'      // passing test suite in CBCC confirms the contract
  | 'verified_by_deployment' // live Vercel deployment confirmed
  | 'recorded_from_operator_report' // work done in another repo or session; CBCC cannot self-verify

export type DapBuildEvidence =
  | { readonly type: 'git_tag'; readonly ref: string }
  | { readonly type: 'git_branch'; readonly name: string }
  | { readonly type: 'git_commit'; readonly hash: string; readonly message: string }
  | { readonly type: 'vercel_url'; readonly url: string }
  | { readonly type: 'file'; readonly path: string }
  | { readonly type: 'test_suite'; readonly name: string; readonly passing: number }

export interface DapBuildLedgerEntry {
  readonly id: string
  readonly title: string
  readonly status: DapBuildStatus
  readonly summary: string
  readonly completedAt: string | null    // ISO date string, null if not yet complete
  readonly recordedAt: string            // ISO date string — when this entry was written
  readonly verification: DapBuildVerification
  readonly evidence: readonly DapBuildEvidence[]
  readonly nextAction?: string
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export const DAP_BUILD_LEDGER: readonly DapBuildLedgerEntry[] = [

  {
    id: 'phase-18b-neil-llm-formatting',
    title: 'Phase 18B — Neil LLM Formatting Standard',
    status: 'complete',
    summary:
      'Typed contract layer for Neil-style LLM-friendly page formatting. Rank 5 in the CB Framework Hierarchy — cannot override BrandScript, DecisionLock, CBDesignEngine, or CBSeoAeoCoreNate. Defines 6 usage levels, 12 section types, and homepage guardrails.',
    completedAt: '2026-04-29',
    recordedAt: '2026-04-30',
    verification: 'verified_by_test',
    evidence: [
      { type: 'file', path: 'lib/cb-control-center/cbSeoAeoLlmFormatting.ts' },
      { type: 'test_suite', name: 'cbSeoAeoLlmFormatting', passing: 74 },
      { type: 'file', path: 'app/preview/cbseoaeo/llm-page-format/page.tsx' },
    ],
  },

  {
    id: 'phase-18c-page-generation-contract',
    title: 'Phase 18C — CBSeoAeo Page Generation Contract',
    status: 'complete',
    summary:
      'Typed generation contracts for 8 DAP page types (homepage, guide, comparison, faq, city_page, practice_page, blog_article, decision_education). Locked safety flags, forbidden claims, required sections, and 7 DAP truth rules. No flag may be relaxed.',
    completedAt: '2026-04-29',
    recordedAt: '2026-04-30',
    verification: 'verified_by_test',
    evidence: [
      { type: 'file', path: 'lib/cb-control-center/cbSeoAeoPageGeneration.ts' },
      { type: 'test_suite', name: 'cbSeoAeoPageGeneration', passing: 243 },
      { type: 'file', path: 'app/preview/cbseoaeo/page-generation-contract/page.tsx' },
    ],
  },

  {
    id: 'phase-18d-dap-page-brief-builder',
    title: 'Phase 18D — DAP Page Brief Builder',
    status: 'complete',
    summary:
      'Converts Phase 18C contracts into structured read-only briefs — visitor intent, BrandScript role, SEO/AEO role, recommended wireframe order, CTA rules, and generation prompt seeds — for all 8 page types. Bridge layer only: no generation, no AI calls, no DB writes.',
    completedAt: '2026-04-29',
    recordedAt: '2026-04-30',
    verification: 'verified_by_test',
    evidence: [
      { type: 'file', path: 'lib/cb-control-center/dapPageBriefBuilder.ts' },
      { type: 'test_suite', name: 'dapPageBriefBuilder', passing: 277 },
      { type: 'file', path: 'app/preview/dap/page-briefs/page.tsx' },
    ],
  },

  {
    id: 'phase-18e-cbcc-workspace-shell',
    title: 'Phase 18E — CB Control Center Workspace Shell',
    status: 'complete',
    summary:
      'Converted CBCC from static mock preview to operator workspace: business registry with System Contracts reference section, 7-field disabled new-business form, MockModeBanner on all business-facing pages, and consistent mode labels (Workspace Mock Mode / Simulation Preview). Page count held at 52.',
    completedAt: '2026-04-30',
    recordedAt: '2026-04-30',
    verification: 'verified_by_deployment',
    evidence: [
      { type: 'git_commit', hash: '403bcd6', message: 'Phase 18E: CB Control Center workspace shell' },
      { type: 'test_suite', name: 'cbControlCenterWorkspace', passing: 26 },
      { type: 'vercel_url', url: 'https://cb-control-center.vercel.app' },
    ],
  },

  {
    id: 'dap-archive-production-snapshot',
    title: 'DAP Archive — Production Snapshot',
    status: 'complete',
    summary:
      'Archived current DAP production state before rebuild. Production branch main at commit 6fc555f (last deployed 2026-04-21). Annotated tag and archive branch created from main. Snapshot doc committed to archive branch via git worktree. Dirty working tree on dap-storybrand-homepage protected by patch file. rebuild/dap-site-v2 not yet created.',
    completedAt: '2026-04-30',
    recordedAt: '2026-04-30',
    verification: 'recorded_from_operator_report',
    evidence: [
      { type: 'git_tag', ref: 'pre-dap-rebuild-production-snapshot' },
      { type: 'git_branch', name: 'archive/pre-dap-rebuild-live-site' },
      {
        type: 'git_commit',
        hash: '6fc555fa',
        message: 'fix(build): unblock Vercel deploy — Suspense, void server actions, query cast',
      },
      { type: 'file', path: 'docs/archive/pre-dap-rebuild-snapshot.md' },
    ],
    nextAction:
      'Resolve dirty working tree on dap-storybrand-homepage. Review 4 modified source files and 30+ untracked files — commit checkpoint or explicitly discard stale experiments. Then create rebuild/dap-site-v2 from dap-storybrand-homepage.',
  },

  {
    id: 'dap-rebuild-branch-preparation',
    title: 'DAP Site Rebuild — Branch Preparation',
    status: 'in_progress',
    summary:
      'Dirty working tree on dap-storybrand-homepage requires a commit checkpoint before rebuild/dap-site-v2 can be branched. Modified: DentistCard.tsx, DentistFinder.tsx, dentist-match.ts, docs/competitive.md. Untracked: v6 routes, zocdoc-blank, v5 design prototypes, preview routes, 6 hero iteration directives, Stitch designs.',
    completedAt: null,
    recordedAt: '2026-04-30',
    verification: 'recorded_from_operator_report',
    evidence: [
      { type: 'git_branch', name: 'dap-storybrand-homepage' },
      {
        type: 'git_commit',
        hash: 'd5dc443',
        message: 'Revert "feat(dashboard): CB Control Center v0.1 — mock-data pipeline control layer"',
      },
    ],
    nextAction:
      'Review dap-storybrand-homepage dirty working tree. Commit real work (truth-rule fixes, hero directives). Discard or archive stale prototypes. Then branch rebuild/dap-site-v2.',
  },

] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLedgerByStatus(status: DapBuildStatus): DapBuildLedgerEntry[] {
  return DAP_BUILD_LEDGER.filter(e => e.status === status) as DapBuildLedgerEntry[]
}

export function getLatestLedgerEntry(): DapBuildLedgerEntry {
  return DAP_BUILD_LEDGER[DAP_BUILD_LEDGER.length - 1] as DapBuildLedgerEntry
}

export function getCompletedCount(): number {
  return DAP_BUILD_LEDGER.filter(e => e.status === 'complete').length
}
