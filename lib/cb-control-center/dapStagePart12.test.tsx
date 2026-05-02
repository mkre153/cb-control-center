/**
 * Part 12 — UI wiring acceptance suite.
 *
 * Surfaces the existing next-allowed-action and missing-evidence engine
 * decisions in the operator UI. This file is a UI-rendering acceptance
 * suite: it asserts that derived state shows up in the right components
 * and that the regression boundaries from Parts 8X / 10 / 11 still hold.
 *
 * Sections:
 *   A. Project page renders <NextAllowedActionCard> with the correct kind,
 *      stage anchor, and missing-evidence text for the DAP baseline.
 *   B. NextAllowedActionCard handles each engine action kind:
 *      generate_required_artifact / submit_for_owner_approval /
 *      approve_stage / work_blocked / project_complete.
 *   C. StageDetailPage renders <StageMissingEvidencePanel> only when items
 *      are passed AND keeps the locked-stage directive UX unchanged.
 *   D. DapStageOwnerApprovalForm result rendering distinguishes the four
 *      result codes (missing_required_evidence / stage_locked /
 *      already_approved / generic) and surfaces every missing id.
 *   E. Regression boundaries — no AI module is reachable from the approval
 *      action source, no approval mutation is reachable from the AI review
 *      source, v1 and v2 routes still mount the same StageDetailPage, and
 *      no new route was added.
 *
 * No DOM, no JSdom — uses renderToString. No network, no DB.
 */

import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, basename } from 'path'
import React from 'react'

import { NextAllowedActionCard } from '@/components/cb-control-center/NextAllowedActionCard'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'
import { ApprovalErrorView } from '@/components/cb-control-center/DapStageOwnerApprovalForm'
import { StageMissingEvidencePanel } from '@/components/cb-control-center/StageMissingEvidencePanel'
import {
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_PROJECT_SLUG,
  DAP_STAGE_DEFINITIONS,
  buildDapApprovalEvidenceLedger,
  getDapStageEvidenceRequirements,
} from '@/lib/cbcc/adapters/dap'
import {
  canApproveStageWithEvidence,
  getNextAllowedAction,
  type CbccEvidenceRequirement,
  type CbccNextAllowedAction,
  type CbccProject,
  type CbccStageStatus,
} from '@/lib/cbcc/index'
import { buildDapStageGateFromEngine } from './cbccStagePageModelTranslator'
import { buildDapEffectiveProject } from './dapStageStateResolver'
import type { ApproveDapStageResult } from './dapStageActions'

// Strip React's HTML comment markers so substring assertions don't trip on
// `<!-- -->` injected between text and JSX expressions.
function clean(html: string): string {
  return html.replace(/<!--\s*-->/g, '')
}

function evidenceRequirementsByStage(): Record<string, ReadonlyArray<CbccEvidenceRequirement>> {
  const out: Record<string, ReadonlyArray<CbccEvidenceRequirement>> = {}
  for (const def of DAP_STAGE_DEFINITIONS) {
    out[def.id] = getDapStageEvidenceRequirements(def.order)
  }
  return out
}

function stageTitleByNumber(): Record<number, string> {
  const titles: Record<number, string> = {}
  for (const def of DAP_STAGE_DEFINITIONS) {
    titles[def.order] = def.title
  }
  return titles
}

function dapBaselineNextAction(): CbccNextAllowedAction {
  return getNextAllowedAction({
    project: buildDapEffectiveProject(DAP_PROJECT, []),
    stageDefinitions: DAP_STAGE_DEFINITIONS,
    evidenceRequirementsByStage: evidenceRequirementsByStage(),
    evidenceLedger: buildDapApprovalEvidenceLedger({ projectId: DAP_PROJECT_ID }),
  })
}

// Build a small synthetic project so we can drive the engine into kinds the
// DAP baseline doesn't naturally exercise (work_blocked, project_complete,
// approve_stage, submit_for_owner_approval). Keeps the engine pure.
function syntheticProject(stages: Array<{ id: string; status: CbccStageStatus }>): CbccProject {
  return {
    id: 'synthetic',
    slug: 'synthetic',
    name: 'Synthetic',
    adapterKey: 'generic',
    status: 'active',
    stages: stages.map((s, i) => ({ id: s.id, order: i + 1, status: s.status })),
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  }
}

