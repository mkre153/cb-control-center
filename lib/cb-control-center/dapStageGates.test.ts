/**
 * DAP Stage Gate Integrity Tests
 *
 * PURPOSE: Enforce the contract that stage gates cannot be in an invalid state.
 * These tests are the machine-enforced part of the anti-bypass rule.
 *
 * COVERAGE:
 *   Group 1 — Schema integrity (all stages have required fields)
 *   Group 2 — Status invariants (approved → evidence; nextStageUnlocked → approved)
 *   Group 3 — Sequence integrity (no later stage unlocked before prior approved)
 *   Group 4 — Evidence completeness (active stages must have branch/commit/tests)
 *   Group 5 — Directive completeness (issued/active stages must have directives)
 *   Group 6 — Ledger cross-reference (ledgerPhaseId must exist in dapBuildLedger)
 *   Group 7 — Content accuracy (Stage 5 has Phase 19A evidence)
 *   Group 8 — Blocker integrity (blocked/revision_requested stages have blockers)
 */

import { describe, it, expect } from 'vitest'
import {
  DAP_STAGE_GATES,
  DAP_STAGE_SLUGS,
  getActiveStageGate,
  getApprovedStageGates,
  getStageGateById,
  getStageGatesByStatus,
  getDapStageGateBySlug,
  getNextDapStageGate,
  type DapStageStatus,
} from './dapStageGates'
import { DAP_BUILD_LEDGER } from './dapBuildLedger'
import { DAP_BUSINESS_DEFINITION } from './dapBusinessDefinition'

const VALID_STATUSES: DapStageStatus[] = [
  'not_started', 'ready_for_directive', 'directive_issued', 'in_progress',
  'evidence_submitted', 'validation_passed', 'awaiting_owner_approval',
  'approved', 'revision_requested', 'blocked',
]

// Statuses that require non-empty evidence
const EVIDENCE_REQUIRED_STATUSES: DapStageStatus[] = [
  'evidence_submitted', 'validation_passed', 'awaiting_owner_approval', 'approved',
]

// Statuses that require a non-empty directive
const DIRECTIVE_REQUIRED_STATUSES: DapStageStatus[] = [
  'directive_issued', 'in_progress', 'evidence_submitted',
  'validation_passed', 'awaiting_owner_approval', 'approved',
]

// ─── Group 1: Schema integrity ────────────────────────────────────────────────

