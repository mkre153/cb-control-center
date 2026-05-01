// CBCC adapter — DAP test suite.
//
// Verifies the DAP adapter:
//   1. Boundary: the adapter directory does not import Supabase, Next, React,
//      a real AI SDK, or other restricted runtimes.
//   2. Identity: project id / slug / vertical match the contract; adapter key
//      matches the registered adapter.
//   3. Stage locking: predecessor-approval rule applies to DAP stages.
//   4. Stage approval: applying owner approval flips status and unlocks the
//      next stage as expected.
//   5. Truth rules: forbidden claims and required disclaimers are present and
//      stable.
//   6. Page model: buildStagePageModel works for a DAP stage with realistic
//      definitions + statuses + evidence.
//   7. Evidence ledger: seedDapEvidenceLedger produces engine-valid entries
//      and integrates with appendEvidence + summarizeEvidenceForStage.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'

import {
  DAP_ADAPTER,
  DAP_ADAPTER_KEY,
  DAP_BUSINESS_DEFINITION,
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_PROJECT_NAME,
  DAP_PROJECT_SHORT_NAME,
  DAP_PROJECT_SLUG,
  DAP_PROJECT_VERTICAL,
  DAP_STAGE_DEFINITIONS,
  DAP_TRUTH_SCHEMA,
  getDapEvidenceForStage,
  getDapStageArtifact,
  seedDapEvidenceLedger,
  validateDapStageArtifact,
} from './index'

import {
  EMPTY_ADAPTER_REGISTRY,
  appendEvidence,
  applyStageApproval,
  buildStagePageModel,
  canUnlockStage,
  getNextStage,
  getStageLockReason,
  isStageLocked,
  registerAdapter,
  summarizeEvidenceForStage,
} from '../../index'

// ─── 1. Boundary scan over adapters/dap/*.ts ─────────────────────────────────

const ROOT = __dirname

function listImplFiles(): string[] {
  return readdirSync(ROOT)
    .filter(name => name.endsWith('.ts'))
    .filter(name => !name.endsWith('.test.ts'))
    .map(name => resolve(ROOT, name))
}