const SYNTHETIC_DEFS = [
  { id: 's1', order: 1, title: 'Synthetic 1', description: '', requirements: [], requiredApprovals: [] },
  { id: 's2', order: 2, title: 'Synthetic 2', description: '', requirements: [], requiredApprovals: [] },
] as const

const NO_REQS: Record<string, ReadonlyArray<CbccEvidenceRequirement>> = { s1: [], s2: [] }

// ─── A. Project page surfaces the next-allowed-action card ─────────────────

describe('Part 12 — A. Project page next-allowed-action card', () => {
  it('DAP baseline action is generate_required_artifact for Stage 2', () => {
    const action = dapBaselineNextAction()
    expect(action.kind).toBe('generate_required_artifact')
    if (action.kind !== 'generate_required_artifact') return
    expect(action.stageNumber).toBe(2)
    expect(action.requiredEvidenceId).toBe('discovery_asset_audit')
  })

  it('NextAllowedActionCard renders with the data-next-allowed-action-card anchor', () => {
    const html = clean(
      renderToString(
        React.createElement(NextAllowedActionCard, {
          action: dapBaselineNextAction(),
          stageTitleByNumber: stageTitleByNumber(),
        }),
      ),
    )
    expect(html).toContain('data-next-allowed-action-card')
  })

  it('card identifies the next allowed stage in the DAP baseline (Stage 2)', () => {
    const html = clean(
      renderToString(
        React.createElement(NextAllowedActionCard, {
          action: dapBaselineNextAction(),
          stageTitleByNumber: stageTitleByNumber(),
        }),
      ),
    )
    expect(html).toMatch(/data-next-allowed-action="generate_required_artifact"/)
    expect(html).toMatch(/data-next-allowed-stage="2"/)
    expect(html).toMatch(/data-next-allowed-missing-evidence="discovery_asset_audit"/)
  })

  it('card project slug equals the engine slug', () => {
    const action = dapBaselineNextAction()
    expect(action.kind === 'project_complete' ? action.projectSlug : action.projectSlug).toBe(
      DAP_PROJECT_SLUG,
    )
  })
})

// ─── B. Card handles every engine action kind ──────────────────────────────

describe('Part 12 — B. NextAllowedActionCard renders each action kind', () => {
  it('work_blocked → renders reason and red accent anchors', () => {
    const project = syntheticProject([
      { id: 's1', status: 'rejected' },
      { id: 's2', status: 'not_started' },
    ])
    const action = getNextAllowedAction({
      project,
      stageDefinitions: SYNTHETIC_DEFS,
      evidenceRequirementsByStage: NO_REQS,
      evidenceLedger: [],
    })
    expect(action.kind).toBe('work_blocked')
    const html = clean(
      renderToString(React.createElement(NextAllowedActionCard, { action })),
    )
    expect(html).toContain('data-next-allowed-action="work_blocked"')
    expect(html).toContain('data-next-allowed-stage="2"')
    expect(html).toContain('data-next-allowed-reason')
    expect(html).toMatch(/blocked|locked/i)
  })

  it('approve_stage → reflects awaiting_owner_approval surface', () => {
    const project = syntheticProject([
      { id: 's1', status: 'awaiting_owner_approval' },
      { id: 's2', status: 'not_started' },
    ])
    const action = getNextAllowedAction({
      project,
      stageDefinitions: SYNTHETIC_DEFS,
      evidenceRequirementsByStage: NO_REQS,
      evidenceLedger: [],
    })
    expect(action.kind).toBe('approve_stage')
    const html = clean(
      renderToString(React.createElement(NextAllowedActionCard, { action })),
    )
    expect(html).toContain('data-next-allowed-action="approve_stage"')
    expect(html).toContain('data-next-allowed-stage="1"')
    expect(html).toMatch(/Review Stage 1/i)
  })

  it('submit_for_owner_approval → reflects in_progress + evidence-present surface', () => {
    const project = syntheticProject([
      { id: 's1', status: 'in_progress' },
      { id: 's2', status: 'not_started' },
    ])
    const action = getNextAllowedAction({
      project,
      stageDefinitions: SYNTHETIC_DEFS,
      evidenceRequirementsByStage: NO_REQS,
      evidenceLedger: [],
    })
    expect(action.kind).toBe('submit_for_owner_approval')
    const html = clean(
      renderToString(React.createElement(NextAllowedActionCard, { action })),
    )
    expect(html).toContain('data-next-allowed-action="submit_for_owner_approval"')
    expect(html).toMatch(/Submit Stage 1/i)
  })

  it('generate_required_artifact → renders missing evidence id anchor', () => {
    const action: CbccNextAllowedAction = {
      kind: 'generate_required_artifact',
      projectSlug: 'p1',
      stageNumber: 4,
      stageId: 's4',
      requiredEvidenceId: 'positioning_messaging',
      label: 'Positioning Messaging',
    }
    const html = clean(
      renderToString(React.createElement(NextAllowedActionCard, { action })),
    )
    expect(html).toContain('data-next-allowed-action="generate_required_artifact"')
    expect(html).toContain('data-next-allowed-stage="4"')
    expect(html).toContain('data-next-allowed-missing-evidence="positioning_messaging"')
    expect(html).toContain('Positioning Messaging')
  })

  it('project_complete → no stage anchor, friendly copy', () => {
    const project = syntheticProject([
      { id: 's1', status: 'approved' },
      { id: 's2', status: 'approved' },
    ])
    const action = getNextAllowedAction({
      project,
      stageDefinitions: SYNTHETIC_DEFS,
      evidenceRequirementsByStage: NO_REQS,
      evidenceLedger: [],
    })
    expect(action.kind).toBe('project_complete')
    const html = clean(
      renderToString(React.createElement(NextAllowedActionCard, { action })),
    )
    expect(html).toContain('data-next-allowed-action="project_complete"')
    expect(html).not.toContain('data-next-allowed-stage')
    expect(html).toMatch(/All stages approved/i)
  })
})