describe('Group 1 — Schema integrity', () => {
  it('registry has exactly 7 stages', () => {
    expect(DAP_STAGE_GATES.length).toBe(7)
  })

  it('all stage IDs are non-empty and unique', () => {
    const ids = DAP_STAGE_GATES.map(s => s.stageId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toBeTruthy()
  })

  it('stageNumbers are 1 through 7 with no gaps or duplicates', () => {
    const nums = DAP_STAGE_GATES.map(s => s.stageNumber).sort((a, b) => a - b)
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('all stages have non-empty title', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(s.title, `${s.stageId} missing title`).toBeTruthy()
    }
  })

  it('all stages have non-empty description', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(s.description, `${s.stageId} missing description`).toBeTruthy()
    }
  })

  it('all stages have non-empty whyItMatters', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(s.whyItMatters, `${s.stageId} missing whyItMatters`).toBeTruthy()
    }
  })

  it('all statuses are valid', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(VALID_STATUSES, `${s.stageId} has invalid status '${s.status}'`).toContain(s.status)
    }
  })

  it('all stages have requiredApprovals array', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(Array.isArray(s.requiredApprovals), `${s.stageId} missing requiredApprovals`).toBe(true)
    }
  })

  it('stages 4, 5, 6 have externalTool populated', () => {
    for (const n of [4, 5, 6]) {
      const s = DAP_STAGE_GATES.find(g => g.stageNumber === n)!
      expect(s.externalTool, `stage ${n} missing externalTool`).toBeDefined()
      expect(s.externalTool!.name, `stage ${n} externalTool.name empty`).toBeTruthy()
      expect(s.externalTool!.role, `stage ${n} externalTool.role empty`).toBeTruthy()
      expect(s.externalTool!.requiredInputs.length, `stage ${n} externalTool.requiredInputs empty`).toBeGreaterThan(0)
      expect(s.externalTool!.expectedOutputs.length, `stage ${n} externalTool.expectedOutputs empty`).toBeGreaterThan(0)
      expect(['manual', 'prefilled-launch', 'api']).toContain(s.externalTool!.executionMode)
    }
  })

  it('stages 1, 2, 3, 7 do not have externalTool', () => {
    for (const n of [1, 2, 3, 7]) {
      const s = DAP_STAGE_GATES.find(g => g.stageNumber === n)!
      expect(s.externalTool, `stage ${n} should not have externalTool`).toBeUndefined()
    }
  })

  it('stage 4 externalTool is StoryBrand Coach with executionMode manual', () => {
    const s = DAP_STAGE_GATES.find(g => g.stageNumber === 4)!
    expect(s.externalTool!.name).toBe('StoryBrand Coach')
    expect(s.externalTool!.executionMode).toBe('manual')
  })

  it('stage 5 externalTool is CBSeoAeo with executionMode api', () => {
    const s = DAP_STAGE_GATES.find(g => g.stageNumber === 5)!
    expect(s.externalTool!.name).toBe('CBSeoAeo')
    expect(s.externalTool!.executionMode).toBe('api')
  })

  it('stage 6 externalTool is CBDesignEngine with executionMode manual', () => {
    const s = DAP_STAGE_GATES.find(g => g.stageNumber === 6)!
    expect(s.externalTool!.name).toBe('CBDesignEngine')
    expect(s.externalTool!.executionMode).toBe('manual')
  })
})

// ─── Group 2: Status invariants ───────────────────────────────────────────────

describe('Group 2 — Status invariants', () => {
  it('approved stage must have approvedByOwner: true', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        expect(
          s.approvedByOwner,
          `${s.stageId} is approved but approvedByOwner is false`
        ).toBe(true)
      }
    }
  })

  it('approved stage must have non-null approvedAt', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        expect(s.approvedAt, `${s.stageId} is approved but approvedAt is null`).not.toBeNull()
        expect(s.approvedAt).toBeTruthy()
      }
    }
  })

  it('non-approved stage must not have approvedByOwner: true', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status !== 'approved') {
        expect(
          s.approvedByOwner,
          `${s.stageId} has status '${s.status}' but approvedByOwner is true`
        ).toBe(false)
      }
    }
  })

  it('nextStageUnlocked: true requires approvedByOwner: true on the same stage', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.nextStageUnlocked) {
        expect(
          s.approvedByOwner,
          `${s.stageId} has nextStageUnlocked: true but approvedByOwner is false`
        ).toBe(true)
      }
    }
  })

  it('approved stage must have implementation evidence', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        const ev = s.implementationEvidence
        const hasEvidence =
          (ev.branch && ev.branch.length > 0) ||
          (ev.commit && ev.commit.length > 0) ||
          (ev.tests && ev.tests.length > 0)
        expect(hasEvidence, `${s.stageId} is approved but has no implementation evidence`).toBe(true)
      }
    }
  })

  it('awaiting_owner_approval stage must have non-empty requiredApprovals', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'awaiting_owner_approval') {
        expect(
          s.requiredApprovals.length,
          `${s.stageId} is awaiting approval but requiredApprovals is empty`
        ).toBeGreaterThan(0)
      }
    }
  })
})

// ─── Group 3: Sequence integrity ─────────────────────────────────────────────

