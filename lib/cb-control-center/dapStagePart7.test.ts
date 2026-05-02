/**
 * Part 7 — DAP Test Run acceptance suite.
 *
 * One section per directive checklist item:
 *   1.  Owner approval is persisted.
 *   2.  Persisted Stage 1 approval unlocks Stage 2.
 *   3.  Refresh/reload derives the same unlocked state.
 *   4.  Stage 2 approval unlocks Stage 3.
 *   5.  Stage 3 remains locked before Stage 2 approval.
 *   6.  AI review cannot create approval records.
 *   7.  AI review cannot mutate approval records.
 *   8.  AI review cannot unlock the next stage.
 *   9.  Evidence remains append-only during the test run.
 *   10. Engine-driven stage pages include directive text.
 *   11. Generic CBCC core remains DAP-free.
 *   12. DAP adapter remains one-way dependent on generic CBCC core.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'

import {
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_PROJECT_SLUG,
  DAP_STAGE_DEFINITIONS,
} from '@/lib/cbcc/adapters/dap'
import {
  appendEvidence,
  buildStagePageModel,
  createEvidenceEntry,
  isStageLocked,
} from '@/lib/cbcc/index'
import {
  approveDapStage,
  type ApproveDapStageResult,
} from './dapStageActions'
import {
  createTestDapStageApprovalStore,
  type DapStageApproval,
} from './dapStageApprovalStore'
import {
  buildDapEffectiveProject,
  resolveDapStageOverrides,
} from './dapStageStateResolver'
import { translateEngineProjectToV2 } from './cbccProjectPipelineTranslator'
import { buildDapStageGateFromEngine } from './cbccStagePageModelTranslator'

// Part 10 evidence injection — these tests pre-date the evidence gate and
// were originally about lock/double-approve/predecessor logic, NOT evidence.
// We supply a minimal valid evidence ledger keyed to the stage being
// approved so the evidence gate is always satisfied; the test is then back
// to exercising what it originally exercised.
function evidenceFor(stageNumber: number, stageId: string): import('@/lib/cbcc/types').CbccEvidenceLedger {
  const requiredIds: Record<number, string> = {
    1: 'business_definition',
    2: 'discovery_asset_audit',
    3: 'truth_schema',
    4: 'positioning_messaging',
    5: 'seo_aeo_content_strategy',
    6: 'page_architecture_wireframes',
    7: 'build_qa_launch_evidence',
  }
  const id = requiredIds[stageNumber]
  if (!id) return []
  return [{
    id,
    projectId: DAP_PROJECT_ID,
    stageId,
    type: 'file',
    status: 'valid',
    title: `Test evidence for ${id}`,
    ref: 'test/fixture',
    createdAt: '2026-05-01T00:00:00Z',
  }]
}

// Build a "fresh-DAP" engine project where Stage 1 is awaiting (not yet
// approved by the engine static state) so the persistence flow has somewhere
// to land. Used by Sections 1–8 to exercise the full unlock chain.
function freshDapProject() {
  return {
    ...DAP_PROJECT,
    stages: DAP_PROJECT.stages.map((s, i) =>
      i === 0
        ? { ...s, status: 'awaiting_owner_approval' as const, approval: undefined }
        : s,
    ),
  }
}

beforeEach(() => {
  // Each test gets its own store — no cross-test bleed.
})

// ─── 1. Owner approval is persisted ─────────────────────────────────────────

describe('Part 7 acceptance — 1. Owner approval is persisted', () => {
  it('approveDapStage writes to the store with the supplied metadata', async () => {
    const store = createTestDapStageApprovalStore()
    // Use the engine static project (Stage 1 already approved baseline)
    // and approve Stage 2 — it's currently unlocked.
    const result = await approveDapStage(
      { stageNumber: 2, approvedBy: 'Owner', notes: 'reviewed audit', evidence: evidenceFor(2, 'discovery') },
      store,
      '2026-05-02T10:00:00Z',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.approval.stageNumber).toBe(2)
    expect(result.approval.approved).toBe(true)
    expect(result.approval.approvedBy).toBe('Owner')
    expect(result.approval.approvedAt).toBe('2026-05-02T10:00:00Z')
    expect(result.approval.notes).toBe('reviewed audit')

    const persisted = await store.list()
    expect(persisted.length).toBe(1)
    expect(persisted[0]).toMatchObject({ stageNumber: 2, approved: true, approvedBy: 'Owner' })
  })

  it('rejects approvals with missing approvedBy', async () => {
    const store = createTestDapStageApprovalStore()
    const result = await approveDapStage(
      { stageNumber: 2, approvedBy: '' },
      store,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('missing_approved_by')
  })

  it('rejects approvals for invalid stage numbers', async () => {
    const store = createTestDapStageApprovalStore()
    const r0 = await approveDapStage({ stageNumber: 0, approvedBy: 'Owner' }, store)
    expect(r0.ok).toBe(false)
    const r8 = await approveDapStage({ stageNumber: 8, approvedBy: 'Owner' }, store)
    expect(r8.ok).toBe(false)
  })

  // ─── Part 10 — evidence-gated approval ────────────────────────────────────

  it('Part 10: rejects Stage 2 approval when no evidence is supplied (gate fires)', async () => {
    const store = createTestDapStageApprovalStore()
    // Stage 2 is unlocked (Stage 1 approved baseline) but the production
    // ledger emits no Stage 2 evidence (placeholder artifact). Gate must
    // block approval.
    const r = await approveDapStage({ stageNumber: 2, approvedBy: 'Owner' }, store)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('missing_required_evidence')
    expect(r.missingEvidence).toEqual(['discovery_asset_audit'])
    // No write happened.
    expect((await store.list()).length).toBe(0)
  })

  it('Part 10: AI review evidence (different id) does NOT satisfy the gate', async () => {
    const store = createTestDapStageApprovalStore()
    const aiReview: import('@/lib/cbcc/types').CbccEvidenceLedger = [{
      id: 'opus_stage_review',
      projectId: DAP_PROJECT_ID,
      stageId: 'discovery',
      type: 'note',
      status: 'valid',
      title: 'Opus 4.7 review (not registered as required evidence)',
      createdAt: '2026-05-01T00:00:00Z',
    }]
    const r = await approveDapStage(
      { stageNumber: 2, approvedBy: 'Owner', evidence: aiReview },
      store,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('missing_required_evidence')
    expect(r.missingEvidence).toEqual(['discovery_asset_audit'])
  })

  it('Part 10: evidence from another stage does NOT count', async () => {
    const store = createTestDapStageApprovalStore()
    // Right id, wrong stage.
    const wrongStage: import('@/lib/cbcc/types').CbccEvidenceLedger = [{
      id: 'discovery_asset_audit',
      projectId: DAP_PROJECT_ID,
      stageId: 'definition', // belongs to Stage 1 instead
      type: 'file',
      status: 'valid',
      title: 'discovery audit',
      ref: 'fake',
      createdAt: '2026-05-01T00:00:00Z',
    }]
    const r = await approveDapStage(
      { stageNumber: 2, approvedBy: 'Owner', evidence: wrongStage },
      store,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('missing_required_evidence')
  })

  it('Part 10: evidence from another project does NOT count', async () => {
    const store = createTestDapStageApprovalStore()
    const wrongProject: import('@/lib/cbcc/types').CbccEvidenceLedger = [{
      id: 'discovery_asset_audit',
      projectId: 'OTHER_PROJECT',
      stageId: 'discovery',
      type: 'file',
      status: 'valid',
      title: 'discovery audit',
      ref: 'fake',
      createdAt: '2026-05-01T00:00:00Z',
    }]
    const r = await approveDapStage(
      { stageNumber: 2, approvedBy: 'Owner', evidence: wrongProject },
      store,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('missing_required_evidence')
  })

  it('Part 10: pending-status evidence does NOT count', async () => {
    const store = createTestDapStageApprovalStore()
    const pending: import('@/lib/cbcc/types').CbccEvidenceLedger = [{
      id: 'discovery_asset_audit',
      projectId: DAP_PROJECT_ID,
      stageId: 'discovery',
      type: 'file',
      status: 'pending',
      title: 'discovery audit',
      ref: 'fake',
      createdAt: '2026-05-01T00:00:00Z',
    }]
    const r = await approveDapStage(
      { stageNumber: 2, approvedBy: 'Owner', evidence: pending },
      store,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('missing_required_evidence')
  })

  it('Part 10: locking check still fires before evidence gate (Stage 3 baseline)', async () => {
    const store = createTestDapStageApprovalStore()
    // Stage 3's predecessor (Stage 2) is not approved in baseline → locked.
    // Even if we supply Stage 3 evidence, locking blocks first.
    const r = await approveDapStage(
      { stageNumber: 3, approvedBy: 'Owner', evidence: evidenceFor(3, 'truth-schema') },
      store,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('stage_locked')
  })

  it('rejects double approval of the same stage', async () => {
    const store = createTestDapStageApprovalStore()
    await approveDapStage({ stageNumber: 2, approvedBy: 'Owner', evidence: evidenceFor(2, 'discovery') }, store)
    const second = await approveDapStage({ stageNumber: 2, approvedBy: 'Owner', evidence: evidenceFor(2, 'discovery') }, store)
    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.code).toBe('already_approved')
  })
})

// ─── 2. Persisted Stage 1 approval unlocks Stage 2 ──────────────────────────

describe('Part 7 acceptance — 2. Stage 1 approval unlocks Stage 2', () => {
  it('on a fresh project (S1 awaiting), persisted S1 approval unlocks S2', async () => {
    const baseline = freshDapProject()
    expect(isStageLocked(baseline, 'discovery')).toBe(true) // S1 not approved
    const store = createTestDapStageApprovalStore()
    // Approve S1 directly via store (the action would also work; this is the
    // "persistence semantics" test).
    await store.approve({ stageNumber: 1, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const persisted = await store.list()
    const effective = buildDapEffectiveProject(baseline, persisted)
    expect(isStageLocked(effective, 'discovery')).toBe(false)
  })

  it('approveDapStage validates predecessor approval before writing', async () => {
    // Use an engine project where Stage 1 is awaiting and not approved.
    // Approving Stage 2 directly must fail because Stage 1 isn't approved.
    // (We intercept this by overriding DAP_PROJECT via buildDapEffectiveProject
    // in approveDapStage; here we exercise the action's lock check using the
    // canonical engine state where S1 IS approved — so S2 succeeds.)
    const store = createTestDapStageApprovalStore()
    const r = await approveDapStage({ stageNumber: 2, approvedBy: 'Owner', evidence: evidenceFor(2, 'discovery') }, store)
    expect(r.ok).toBe(true) // S1 approved baseline → S2 unlocked
  })
})

// ─── 3. Refresh/reload derives the same unlocked state ──────────────────────

describe('Part 7 acceptance — 3. Refresh/reload derives same state', () => {
  it('two independent reads of the store yield the same effective project', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T11:00:00Z' })

    const read1 = await store.list()
    const read2 = await store.list()
    expect(read1).toEqual(read2)

    const effective1 = buildDapEffectiveProject(DAP_PROJECT, read1)
    const effective2 = buildDapEffectiveProject(DAP_PROJECT, read2)
    expect(isStageLocked(effective1, 'truth-schema')).toBe(false)
    expect(isStageLocked(effective2, 'truth-schema')).toBe(false)
    expect(effective1.stages.find(s => s.order === 2)?.status).toBe('approved')
    expect(effective2.stages.find(s => s.order === 2)?.status).toBe('approved')
  })

  it('translateEngineProjectToV2 is deterministic for the same persisted input', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T11:00:00Z' })
    const persisted = await store.list()
    const a = translateEngineProjectToV2(DAP_PROJECT, { persistedApprovals: persisted })
    const b = translateEngineProjectToV2(DAP_PROJECT, { persistedApprovals: persisted })
    expect(a).toEqual(b)
  })
})

// ─── 4. Stage 2 approval unlocks Stage 3 ────────────────────────────────────

describe('Part 7 acceptance — 4. Stage 2 approval unlocks Stage 3', () => {
  it('persisted S2 approval makes S3 unlocked on the effective project', async () => {
    const store = createTestDapStageApprovalStore()
    expect(isStageLocked(DAP_PROJECT, 'truth-schema')).toBe(true) // baseline
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T12:00:00Z' })
    const effective = buildDapEffectiveProject(DAP_PROJECT, await store.list())
    expect(isStageLocked(effective, 'truth-schema')).toBe(false)
  })

  it('full-chain test: approve S2 via action, then verify S3 unlocked', async () => {
    const store = createTestDapStageApprovalStore()
    const r = await approveDapStage({ stageNumber: 2, approvedBy: 'Owner', evidence: evidenceFor(2, 'discovery') }, store)
    expect(r.ok).toBe(true)
    const effective = buildDapEffectiveProject(DAP_PROJECT, await store.list())
    expect(isStageLocked(effective, 'truth-schema')).toBe(false)
  })
})

// ─── 5. Stage 3 remains locked before Stage 2 approval ──────────────────────

describe('Part 7 acceptance — 5. Stage 3 remains locked before Stage 2 approval', () => {
  it('with empty store, Stage 3 is locked', () => {
    expect(isStageLocked(DAP_PROJECT, 'truth-schema')).toBe(true)
  })

  it('approving Stage 3 directly fails (predecessor not approved)', async () => {
    const store = createTestDapStageApprovalStore()
    const r = await approveDapStage({ stageNumber: 3, approvedBy: 'Owner' }, store)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('stage_locked')
    // Persistence layer must NOT have written anything.
    expect((await store.list()).length).toBe(0)
  })
})

// ─── 6. AI review cannot create approval records ────────────────────────────

describe('Part 7 acceptance — 6. AI review cannot create approval records', () => {
  it('the AI review modules never import the approval store', () => {
    const ENGINE_ROOT = resolve(__dirname, '..', 'cbcc')
    const aiFiles = ['aiReview.ts', 'aiReviewProvider.ts']
    for (const name of aiFiles) {
      const src = readFileSync(resolve(ENGINE_ROOT, name), 'utf-8')
      expect(src, `${name} must not reach into the approval store`)
        .not.toMatch(/dapStageApprovalStore|approveDapStage/)
    }
  })

  it('the engine surface has no AI-callable approve/persist API', async () => {
    const mod = await import('@/lib/cbcc/index')
    const names = Object.keys(mod)
    for (const banned of ['approveStage', 'unlockStage', 'persist', 'commit', 'updateStage']) {
      expect(names.find(n => n.includes(banned))).toBeFalsy()
    }
  })

  it('the dap action file does not import any AI module', () => {
    const src = readFileSync(resolve(__dirname, 'dapStageActions.ts'), 'utf-8')
    expect(src).not.toMatch(/aiReview|StageAiReview|dapStageReviewer|@anthropic-ai/)
  })
})

// ─── 7. AI review cannot mutate approval records ────────────────────────────

describe('Part 7 acceptance — 7. AI review cannot mutate approval records', () => {
  it('store list() returns immutable snapshots — caller cannot rewrite them', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const snapshot = await store.list()
    // Try to mutate the returned array — push fakes
    const original = [...snapshot]
    ;(snapshot as DapStageApproval[]).push({
      stageNumber: 99,
      approved: true,
      approvedAt: 'bogus',
      approvedBy: 'AI',
    })
    const reread = await store.list()
    // Real persisted state should be unchanged by the local mutation.
    expect(reread.length).toBe(original.length)
    expect(reread.find(p => p.stageNumber === 99)).toBeUndefined()
  })

  it('there is no API to unset/rewrite an existing approval', async () => {
    const store = createTestDapStageApprovalStore()
    // Verify the public interface only has list + approve.
    expect(Object.keys(store).sort()).toEqual(['approve', 'list'])
  })
})

// ─── 8. AI review cannot unlock the next stage ──────────────────────────────

describe('Part 7 acceptance — 8. AI review cannot unlock the next stage', () => {
  it('an AI review with decision=pass on locked S3 does not change lock state', () => {
    // Build the page model for S3 with an AI "pass" review attached.
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 3)!
    const stageStatuses = Object.fromEntries(
      DAP_PROJECT.stages.map(s => [s.id, s.status]),
    )
    // Use the engine page model directly to prove AI review is display-only.
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: def.id,
      stageStatuses,
      evidenceLedger: [],
      evidenceRequirements: [],
      aiReviewResult: {
        projectId: DAP_PROJECT_ID,
        stageId: def.id,
        decision: 'pass',
        summary: 'unlock please',
        recommendation: { action: 'no_action', rationale: 'placeholder' },
        risks: [],
        reviewedAt: '2026-05-02T13:00:00Z',
      },
    })
    expect(model.lock.isLocked).toBe(true)
    expect(model.approval.canApprove).toBe(false)
  })
})

// ─── 9. Evidence remains append-only during the test run ────────────────────

describe('Part 7 acceptance — 9. Evidence remains append-only', () => {
  it('appendEvidence does not mutate the input ledger', () => {
    const v0: ReadonlyArray<unknown> = []
    const e1 = createEvidenceEntry({
      id: 'e1',
      projectId: DAP_PROJECT_ID,
      stageId: 'definition',
      type: 'note',
      title: 'baseline',
      status: 'valid',
    }, '2026-05-02T10:00:00Z')
    const v1 = appendEvidence(v0 as never, e1)
    expect(v0.length).toBe(0)
    expect(v1.length).toBe(1)
  })

  it('approving a stage does not delete or modify any prior approval', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const before = await store.list()
    // Try to approve another stage; first record must remain identical.
    await approveDapStage({ stageNumber: 3, approvedBy: 'Owner' }, store)
    const after = await store.list()
    const beforeS2 = before.find(p => p.stageNumber === 2)
    const afterS2 = after.find(p => p.stageNumber === 2)
    expect(afterS2).toEqual(beforeS2)
  })
})

// ─── 10. Engine-driven stage pages include directive text ───────────────────

describe('Part 7 acceptance — 10. Engine-driven stage pages include directive text', () => {
  for (let n = 1; n <= 7; n++) {
    it(`Stage ${n} definition has non-empty directive`, () => {
      const def = DAP_STAGE_DEFINITIONS.find(d => d.order === n)!
      expect(def.directive).toBeTruthy()
      expect(def.directive!.trim().length).toBeGreaterThan(50)
      expect(def.directive!.trim().startsWith(`# Stage ${n} —`)).toBe(true)
    })
  }

  it('buildDapStageGateFromEngine surfaces directive content on the gate', () => {
    const gate = buildDapStageGateFromEngine(7)!
    expect(gate.directive.trim().length).toBeGreaterThan(50)
    expect(gate.directiveIssued).toBe(true)
    expect(gate.directive).toMatch(/Build \/ QA \/ Launch/i)
  })

  it('locked engine-driven stages still surface the directive (planning-only)', () => {
    // Stage 7 is locked (predecessor chain not approved). It must still emit
    // directive text so the StageDetailPage's locked-directive UX kicks in.
    const gate = buildDapStageGateFromEngine(7)!
    expect(gate.blockers.length).toBeGreaterThan(0)
    expect(gate.directive.trim().length).toBeGreaterThan(0)
  })
})

// ─── 11. Generic CBCC core remains DAP-free ─────────────────────────────────

describe('Part 7 acceptance — 11. Generic CBCC core remains DAP-free', () => {
  const ENGINE_ROOT = resolve(__dirname, '..', 'cbcc')

  function listEngineImplFiles(): string[] {
    return readdirSync(ENGINE_ROOT)
      .filter(name => name.endsWith('.ts'))
      .filter(name => !name.endsWith('.test.ts'))
      .map(name => resolve(ENGINE_ROOT, name))
  }

  it('no lib/cbcc/*.ts file references the dap adapter directory', () => {
    for (const file of listEngineImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${basename(file)} must not import adapters/dap`).not.toMatch(/adapters\/dap/)
    }
  })

  it('no lib/cbcc/*.ts file references the new persistence/action layer', () => {
    for (const file of listEngineImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${basename(file)} must not import dap action/store/resolver`).not.toMatch(
        /dapStage(Actions|ApprovalStore|StateResolver)/,
      )
    }
  })
})

// ─── 12. DAP adapter remains one-way dependent ──────────────────────────────

describe('Part 7 acceptance — 12. DAP adapter is one-way dependent on generic core', () => {
  const ADAPTER_ROOT = resolve(__dirname, '..', 'cbcc', 'adapters', 'dap')

  it('at least one adapter file imports the generic engine', () => {
    const files = readdirSync(ADAPTER_ROOT)
      .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    let imports = false
    for (const name of files) {
      const src = readFileSync(resolve(ADAPTER_ROOT, name), 'utf-8')
      if (/from ['"]\.\.\/\.\.\//.test(src)) {
        imports = true
        break
      }
    }
    expect(imports).toBe(true)
  })

  it('no adapter file imports lib/cb-control-center (the DAP-specific app layer)', () => {
    // Part 20 update: ban actual imports rather than the bare word, so
    // adapter modules can document the boundary rule in their own
    // comments without tripping the check. Matches the pattern the
    // Part 19 acceptance suite uses.
    const files = readdirSync(ADAPTER_ROOT)
      .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    for (const name of files) {
      const src = readFileSync(resolve(ADAPTER_ROOT, name), 'utf-8')
      expect(src, `${name} must not import lib/cb-control-center`).not.toMatch(
        /from ['"][^'"]*cb-control-center[^'"]*['"]/,
      )
    }
  })
})

// ─── Bonus — translator overlay sanity ──────────────────────────────────────

describe('Part 7 — translator overlay sanity', () => {
  it('persisted approval flips the v2 stage row to approved', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const persisted = await store.list()
    const bundle = translateEngineProjectToV2(DAP_PROJECT, { persistedApprovals: persisted })
    const s2 = bundle.stages.find(s => s.stageNumber === 2)!
    expect(s2.approved).toBe(true)
    expect(s2.stageStatus).toBe('approved')
    expect(s2.approvedBy).toBe('Owner')
  })

  it('resolveDapStageOverrides populates per-stage maps for the page-model translator', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const persisted = await store.list()
    const overrides = resolveDapStageOverrides(DAP_PROJECT, persisted)
    expect(overrides.stageStatusOverrides['discovery']).toBe('approved')
    expect(overrides.approvalOverrides['discovery']?.approvedBy).toBe('Owner')
  })

  it('page-model translator picks up overrides — locked S3 becomes unlocked after S2 approved', async () => {
    const store = createTestDapStageApprovalStore()
    await store.approve({ stageNumber: 2, approvedBy: 'Owner', now: '2026-05-02T10:00:00Z' })
    const persisted = await store.list()
    const overrides = resolveDapStageOverrides(DAP_PROJECT, persisted)

    const beforeGate = buildDapStageGateFromEngine(3)!
    const afterGate = buildDapStageGateFromEngine(3, {
      stageStatusOverrides: overrides.stageStatusOverrides,
      approvalOverrides: overrides.approvalOverrides,
    })!
    expect(beforeGate.blockers.length).toBeGreaterThan(0) // baseline locked
    expect(afterGate.blockers.length).toBe(0) // unlocked after S2 approval
  })
})

// ─── DAP Project slug sanity ────────────────────────────────────────────────

describe('Part 7 — DAP project slug', () => {
  it('exposes the canonical slug', () => {
    expect(DAP_PROJECT_SLUG).toBe('dental-advantage-plan')
  })
})