// ─── C. Stage detail missing-evidence panel ────────────────────────────────

describe('Part 12 — C. StageDetailPage missing-evidence panel', () => {
  const baselineProject = buildDapEffectiveProject(DAP_PROJECT, [])
  const ledger = buildDapApprovalEvidenceLedger({ projectId: DAP_PROJECT_ID })

  function missingEvidenceFor(stageNumber: number): ReadonlyArray<CbccEvidenceRequirement> {
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === stageNumber)!
    const gate = canApproveStageWithEvidence({
      project: baselineProject,
      projectId: DAP_PROJECT_ID,
      stageId: def.id,
      evidence: ledger,
      requirements: getDapStageEvidenceRequirements(stageNumber),
    })
    if (!gate.ok && gate.reason === 'missing_required_evidence') return gate.missingEvidence
    return []
  }

  it('Stage 2 (unlocked, no evidence in static ledger) renders the missing-evidence panel', () => {
    const stage = buildDapStageGateFromEngine(2)!
    const items = missingEvidenceFor(2)
    expect(items.length).toBeGreaterThan(0)
    const html = clean(
      renderToString(
        React.createElement(StageDetailPage, {
          stage,
          projectSlug: DAP_PROJECT_SLUG,
          missingEvidence: items,
        }),
      ),
    )
    expect(html).toContain('data-missing-evidence-panel')
    expect(html).toContain('data-missing-evidence-item')
    expect(html).toContain('data-missing-evidence-id="discovery_asset_audit"')
  })

  it('each missing evidence item carries a stable id anchor', () => {
    const items: ReadonlyArray<CbccEvidenceRequirement> = [
      { id: 'truth_schema', type: 'file', title: 'Truth Schema', required: true },
      { id: 'positioning_messaging', type: 'file', title: 'Positioning Messaging', required: true },
    ]
    const html = clean(
      renderToString(React.createElement(StageMissingEvidencePanel, { items })),
    )
    expect(html).toContain('data-missing-evidence-id="truth_schema"')
    expect(html).toContain('data-missing-evidence-id="positioning_messaging"')
  })

  it('locked Stage 5 still renders Directive Preview — Locked, with no missing-evidence panel', () => {
    const stage = buildDapStageGateFromEngine(5)!
    // Engine reports stage_locked (predecessor not approved) → caller passes
    // an empty missingEvidence array. The panel is suppressed; locked
    // directive UX (Part 11) is unchanged.
    const items = missingEvidenceFor(5)
    expect(items.length).toBe(0)
    const html = clean(
      renderToString(
        React.createElement(StageDetailPage, {
          stage,
          projectSlug: DAP_PROJECT_SLUG,
          missingEvidence: items,
        }),
      ),
    )
    expect(html).not.toContain('data-missing-evidence-panel')
    expect(html).toContain('Directive Preview')
    expect(html).toContain('Locked')
    expect(html).toContain('data-locked-directive-warning')
    // Prerequisite line: "Stage 4 must be owner-approved before this stage's
    // directive is issued."
    expect(html).toMatch(/Stage 4 must be owner-approved/)
  })

  it('Part 11 anchors remain present on engine-backed render', () => {
    const stage = buildDapStageGateFromEngine(2)!
    const html = clean(
      renderToString(
        React.createElement(StageDetailPage, {
          stage,
          projectSlug: DAP_PROJECT_SLUG,
          missingEvidence: missingEvidenceFor(2),
        }),
      ),
    )
    expect(html).toContain('data-stage-detail-page')
    expect(html).toContain('data-anti-bypass-rule')
    expect(html).toContain('data-ai-review-panel')
    expect(html).toContain('data-stage-evidence-panel')
  })

  it('omitting missingEvidence prop is equivalent to passing an empty array', () => {
    const stage = buildDapStageGateFromEngine(5)!
    const html = clean(
      renderToString(
        React.createElement(StageDetailPage, {
          stage,
          projectSlug: DAP_PROJECT_SLUG,
        }),
      ),
    )
    expect(html).not.toContain('data-missing-evidence-panel')
  })
})