describe('Group 3 — Sequence integrity', () => {
  it('no stage is unlocked while a prior required stage is unapproved', () => {
    const sorted = [...DAP_STAGE_GATES].sort((a, b) => a.stageNumber - b.stageNumber)
    for (const stage of sorted) {
      if (stage.nextStageUnlocked) {
        // All stages with lower stageNumber must also be approved
        const priorStages = sorted.filter(s => s.stageNumber < stage.stageNumber)
        for (const prior of priorStages) {
          expect(
            prior.approvedByOwner,
            `${stage.stageId} is unlocked but prior stage ${prior.stageId} is not approved`
          ).toBe(true)
        }
      }
    }
  })

  it('stage 1 must be the first stage (stageNumber 1)', () => {
    const stage1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')
    expect(stage1?.stageNumber).toBe(1)
  })

  it('stage 7 must be the last stage (stageNumber 7)', () => {
    const stage7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')
    expect(stage7?.stageNumber).toBe(7)
  })

  it('stages 6 and 7 are not unlocked', () => {
    const s6 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-06-page-architecture')!
    const s7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')!
    expect(s6.nextStageUnlocked, 'stage-06 should not be unlocked yet').toBe(false)
    expect(s7.nextStageUnlocked, 'stage-07 should not be unlocked yet').toBe(false)
  })
})

// ─── Group 4: Evidence completeness ──────────────────────────────────────────

describe('Group 4 — Evidence completeness', () => {
  it('evidence_submitted stages have branch, commit, and tests', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'evidence_submitted') {
        expect(s.implementationEvidence.branch, `${s.stageId} missing branch`).toBeTruthy()
        expect(s.implementationEvidence.commit, `${s.stageId} missing commit`).toBeTruthy()
        expect(s.implementationEvidence.tests, `${s.stageId} missing tests`).toBeTruthy()
      }
    }
  })

  it('awaiting_owner_approval stages have at least branch or commit or tests in evidence', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'awaiting_owner_approval') {
        const ev = s.implementationEvidence
        const hasAny =
          (ev.branch && ev.branch.length > 0) ||
          (ev.commit && ev.commit.length > 0) ||
          (ev.tests && ev.tests.length > 0)
        expect(
          hasAny,
          `${s.stageId} is awaiting approval but has no evidence at all`
        ).toBe(true)
      }
    }
  })

  it('not_started stages have empty evidence', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'not_started') {
        const ev = s.implementationEvidence
        const hasEvidence =
          (ev.branch && ev.branch.length > 0) ||
          (ev.commit && ev.commit.length > 0) ||
          (ev.tests && ev.tests.length > 0)
        expect(
          hasEvidence,
          `${s.stageId} is not_started but has implementation evidence — suspicious`
        ).toBeFalsy()
      }
    }
  })
})

// ─── Group 5: Directive completeness ─────────────────────────────────────────

describe('Group 5 — Directive completeness', () => {
  it('stages in active statuses have non-empty directive', () => {
    for (const s of DAP_STAGE_GATES) {
      if (DIRECTIVE_REQUIRED_STATUSES.includes(s.status)) {
        expect(
          s.directive.trim().length,
          `${s.stageId} has status '${s.status}' but directive is empty`
        ).toBeGreaterThan(0)
      }
    }
  })

  it('directive_issued stages have directiveIssued: true', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'directive_issued') {
        expect(
          s.directiveIssued,
          `${s.stageId} has status 'directive_issued' but directiveIssued is false`
        ).toBe(true)
      }
    }
  })

  it('not_started stages with directiveIssued: false have empty evidence', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'not_started' && !s.directiveIssued) {
        const ev = s.implementationEvidence
        const hasEvidence = !!(ev.branch || ev.commit || ev.tests)
        expect(
          hasEvidence,
          `${s.stageId}: no directive issued but evidence found — inconsistent state`
        ).toBe(false)
      }
    }
  })
})

// ─── Group 6: Ledger cross-reference ─────────────────────────────────────────

describe('Group 6 — Ledger cross-reference', () => {
  it('every ledgerPhaseId that is set references an existing dapBuildLedger entry', () => {
    const ledgerIds = new Set(DAP_BUILD_LEDGER.map(e => e.id))
    for (const s of DAP_STAGE_GATES) {
      if (s.ledgerPhaseId) {
        expect(
          ledgerIds.has(s.ledgerPhaseId),
          `${s.stageId} references ledger entry '${s.ledgerPhaseId}' which does not exist`
        ).toBe(true)
      }
    }
  })

  it('stage-01 ledger reference resolves to a complete entry', () => {
    const s1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')!
    const entry = DAP_BUILD_LEDGER.find(e => e.id === s1.ledgerPhaseId)
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('complete')
  })

  it('stage-03 ledger reference resolves to a complete entry', () => {
    const s3 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-03-truth-schema')!
    const entry = DAP_BUILD_LEDGER.find(e => e.id === s3.ledgerPhaseId)
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('complete')
  })
})

