/**
 * DAP adapter — Part 6 acceptance suite.
 *
 * One test per directive checklist item. The point is to make every
 * acceptance criterion auditable in one file; broader behavior is covered by
 * dapAdapter.test.ts. If any test here fails, Part 6 is not done.
 *
 * Checklist:
 *   1.  DAP adapter registers successfully.
 *   2.  DAP exposes exactly 7 stages.
 *   3.  Each DAP stage has a full-page model.
 *   4.  Stage 1 can be approved only by owner approval.
 *   5.  Stage 2 stays locked until Stage 1 is approved.
 *   6.  Stage 3 contains Truth Schema rules.
 *   7.  Forbidden claims (10 directive-listed) are present.
 *   8.  AI review cannot approve a stage.
 *   9.  AI review cannot unlock a stage.
 *   10. Evidence entries are append-only.
 *   11. Generic CBCC core does not import DAP-specific files.
 *   12. DAP adapter imports generic CBCC core (positive direction).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'

import {
  DAP_ADAPTER,
  DAP_ADAPTER_KEY,
  DAP_BUSINESS_DEFINITION,
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_STAGE_DEFINITIONS,
  DAP_TRUTH_SCHEMA,
} from './index'

import {
  EMPTY_ADAPTER_REGISTRY,
  appendEvidence,
  applyStageApproval,
  buildStagePageModel,
  createEvidenceEntry,
  isStageLocked,
  registerAdapter,
} from '../../index'

import type {
  CbccAiReviewResult,
  CbccEvidenceEntry,
  CbccStageStatus,
} from '../../types'

// ─── Test fixtures ───────────────────────────────────────────────────────────

const ENGINE_ROOT = resolve(__dirname, '..', '..')
const ADAPTER_ROOT = __dirname

function adapterImplFiles(): string[] {
  return readdirSync(ADAPTER_ROOT)
    .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    .map(n => resolve(ADAPTER_ROOT, n))
}

function engineImplFiles(): string[] {
  return readdirSync(ENGINE_ROOT)
    .filter(n => n.endsWith('.ts') && !n.endsWith('.test.ts'))
    .map(n => resolve(ENGINE_ROOT, n))
}

function stageStatusesFromProject(): Readonly<Record<string, CbccStageStatus>> {
  return Object.fromEntries(
    DAP_PROJECT.stages.map(s => [s.id, s.status]),
  ) as Record<string, CbccStageStatus>
}

// ─── 1. DAP adapter registers successfully ──────────────────────────────────

describe('Part 6 acceptance — 1. DAP adapter registers successfully', () => {
  it('registerAdapter accepts DAP_ADAPTER into an empty registry', () => {
    const result = registerAdapter(EMPTY_ADAPTER_REGISTRY, DAP_ADAPTER)
    expect(result.ok).toBe(true)
    expect(result.registry.byKey[DAP_ADAPTER_KEY]).toBe(DAP_ADAPTER)
  })

  it('re-registering the same adapter is rejected (idempotent registry)', () => {
    const first = registerAdapter(EMPTY_ADAPTER_REGISTRY, DAP_ADAPTER)
    const second = registerAdapter(first.registry, DAP_ADAPTER)
    expect(second.ok).toBe(false)
    expect(second.reason ?? '').toMatch(/already registered/)
  })
})

// ─── 2. DAP exposes exactly 7 stages ────────────────────────────────────────

describe('Part 6 acceptance — 2. DAP exposes exactly 7 stages', () => {
  it('DAP_STAGE_DEFINITIONS has length 7', () => {
    expect(DAP_STAGE_DEFINITIONS.length).toBe(7)
  })

  it('orders are 1..7 in sequence', () => {
    expect(DAP_STAGE_DEFINITIONS.map(d => d.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('canonical titles match the directive', () => {
    const titles = DAP_STAGE_DEFINITIONS.map(d => d.title)
    expect(titles).toEqual([
      'Stage 1 — Business Intake / Definition',
      'Stage 2 — Discovery / Scrape / Existing Asset Audit',
      'Stage 3 — Truth Schema / Compliance / Claims Lock',
      'Stage 4 — Positioning / StoryBrand / Messaging',
      'Stage 5 — SEO / AEO / Core30 / Content Strategy',
      'Stage 6 — Page Architecture / Wireframes / Content Briefs',
      'Stage 7 — Build / QA / Launch',
    ])
  })

  it('DAP_ADAPTER.getStageDefinitions returns the same 7 entries', () => {
    const defs = DAP_ADAPTER.getStageDefinitions(DAP_PROJECT_ID)
    expect((defs as ReadonlyArray<unknown>).length).toBe(7)
  })
})

// ─── 3. Each DAP stage has a full-page model ────────────────────────────────

describe('Part 6 acceptance — 3. Each DAP stage has a full-page model', () => {
  for (let n = 1; n <= 7; n++) {
    it(`Stage ${n} buildStagePageModel returns a model with required fields`, () => {
      const def = DAP_STAGE_DEFINITIONS.find(d => d.order === n)!
      const model = buildStagePageModel({
        projectId: DAP_PROJECT_ID,
        stages: DAP_STAGE_DEFINITIONS,
        currentStageId: def.id,
        stageStatuses: stageStatusesFromProject(),
        evidenceLedger: [],
        evidenceRequirements: [],
      })
      expect(model.projectId).toBe(DAP_PROJECT_ID)
      expect(model.stageId).toBe(def.id)
      expect(model.stageTitle).toBe(def.title)
      expect(model.purpose).toBeTruthy()
      expect(model.requiredArtifact).toBeTruthy()
      expect(model.evidence).toBeTruthy()
      expect(model.approval).toBeTruthy()
      expect(model.aiReview).toBeTruthy()
      expect(model.navigation).toBeTruthy()
    })
  }
})

// ─── 4. Stage 1 can be approved only by owner approval ──────────────────────

describe('Part 6 acceptance — 4. Stage 1 can be approved only by owner approval', () => {
  // Build a fresh DAP project where Stage 1 is awaiting approval.
  function projectWithStage1Awaiting() {
    return {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.order === 1
          ? { ...s, status: 'awaiting_owner_approval' as const, approval: undefined }
          : s,
      ),
    }
  }

  it('applyStageApproval rejects calls without decidedBy', () => {
    const project = projectWithStage1Awaiting()
    const result = applyStageApproval(project, 'definition', {
      decidedBy: '',
      decidedAt: '2026-05-01T00:00:00Z',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/decidedBy is required/)
  })

  it('applyStageApproval rejects calls without decidedAt', () => {
    const project = projectWithStage1Awaiting()
    const result = applyStageApproval(project, 'definition', {
      decidedBy: 'Owner',
      decidedAt: '',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/decidedAt is required/)
  })

  it('applyStageApproval rejects approval from non-awaiting status', () => {
    const result = applyStageApproval(DAP_PROJECT, 'definition', {
      decidedBy: 'Owner',
      decidedAt: '2026-05-01T00:00:00Z',
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/awaiting_owner_approval/)
  })

  it('applyStageApproval succeeds with a full owner decision', () => {
    const project = projectWithStage1Awaiting()
    const result = applyStageApproval(project, 'definition', {
      decidedBy: 'Owner',
      decidedAt: '2026-05-01T00:00:00Z',
      notes: 'reviewed and approved',
    })
    expect(result.ok).toBe(true)
    expect(result.stage?.status).toBe('approved')
    expect(result.stage?.approval?.decidedBy).toBe('Owner')
  })

  it('engine has no public API named approveStage / unlockStage / persist*', async () => {
    // Approval authority lives only behind applyStageApproval (pure transition);
    // there is no shortcut function that bypasses the decidedBy/decidedAt guards.
    const mod = await import('../../index')
    const names = Object.keys(mod)
    for (const forbidden of ['approveStage', 'unlockStage', 'persist', 'commit', 'updateStage']) {
      expect(
        names.find(n => n.includes(forbidden)),
        `engine surface must not expose "${forbidden}"-style API`,
      ).toBeFalsy()
    }
  })
})

// ─── 5. Stage 2 stays locked until Stage 1 is approved ──────────────────────

describe('Part 6 acceptance — 5. Stage 2 locked until Stage 1 approved', () => {
  it('with Stage 1 not_started, Stage 2 is locked', () => {
    const project = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.order === 1 ? { ...s, status: 'not_started' as const, approval: undefined } : s,
      ),
    }
    expect(isStageLocked(project, 'discovery')).toBe(true)
  })

  it('with Stage 1 awaiting_owner_approval, Stage 2 is still locked', () => {
    const project = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.order === 1
          ? { ...s, status: 'awaiting_owner_approval' as const, approval: undefined }
          : s,
      ),
    }
    expect(isStageLocked(project, 'discovery')).toBe(true)
  })

  it('with Stage 1 approved (canonical DAP_PROJECT state), Stage 2 is unlocked', () => {
    expect(isStageLocked(DAP_PROJECT, 'discovery')).toBe(false)
  })
})

// ─── 6. Stage 3 contains Truth Schema rules ─────────────────────────────────

describe('Part 6 acceptance — 6. Stage 3 contains Truth Schema rules', () => {
  it('Stage 3 definition is the truth-schema stage', () => {
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 3)!
    expect(def.id).toBe('truth-schema')
    expect(def.title).toMatch(/Truth Schema/i)
  })

  it('DAP_ADAPTER.getStageArtifact("truth-schema") returns the truth schema artifact', () => {
    const artifact = DAP_ADAPTER.getStageArtifact(DAP_PROJECT_ID, 'truth-schema')
    expect(artifact).toBe(DAP_TRUTH_SCHEMA)
  })

  it('truth schema artifact carries 7 truth rules', () => {
    expect(DAP_TRUTH_SCHEMA.truthRules.length).toBe(7)
  })

  const REQUIRED_TRUTH_RULES: ReadonlyArray<RegExp> = [
    /not dental insurance/i,
    /process claims|processes? claims/i,
    /collect PHI|PHI/i,
    /set practice pricing/i,
    /guarantee savings/i,
    /universal availability/i,
    /pay (dental )?providers?/i,
  ]
  for (const re of REQUIRED_TRUTH_RULES) {
    it(`truth rules contain ${re}`, () => {
      const haystack = DAP_TRUTH_SCHEMA.truthRules.join(' || ')
      expect(haystack).toMatch(re)
    })
  }
})

// ─── 7. Forbidden claims (directive's 10) are present verbatim ──────────────

describe('Part 6 acceptance — 7. Directive-listed forbidden claims are present', () => {
  // The directive lists 10 forbidden claims by exact phrase; we assert each
  // appears in the truth schema's forbiddenClaims list (case-insensitive match).
  const REQUIRED_CLAIMS: ReadonlyArray<string> = [
    'DAP is dental insurance',
    'DAP provides dental coverage',
    'DAP guarantees savings',
    'DAP replaces insurance',
    'DAP pays claims',
    'DAP handles treatment decisions',
    'DAP stores PHI',
    'DAP guarantees dentist availability',
    'DAP guarantees pricing',
    'DAP is a financing product',
  ]

  const truthHaystack = DAP_TRUTH_SCHEMA.forbiddenClaims.join(' || ')

  for (const phrase of REQUIRED_CLAIMS) {
    it(`truth schema forbiddenClaims contains "${phrase}"`, () => {
      expect(truthHaystack.toLowerCase()).toContain(phrase.toLowerCase())
    })
  }

  // Cross-check: business definition mirrors the same posture.
  const bizHaystack = DAP_BUSINESS_DEFINITION.forbiddenClaims.join(' || ')
  for (const phrase of REQUIRED_CLAIMS) {
    it(`business definition forbiddenClaims contains "${phrase}"`, () => {
      expect(bizHaystack.toLowerCase()).toContain(phrase.toLowerCase())
    })
  }
})

// ─── 8. AI review cannot approve a stage ────────────────────────────────────

describe('Part 6 acceptance — 8. AI review cannot approve a stage', () => {
  function aiPassReview(stageId: string): CbccAiReviewResult {
    return {
      projectId: DAP_PROJECT_ID,
      stageId,
      decision: 'pass',
      summary: 'Looks ready to me — but I am advisory only.',
      recommendation: {
        action: 'proceed_to_owner_review',
        rationale: 'requirements appear satisfied',
      },
      risks: [],
      reviewedAt: '2026-05-01T00:00:00Z',
    }
  }

  it('AI "pass" on Stage 3 does not flip canApprove (Stage 3 is locked)', () => {
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 3)!
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: def.id,
      stageStatuses: stageStatusesFromProject(),
      evidenceLedger: [],
      evidenceRequirements: [],
      aiReviewResult: aiPassReview(def.id),
    })
    expect(model.lock.isLocked).toBe(true)
    expect(model.approval.canApprove).toBe(false)
    // …yet the AI review surfaces for display.
    expect(model.aiReview.status).toBe('available')
    expect(model.aiReview.decision).toBe('pass')
  })

  it('AI "pass" on an unlocked Stage 2 still does not approve it (status stays not_started)', () => {
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 2)!
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: def.id,
      stageStatuses: stageStatusesFromProject(),
      evidenceLedger: [],
      evidenceRequirements: [],
      aiReviewResult: aiPassReview(def.id),
    })
    expect(model.stageStatus).toBe('not_started')
    // approval.canApprove may flip true (no requirements + unlocked + not terminal)
    // but the decisive fact is: AI review never *executed* the approval — there is
    // no path in the engine that takes aiReview as input and produces an approved stage.
    expect(model.aiReview.decision).toBe('pass')
    // The page model exposes canApprove so the OWNER can act; nothing in the
    // returned object asserts approval.
    expect(model.stageStatus).not.toBe('approved')
  })
})

// ─── 9. AI review cannot unlock a stage ─────────────────────────────────────

describe('Part 6 acceptance — 9. AI review cannot unlock a stage', () => {
  it('AI "pass" on Stage 4 does not flip lock state (Stage 3 not approved)', () => {
    const def = DAP_STAGE_DEFINITIONS.find(d => d.order === 4)!
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: def.id,
      stageStatuses: stageStatusesFromProject(),
      evidenceLedger: [],
      evidenceRequirements: [],
      aiReviewResult: {
        projectId: DAP_PROJECT_ID,
        stageId: def.id,
        decision: 'pass',
        summary: 'unlock please',
        recommendation: { action: 'no_action', rationale: 'placeholder' },
        risks: [],
        reviewedAt: '2026-05-01T00:00:00Z',
      },
    })
    expect(model.lock.isLocked).toBe(true)
  })

  it('mismatched AI review identity throws CbccStagePageModelMismatchError', () => {
    expect(() =>
      buildStagePageModel({
        projectId: DAP_PROJECT_ID,
        stages: DAP_STAGE_DEFINITIONS,
        currentStageId: 'truth-schema',
        stageStatuses: stageStatusesFromProject(),
        evidenceLedger: [],
        evidenceRequirements: [],
        aiReviewResult: {
          projectId: 'some-other-project',
          stageId: 'truth-schema',
          decision: 'pass',
          summary: 's',
          recommendation: { action: 'no_action', rationale: 'r' },
          risks: [],
          reviewedAt: '2026-05-01T00:00:00Z',
        },
      }),
    ).toThrow(/identity mismatch/i)
  })
})

// ─── 10. Evidence entries are append-only ───────────────────────────────────

describe('Part 6 acceptance — 10. Evidence entries are append-only', () => {
  function makeEntry(id: string): CbccEvidenceEntry {
    return createEvidenceEntry(
      {
        id,
        projectId: DAP_PROJECT_ID,
        stageId: 'definition',
        type: 'note',
        title: `note-${id}`,
        status: 'valid',
      },
      '2026-05-01T00:00:00Z',
    )
  }

  it('appendEvidence returns a new array; the input ledger is untouched', () => {
    const original: ReadonlyArray<CbccEvidenceEntry> = []
    const next = appendEvidence(original, makeEntry('a'))
    expect(original.length).toBe(0) // input unchanged
    expect(next.length).toBe(1)
    expect(next).not.toBe(original)
  })

  it('mutating the returned array does not mutate prior versions', () => {
    const v0: ReadonlyArray<CbccEvidenceEntry> = []
    const v1 = appendEvidence(v0, makeEntry('a'))
    const v2 = appendEvidence(v1, makeEntry('b'))
    expect(v0.length).toBe(0)
    expect(v1.length).toBe(1)
    expect(v2.length).toBe(2)
    expect(v2[0].id).toBe('a')
    expect(v2[1].id).toBe('b')
  })

  it('the engine surface has no API to remove or rewrite ledger entries', async () => {
    const mod = await import('../../index')
    const names = Object.keys(mod)
    for (const forbidden of ['removeEvidence', 'deleteEvidence', 'updateEvidence', 'rewriteEvidence']) {
      expect(names.find(n => n.includes(forbidden))).toBeFalsy()
    }
  })
})

// ─── 11. Generic CBCC core does not import DAP-specific files ───────────────

describe('Part 6 acceptance — 11. Generic core does not import DAP', () => {
  it('no lib/cbcc/*.ts file references the dap adapter directory', () => {
    for (const file of engineImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      expect(src, `${basename(file)} must not import adapters/dap`).not.toMatch(
        /adapters\/dap/,
      )
      // Also: no DAP-specific token leaks into engine source (comment-stripped).
      const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      for (const re of [/\bdap\b/i, /\bdental\b/i, /\bmembership(s)?\b/i]) {
        expect(stripped, `${basename(file)} contains vertical leakage`).not.toMatch(re)
      }
    }
  })
})

// ─── 12. DAP adapter imports generic CBCC core ──────────────────────────────

describe('Part 6 acceptance — 12. DAP adapter imports generic core', () => {
  it('at least one adapter file imports from the generic engine (../../*)', () => {
    let found = false
    for (const file of adapterImplFiles()) {
      const src = readFileSync(file, 'utf-8')
      // Direction we expect: adapters/dap/* → ../../<engine module>
      if (/from ['"]\.\.\/\.\.\/(types|adapters|index|evidenceLedger|stagePageModel|stageLocking|stageApproval|aiReview|aiReviewProvider|projectRegistry|agentRegistry|agentRuntime)['"]/m.test(src)) {
        found = true
        break
      }
    }
    expect(found, 'DAP adapter must import from the generic CBCC engine').toBe(true)
  })

  it('DAP_ADAPTER conforms to the generic CbccProjectAdapter interface', () => {
    expect(typeof DAP_ADAPTER.key).toBe('string')
    expect(typeof DAP_ADAPTER.getProjectDefinition).toBe('function')
    expect(typeof DAP_ADAPTER.getStageDefinitions).toBe('function')
    expect(typeof DAP_ADAPTER.getStageArtifact).toBe('function')
    expect(typeof DAP_ADAPTER.validateStageArtifact).toBe('function')
    expect(typeof DAP_ADAPTER.getEvidenceForStage).toBe('function')
  })
})

// ─── Bonus: DAP Is / Is Not posture ─────────────────────────────────────────

describe('Part 6 acceptance — DAP Is / Is Not posture from directive', () => {
  it('DAP IS: registry, patient-facing search, practice-facing admin, MK153/CBP context', () => {
    const haystack = (
      DAP_BUSINESS_DEFINITION.summary + ' ' +
      DAP_BUSINESS_DEFINITION.whatItIs.join(' ') + ' ' +
      DAP_BUSINESS_DEFINITION.parentCompany + ' ' +
      DAP_BUSINESS_DEFINITION.marketBrand
    ).toLowerCase()
    expect(haystack).toMatch(/registry/)
    expect(haystack).toMatch(/patient-facing|patient/)
    expect(haystack).toMatch(/practice-facing|practice/)
    expect(haystack).toMatch(/mk153/)
    expect(haystack).toMatch(/client builder pro/)
  })

  it('DAP IS NOT: insurance, payment processor, claims processor, treatment, PHI, savings/coverage', () => {
    const haystack = DAP_BUSINESS_DEFINITION.whatItIsNot.join(' ').toLowerCase()
    expect(haystack).toMatch(/not dental insurance|not insurance/)
    expect(haystack).toMatch(/not a payment processor/)
    expect(haystack).toMatch(/not a claims processor/)
    expect(haystack).toMatch(/treatment decisions|clinical/)
    expect(haystack).toMatch(/savings|pricing|outcomes/)
  })
})