function read(file: string): string {
  return readFileSync(file, 'utf-8')
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

const FORBIDDEN_DEPS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /@anthropic-ai\/sdk/, label: '@anthropic-ai/sdk' },
  { pattern: /from ['"]openai['"]/i, label: 'openai' },
  { pattern: /\bgetAnthropicClient\b/, label: 'getAnthropicClient' },
  { pattern: /\bfetch\s*\(/, label: 'fetch(' },
  { pattern: /\bsupabase\b/i, label: 'supabase' },
  { pattern: /from ['"]next\//, label: 'next/' },
  { pattern: /from ['"]react['"]/, label: 'react' },
  { pattern: /['"]use server['"]/, label: "'use server'" },
  { pattern: /['"]use client['"]/, label: "'use client'" },
]

describe('DAP adapter — implementation files contain no forbidden dependencies', () => {
  for (const file of listImplFiles()) {
    const name = basename(file)
    const src = stripComments(read(file))
    for (const { pattern, label } of FORBIDDEN_DEPS) {
      it(`adapters/dap/${name} does not contain "${label}"`, () => {
        expect(src, `${name} matched ${label}`).not.toMatch(pattern)
      })
    }
  }
})

// ─── 2. Identity ─────────────────────────────────────────────────────────────

describe('DAP adapter — identity', () => {
  it('exposes the canonical project identity constants', () => {
    expect(DAP_PROJECT_ID).toBe('dental-advantage-plan')
    expect(DAP_PROJECT_SLUG).toBe('dental-advantage-plan')
    expect(DAP_PROJECT_NAME).toBe('Dental Advantage Plan')
    expect(DAP_PROJECT_SHORT_NAME).toBe('DAP')
    expect(DAP_PROJECT_VERTICAL).toBe('dental-membership-registry')
    expect(DAP_ADAPTER_KEY).toBe('dap')
  })

  it('DAP_PROJECT carries the canonical id/slug/name and adapter key', () => {
    expect(DAP_PROJECT.id).toBe(DAP_PROJECT_ID)
    expect(DAP_PROJECT.slug).toBe(DAP_PROJECT_SLUG)
    expect(DAP_PROJECT.name).toBe(DAP_PROJECT_NAME)
    expect(DAP_PROJECT.adapterKey).toBe(DAP_ADAPTER_KEY)
    expect(DAP_PROJECT.status).toBe('active')
  })

  it('adapter responds only to the canonical project id', () => {
    expect(DAP_ADAPTER.getProjectDefinition(DAP_PROJECT_ID)).not.toBeNull()
    expect(DAP_ADAPTER.getProjectDefinition('some-other-project')).toBeNull()
    expect(DAP_ADAPTER.getStageDefinitions('some-other-project')).toEqual([])
    expect(DAP_ADAPTER.getStageArtifact('some-other-project', 'definition')).toBeNull()
    expect(DAP_ADAPTER.getEvidenceForStage('some-other-project', 'definition')).toEqual([])
  })

  it('registers cleanly into an empty registry under its key', () => {
    const result = registerAdapter(EMPTY_ADAPTER_REGISTRY, DAP_ADAPTER)
    expect(result.ok).toBe(true)
    expect(result.registry.byKey[DAP_ADAPTER_KEY]).toBe(DAP_ADAPTER)
  })
})

// ─── 3. Stage locking ────────────────────────────────────────────────────────

describe('DAP adapter — stage locking', () => {
  it('Stage 1 is unlocked (project active, first stage)', () => {
    expect(isStageLocked(DAP_PROJECT, 'definition')).toBe(false)
  })

  it('Stage 2 is unlocked because Stage 1 is approved', () => {
    expect(isStageLocked(DAP_PROJECT, 'discovery')).toBe(false)
    expect(canUnlockStage(DAP_PROJECT, 'discovery').ok).toBe(true)
  })

  it('Stages 3–7 are locked because Stage 2 is not approved', () => {
    for (const id of ['truth-schema', 'positioning', 'content-strategy', 'architecture', 'build-launch']) {
      const lock = getStageLockReason(DAP_PROJECT, id)
      expect(lock.locked, `stage ${id} should be locked`).toBe(true)
      expect(lock.reason ?? '').toMatch(/predecessor/)
    }
  })

  it('getNextStage returns Stage 2 (the next actionable stage)', () => {
    const next = getNextStage(DAP_PROJECT)
    expect(next?.id).toBe('discovery')
  })
})

// ─── 4. Stage approval ───────────────────────────────────────────────────────

describe('DAP adapter — stage approval', () => {
  it('approving Stage 2 unlocks Stage 3', () => {
    // Promote Stage 2 from not_started to awaiting_owner_approval first; the
    // engine only allows applyStageApproval from awaiting_owner_approval.
    const promoted = {
      ...DAP_PROJECT,
      stages: DAP_PROJECT.stages.map(s =>
        s.id === 'discovery' ? { ...s, status: 'awaiting_owner_approval' as const } : s,
      ),
    }
    const result = applyStageApproval(promoted, 'discovery', {
      decidedBy: 'Owner',
      decidedAt: '2026-05-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(true)
    expect(result.stage?.status).toBe('approved')
    // Stage 3 ('truth-schema') should now be unlocked.
    expect(isStageLocked(result.project!, 'truth-schema')).toBe(false)
    // Stage 4 should still be locked (Stage 3 not approved).
    expect(isStageLocked(result.project!, 'positioning')).toBe(true)
  })

  it('rejects approval from a non-awaiting status', () => {
    const result = applyStageApproval(DAP_PROJECT, 'discovery', {
      decidedBy: 'Owner',
      decidedAt: '2026-05-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(false)
    expect(result.reason ?? '').toMatch(/awaiting_owner_approval/)
  })
})

// ─── 5. Truth rules / forbidden claims / disclaimers ─────────────────────────

describe('DAP adapter — truth rules', () => {
  it('exposes 7 truth rules on the truth schema artifact', () => {
    expect(DAP_TRUTH_SCHEMA.truthRules.length).toBe(7)
  })

  it('forbids the canonical disqualifying claims', () => {
    const REQUIRED_FORBIDDEN: ReadonlyArray<RegExp> = [
      /\bis dental insurance\b/i,
      /\bdental coverage\b/i,
      /\bguaranteed savings\b/i,
      /\bguaranteed coverage\b/i,
      /\baccepted everywhere\b/i,
      /\breplaces dental insurance\b/i,
      /\bcancel their insurance\b/i,
      /\bpays dentists directly\b/i,
      /\bsubmit a claim\b/i,
    ]
    const haystack = DAP_TRUTH_SCHEMA.forbiddenClaims.join(' || ')
    for (const re of REQUIRED_FORBIDDEN) {
      expect(haystack, `forbidden-claim regex did not match: ${re}`).toMatch(re)
    }
  })

  it('declares the four required disclaimers', () => {
    const REQUIRED_DISCLAIMERS: ReadonlyArray<RegExp> = [
      /not dental insurance/i,
      /participating .*?practices? set/i,
      /does not guarantee savings/i,
      /personal health information/i,
    ]
    const haystack = DAP_TRUTH_SCHEMA.requiredDisclaimers.join(' || ')
    for (const re of REQUIRED_DISCLAIMERS) {
      expect(haystack, `disclaimer regex did not match: ${re}`).toMatch(re)
    }
  })

  it('business definition mirrors the truth-schema posture', () => {
    expect(DAP_BUSINESS_DEFINITION.whatItIsNot.join(' ')).toMatch(/not dental insurance/i)
    expect(DAP_BUSINESS_DEFINITION.forbiddenClaims.join(' ')).toMatch(/dental insurance/i)
    expect(DAP_BUSINESS_DEFINITION.allowedClaims.join(' ')).toMatch(/participating dentists/i)
  })

  it('validateDapStageArtifact accepts the canonical artifacts', () => {
    expect(validateDapStageArtifact('definition', DAP_BUSINESS_DEFINITION).valid).toBe(true)
    expect(validateDapStageArtifact('truth-schema', DAP_TRUTH_SCHEMA).valid).toBe(true)
  })

  it('validateDapStageArtifact rejects type mismatches', () => {
    const r = validateDapStageArtifact('definition', DAP_TRUTH_SCHEMA)
    expect(r.valid).toBe(false)
    expect(r.errors?.join(' ')).toMatch(/business_definition/)
  })

  it('getDapStageArtifact returns artifacts for all 7 stages', () => {
    const ids = DAP_STAGE_DEFINITIONS.map(d => d.id)
    expect(ids.length).toBe(7)
    for (const id of ids) {
      const a = getDapStageArtifact(id)
      expect(a, `missing artifact for ${id}`).not.toBeNull()
    }
  })
})

// ─── 6. Page model integration ───────────────────────────────────────────────

describe('DAP adapter — page model integration', () => {
  it('builds a page model for Stage 1 (approved)', () => {
    const ledger = seedDapEvidenceLedger('definition', { now: '2026-04-30T00:00:00.000Z' })
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: 'definition',
      stageStatuses: Object.fromEntries(DAP_PROJECT.stages.map(s => [s.id, s.status])) as Record<string, never>,
      evidenceLedger: ledger,
      evidenceRequirements: [],
    })
    expect(model.stageId).toBe('definition')
    expect(model.stageTitle).toMatch(/Stage 1/)
    expect(model.stageStatus).toBe('approved')
    expect(model.lock.isLocked).toBe(false)
    expect(model.requiredArtifact?.title).toBe('Business Definition')
    expect(model.approval.canApprove).toBe(false) // already approved
  })

  it('builds a page model for Stage 3 (locked)', () => {
    const model = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: 'truth-schema',
      stageStatuses: Object.fromEntries(DAP_PROJECT.stages.map(s => [s.id, s.status])) as Record<string, never>,
      evidenceLedger: [],
      evidenceRequirements: [],
    })
    expect(model.lock.isLocked).toBe(true)
    expect(model.lock.reason ?? '').toMatch(/predecessor/)
    expect(model.approval.canApprove).toBe(false)
    expect(model.blockers.some(b => b.code === 'stage_locked')).toBe(true)
  })

  it('navigation reflects the 7-stage sequence', () => {
    const stageStatuses = Object.fromEntries(
      DAP_PROJECT.stages.map(s => [s.id, s.status]),
    ) as Record<string, never>

    const first = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: 'definition',
      stageStatuses,
      evidenceLedger: [],
      evidenceRequirements: [],
    })
    expect(first.navigation.isFirstStage).toBe(true)
    expect(first.navigation.isLastStage).toBe(false)
    expect(first.navigation.nextStageId).toBe('discovery')

    const last = buildStagePageModel({
      projectId: DAP_PROJECT_ID,
      stages: DAP_STAGE_DEFINITIONS,
      currentStageId: 'build-launch',
      stageStatuses,
      evidenceLedger: [],
      evidenceRequirements: [],
    })
    expect(last.navigation.isFirstStage).toBe(false)
    expect(last.navigation.isLastStage).toBe(true)
    expect(last.navigation.previousStageId).toBe('architecture')
  })
})

// ─── 7. Evidence ledger ──────────────────────────────────────────────────────

describe('DAP adapter — evidence ledger integration', () => {
  it('getDapEvidenceForStage returns the inline references for definition', () => {
    const items = getDapEvidenceForStage('definition')
    expect(items.length).toBeGreaterThan(0)
    expect(items.some(i => i.type === 'file')).toBe(true)
  })

  it('getDapEvidenceForStage returns [] for stages with no canonical refs', () => {
    expect(getDapEvidenceForStage('positioning')).toEqual([])
  })

  it('seedDapEvidenceLedger produces engine-valid entries that append cleanly', () => {
    const seeded = seedDapEvidenceLedger('definition', { now: '2026-04-30T00:00:00.000Z' })
    expect(seeded.length).toBeGreaterThan(0)
    for (const entry of seeded) {
      expect(entry.projectId).toBe(DAP_PROJECT_ID)
      expect(entry.stageId).toBe('definition')
      expect(entry.status).toBe('valid')
      expect(entry.id.startsWith('dap:definition:')).toBe(true)
      // Engine ledger contract: only `note` may omit ref.
      if (entry.type !== 'note') expect(entry.ref).toBeTruthy()
    }
    let ledger = appendEvidence([], seeded[0])
    ledger = appendEvidence(ledger, seeded[1])
    expect(ledger.length).toBe(2)
  })

  it('summarizes ledger entries by type and status', () => {
    const seeded = seedDapEvidenceLedger('definition', { now: '2026-04-30T00:00:00.000Z' })
    const ledger = [...seeded]
    const sum = summarizeEvidenceForStage(ledger, DAP_PROJECT_ID, 'definition')
    expect(sum.total).toBe(seeded.length)
    expect(sum.valid).toBe(seeded.length)
    expect(sum.byType.file).toBeGreaterThan(0)
  })
})