// ─── Group 7: Content accuracy ────────────────────────────────────────────────

describe('Group 7 — Content accuracy', () => {
  it('Stage 7 (build/launch) is not_started', () => {
    const s7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')
    expect(s7).toBeDefined()
    expect(s7?.status).toBe('not_started')
  })

  it('Stage 7 directive references Phase 19A commit a853380', () => {
    const s7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')!
    expect(s7.directive).toContain('a853380')
  })

  it('Stage 7 directive references rebuild/dap-site-v2 branch', () => {
    const s7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')!
    expect(s7.directive).toContain('rebuild/dap-site-v2')
  })

  it('Stage 7 has 4 requiredApprovals', () => {
    const s7 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-07-build-launch')!
    expect(s7.requiredApprovals.length).toBe(4)
  })

  it('Stage 1 (business definition) is approved', () => {
    const s1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')
    expect(s1).toBeDefined()
    expect(s1?.status).toBe('approved')
    expect(s1?.approvedByOwner).toBe(true)
  })

  it('Stage 1 nextStageUnlocked is true (Stage 2 is unlocked)', () => {
    const s1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')!
    expect(s1.nextStageUnlocked).toBe(true)
  })

  it('Stage 3 (truth schema) is awaiting_owner_approval', () => {
    const s3 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-03-truth-schema')
    expect(s3).toBeDefined()
    expect(s3?.status).toBe('awaiting_owner_approval')
  })

  it('Stage 2 (discovery audit) is not_started', () => {
    const s2 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-02-discovery-audit')
    expect(s2).toBeDefined()
    expect(s2?.status).toBe('not_started')
  })

  it('Stage 4 (positioning) is not_started', () => {
    const s4 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-04-positioning')
    expect(s4).toBeDefined()
    expect(s4?.status).toBe('not_started')
  })

  it('getActiveStageGate returns the first non-approved stage', () => {
    const active = getActiveStageGate()
    expect(active.stageId).toBe('stage-02-discovery-audit')
  })

  it('getApprovedStageGates returns only Stage 1', () => {
    const approved = getApprovedStageGates()
    expect(approved.length).toBe(1)
    expect(approved[0].stageId).toBe('stage-01-business-definition')
  })
})

// ─── Group 8: Blocker integrity ───────────────────────────────────────────────

describe('Group 8 — Blocker integrity', () => {
  it('blocked stages have at least one blocker', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'blocked') {
        expect(
          s.blockers.length,
          `${s.stageId} is blocked but has no blockers listed`
        ).toBeGreaterThan(0)
      }
    }
  })

  it('revision_requested stages have at least one blocker or unresolvedIssue', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'revision_requested') {
        const hasBlocker =
          s.blockers.length > 0 ||
          (s.implementationEvidence.unresolvedIssues &&
            s.implementationEvidence.unresolvedIssues.length > 0)
        expect(
          hasBlocker,
          `${s.stageId} is revision_requested but has no blockers or unresolved issues`
        ).toBe(true)
      }
    }
  })

  it('approved stages have zero blockers', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        expect(
          s.blockers.length,
          `${s.stageId} is approved but still has open blockers`
        ).toBe(0)
      }
    }
  })

  it('approved stages have zero unresolved issues in evidence', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        const unresolved = s.implementationEvidence.unresolvedIssues ?? []
        expect(
          unresolved.length,
          `${s.stageId} is approved but has unresolved evidence issues`
        ).toBe(0)
      }
    }
  })
})

// ─── Group 9: Slug and routing ────────────────────────────────────────────────