// ─── D. Approval form result rendering ─────────────────────────────────────

describe('Part 12 — D. DapStageOwnerApprovalForm result rendering', () => {
  it('missing_required_evidence renders every id with stable item anchors', () => {
    const result: Extract<ApproveDapStageResult, { ok: false }> = {
      ok: false,
      code: 'missing_required_evidence',
      message: 'Stage 4 cannot be approved — missing required evidence: positioning_messaging',
      missingEvidence: ['positioning_messaging', 'something_else'],
    }
    const html = clean(
      renderToString(React.createElement(ApprovalErrorView, { result, stageNumber: 4 })),
    )
    expect(html).toContain('data-approval-error')
    expect(html).toContain('data-approval-error-code="missing_required_evidence"')
    expect(html).toContain('data-approval-missing-evidence')
    expect(html).toMatch(/data-approval-missing-evidence-item[^>]*data-approval-missing-evidence-id="positioning_messaging"/)
    expect(html).toMatch(/data-approval-missing-evidence-item[^>]*data-approval-missing-evidence-id="something_else"/)
  })

  it('stage_locked renders a useful operator-facing message', () => {
    const result: Extract<ApproveDapStageResult, { ok: false }> = {
      ok: false,
      code: 'stage_locked',
      message: 'Stage 5 is locked — predecessor not yet approved',
    }
    const html = clean(
      renderToString(React.createElement(ApprovalErrorView, { result, stageNumber: 5 })),
    )
    expect(html).toContain('data-approval-error')
    expect(html).toContain('data-approval-error-code="stage_locked"')
    expect(html).toMatch(/locked/i)
    expect(html).toMatch(/predecessor/i)
    // No missing-evidence list in the locked-state surface.
    expect(html).not.toContain('data-approval-missing-evidence')
  })

  it('already_approved renders a useful operator-facing message', () => {
    const result: Extract<ApproveDapStageResult, { ok: false }> = {
      ok: false,
      code: 'already_approved',
      message: 'Stage 2 is already approved (by Owner)',
    }
    const html = clean(
      renderToString(React.createElement(ApprovalErrorView, { result, stageNumber: 2 })),
    )
    expect(html).toContain('data-approval-error')
    expect(html).toContain('data-approval-error-code="already_approved"')
    expect(html).toMatch(/already approved/i)
  })

  it('generic failure falls back to the message field with the right code anchor', () => {
    const result: Extract<ApproveDapStageResult, { ok: false }> = {
      ok: false,
      code: 'invalid_stage',
      message: 'stageNumber must be 1–7, got 9',
    }
    const html = clean(
      renderToString(React.createElement(ApprovalErrorView, { result, stageNumber: 9 })),
    )
    expect(html).toContain('data-approval-error')
    expect(html).toContain('data-approval-error-code="invalid_stage"')
    expect(html).toContain('stageNumber must be')
  })

  it('preserves the original data-form-error anchor for backward-compat', () => {
    const result: Extract<ApproveDapStageResult, { ok: false }> = {
      ok: false,
      code: 'missing_required_evidence',
      message: 'missing',
      missingEvidence: ['x'],
    }
    const html = clean(
      renderToString(React.createElement(ApprovalErrorView, { result, stageNumber: 4 })),
    )
    expect(html).toContain('data-form-error')
  })
})