describe('Group 9 — Slug and routing', () => {
  const EXPECTED_SLUGS = [
    '1-business-definition',
    '2-discovery-audit',
    '3-truth-schema',
    '4-positioning',
    '5-seo-strategy',
    '6-page-architecture',
    '7-build-launch',
  ]

  it('all 7 stages have a non-empty slug', () => {
    for (const s of DAP_STAGE_GATES) {
      expect(s.slug, `${s.stageId} missing slug`).toBeTruthy()
    }
  })

  it('all stage slugs are unique', () => {
    const slugs = DAP_STAGE_GATES.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('stage slugs match the expected values', () => {
    const slugs = [...DAP_STAGE_GATES].sort((a, b) => a.stageNumber - b.stageNumber).map(s => s.slug)
    expect(slugs).toEqual(EXPECTED_SLUGS)
  })

  it('DAP_STAGE_SLUGS exports all 7 slugs', () => {
    expect(DAP_STAGE_SLUGS).toHaveLength(7)
    for (const slug of EXPECTED_SLUGS) {
      expect(DAP_STAGE_SLUGS).toContain(slug)
    }
  })

  it('getDapStageGateBySlug returns the correct stage', () => {
    const s1 = getDapStageGateBySlug('1-business-definition')
    expect(s1).toBeDefined()
    expect(s1?.stageNumber).toBe(1)
    expect(s1?.stageId).toBe('stage-01-business-definition')
  })

  it('getDapStageGateBySlug returns undefined for invalid slug', () => {
    expect(getDapStageGateBySlug('not-a-real-slug')).toBeUndefined()
    expect(getDapStageGateBySlug('')).toBeUndefined()
  })

  it('getDapStageGateBySlug resolves all 7 expected slugs', () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(getDapStageGateBySlug(slug), `slug '${slug}' should resolve`).toBeDefined()
    }
  })

  it('getNextDapStageGate returns stage 2 when given stage 1', () => {
    const s1 = getDapStageGateBySlug('1-business-definition')!
    const next = getNextDapStageGate(s1)
    expect(next?.stageNumber).toBe(2)
  })

  it('getNextDapStageGate returns undefined for the last stage', () => {
    const s7 = getDapStageGateBySlug('7-build-launch')!
    expect(getNextDapStageGate(s7)).toBeUndefined()
  })

  it('stage detail routes can be derived: /build/stages/[slug]', () => {
    for (const stage of DAP_STAGE_GATES) {
      const route = `/businesses/dental-advantage-plan/build/stages/${stage.slug}`
      expect(route).toContain(stage.slug)
      expect(route).toContain('/build/stages/')
    }
  })
})

// ─── Group 10: Artifact integrity ─────────────────────────────────────────────

describe('Group 10 — Artifact integrity', () => {
  it('every approved stage has an artifact', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved') {
        expect(
          s.artifact,
          `${s.stageId} is approved but has no artifact`
        ).toBeDefined()
      }
    }
  })

  it('every awaiting_owner_approval stage has a reviewable artifact', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'awaiting_owner_approval') {
        expect(
          s.artifact,
          `${s.stageId} is awaiting_owner_approval but has no artifact`
        ).toBeDefined()
        if (s.artifact) {
          expect(
            ['reviewable', 'approved'],
            `${s.stageId} artifact status is not reviewable`
          ).toContain(s.artifact.status)
        }
      }
    }
  })

  it('approved stage artifacts must include approvedAt and approvedBy', () => {
    for (const s of DAP_STAGE_GATES) {
      if (s.status === 'approved' && s.artifact) {
        expect(
          s.artifact.approvedAt,
          `${s.stageId} artifact missing approvedAt`
        ).toBeTruthy()
        expect(
          s.artifact.approvedBy,
          `${s.stageId} artifact missing approvedBy`
        ).toBeTruthy()
      }
    }
  })

  it('Stage 1 has artifact of type business_definition', () => {
    const s1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')!
    expect(s1.artifact).toBeDefined()
    expect(s1.artifact?.type).toBe('business_definition')
  })

  it('Stage 1 artifact is the DAP_BUSINESS_DEFINITION export', () => {
    const s1 = DAP_STAGE_GATES.find(s => s.stageId === 'stage-01-business-definition')!
    expect(s1.artifact).toBe(DAP_BUSINESS_DEFINITION)
  })

  it('Stage 1 artifact includes whatItIs with at least 3 items', () => {
    const artifact = DAP_BUSINESS_DEFINITION
    expect(artifact.whatItIs.length).toBeGreaterThanOrEqual(3)
    expect(artifact.whatItIs.join(' ')).toContain('registry')
  })

  it('Stage 1 artifact includes whatItIsNot with at least 4 items', () => {
    const artifact = DAP_BUSINESS_DEFINITION
    expect(artifact.whatItIsNot.length).toBeGreaterThanOrEqual(4)
    expect(artifact.whatItIsNot.join(' ')).toContain('not dental insurance')
  })

  it('Stage 1 artifact includes primaryCustomer', () => {
    expect(DAP_BUSINESS_DEFINITION.primaryCustomer).toBeTruthy()
    expect(DAP_BUSINESS_DEFINITION.primaryCustomer).toContain('without dental insurance')
  })

  it('Stage 1 artifact includes primaryConversionGoal', () => {
    expect(DAP_BUSINESS_DEFINITION.primaryConversionGoal).toBeTruthy()
    expect(DAP_BUSINESS_DEFINITION.primaryConversionGoal).toContain('search')
  })

  it('Stage 1 artifact includes allowedClaims with at least 3 items', () => {
    expect(DAP_BUSINESS_DEFINITION.allowedClaims.length).toBeGreaterThanOrEqual(3)
    expect(DAP_BUSINESS_DEFINITION.allowedClaims.join(' ')).toContain('participating dentists')
  })

  it('Stage 1 artifact includes forbiddenClaims with at least 5 items', () => {
    expect(DAP_BUSINESS_DEFINITION.forbiddenClaims.length).toBeGreaterThanOrEqual(5)
    expect(DAP_BUSINESS_DEFINITION.forbiddenClaims.join(' ')).toContain('DAP is dental insurance')
  })

  it('Stage 1 artifact forbidden claims do not include "insurance alternative"', () => {
    // forbidden claims list items, not the assertions themselves, must not use forbidden copy
    const allowedClaimsText = DAP_BUSINESS_DEFINITION.allowedClaims.join(' ')
    expect(allowedClaimsText).not.toContain('insurance alternative')
    expect(allowedClaimsText).not.toContain('dental coverage')
    expect(allowedClaimsText).not.toContain('guaranteed savings')
  })

  it('Stage 1 artifact includes 7 truth rules', () => {
    expect(DAP_BUSINESS_DEFINITION.truthRules.length).toBe(7)
  })

  it('Stage 1 artifact truth rules cover PHI prohibition', () => {
    expect(DAP_BUSINESS_DEFINITION.truthRules.join(' ')).toContain('PHI')
  })

  it('Stage 1 artifact truth rules cover claims/payments prohibition', () => {
    const rules = DAP_BUSINESS_DEFINITION.truthRules.join(' ')
    expect(rules).toContain('claims')
    expect(rules).toContain('pays providers')
  })

  it('Stage 1 artifact has status "approved"', () => {
    expect(DAP_BUSINESS_DEFINITION.status).toBe('approved')
  })

  it('Stage 1 artifact approvedAt is 2026-04-30', () => {
    expect(DAP_BUSINESS_DEFINITION.approvedAt).toBe('2026-04-30')
  })

  it('Stage 1 artifact approvedBy is Owner', () => {
    expect(DAP_BUSINESS_DEFINITION.approvedBy).toBe('Owner')
  })

  it('Stage 1 artifact sourceFiles includes dapBusinessDefinition.ts', () => {
    expect(DAP_BUSINESS_DEFINITION.sourceFiles.join(' ')).toContain('dapBusinessDefinition.ts')
  })
})