// ─── E. Regression boundaries ──────────────────────────────────────────────

describe('Part 12 — E. Regression boundaries', () => {
  it('approval action source imports no AI review module', () => {
    const src = readFileSync(resolve(__dirname, 'dapStageActions.ts'), 'utf-8')
    expect(src).not.toMatch(/dapStageReviewer|StageAiReview|aiReview|@anthropic-ai/)
  })

  it('AI review module source imports no approval mutation function', () => {
    const src = readFileSync(resolve(__dirname, 'dapStageReviewer.ts'), 'utf-8')
    expect(src).not.toMatch(/dapStageApprovalStore|approveDapStage|store\.approve/)
  })

  it('NextAllowedActionCard imports no AI / persistence / mutation modules', () => {
    const src = readFileSync(
      resolve(__dirname, '..', '..', 'components/cb-control-center/NextAllowedActionCard.tsx'),
      'utf-8',
    )
    expect(src).not.toMatch(/anthropic|@anthropic-ai|StageAiReview|aiReview/i)
    expect(src).not.toMatch(/supabase|getSupabaseAdminClient/)
    expect(src).not.toMatch(/approveDapStage|dapStageApprovalStore|revalidatePath/)
  })

  it('StageMissingEvidencePanel imports no AI / persistence / mutation modules', () => {
    const src = readFileSync(
      resolve(__dirname, '..', '..', 'components/cb-control-center/StageMissingEvidencePanel.tsx'),
      'utf-8',
    )
    expect(src).not.toMatch(/anthropic|@anthropic-ai|StageAiReview|aiReview/i)
    expect(src).not.toMatch(/supabase|getSupabaseAdminClient/)
    expect(src).not.toMatch(/approveDapStage|dapStageApprovalStore|revalidatePath/)
  })

  it('v1 and v2 stage routes both mount the same StageDetailPage component', () => {
    const v2 = readFileSync(
      resolve(__dirname, '..', '..', 'app/projects/[slug]/stages/[stageNumber]/page.tsx'),
      'utf-8',
    )
    const v1 = readFileSync(
      resolve(
        __dirname,
        '..',
        '..',
        'app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx',
      ),
      'utf-8',
    )
    expect(v1).toContain('StageDetailPage')
    expect(v2).toContain('StageDetailPage')
  })

  it('no new app/projects route file added beyond the known set', () => {
    const root = resolve(__dirname, '..', '..', 'app/projects')
    const known = new Set([
      'page.tsx',
      'new/page.tsx',
      '[slug]/page.tsx',
      '[slug]/charter/page.tsx',
      '[slug]/stages/[stageNumber]/page.tsx',
    ])
    const found: string[] = []
    function walk(dir: string, prefix = ''): void {
      for (const entry of readdirSync(dir)) {
        const full = resolve(dir, entry)
        const rel = prefix ? `${prefix}/${entry}` : entry
        if (statSync(full).isDirectory()) {
          walk(full, rel)
        } else if (entry === 'page.tsx') {
          found.push(rel)
        }
      }
    }
    walk(root)
    for (const f of found) {
      expect(known.has(f), `unexpected new route file: app/projects/${f}`).toBe(true)
    }
    // And every known route still exists (so we didn't accidentally delete one).
    for (const k of known) {
      expect(found.includes(k), `expected app/projects/${k} to exist`).toBe(true)
    }
  })
})

// ─── Boundary regression: don't pollute the engine root with UI/DAP refs ───

describe('Part 12 — engine root stays generic (cheap re-assertion)', () => {
  const ENGINE_ROOT = resolve(__dirname, '..', 'cbcc')

  it('no lib/cbcc/*.ts file imports adapters/dap or the v2 components', () => {
    for (const name of readdirSync(ENGINE_ROOT)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
      const src = readFileSync(resolve(ENGINE_ROOT, name), 'utf-8')
      expect(src, `${basename(name)} must not import adapters/dap`).not.toMatch(/adapters\/dap/)
      expect(src, `${basename(name)} must not import components/`).not.toMatch(/components\//)
    }
  })
})
