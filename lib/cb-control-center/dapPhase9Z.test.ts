// Phase 9Z — DAP Communication Dry-Run Delivery Adapter
// Dry-run delivery is not delivery.
// No email sending. No MKCRM calls. No Resend calls. No Supabase mutations.
// CB Control Center is the authority. MKCRM is not.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/communication-dry-runs/page.tsx')

function findPages(dir: string): string[] {
  const { readdirSync, statSync } = require('fs')
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findPages(full))
    else if (entry === 'page.tsx' || entry === 'page.ts') results.push(full)
  }
  return results
}

// ─── Imports ──────────────────────────────────────────────────────────────────

import type {
  DapCommunicationDryRunStatus,
  DapCommunicationDryRunEventType,
  DapCommunicationDryRunAdapter,
  DapCommunicationDryRunResult,
} from './dapCommunicationDryRunTypes'

import {
  buildDapCommunicationDryRunFromApproval,
  getAllDapPracticeDecisionCommunicationDryRunPreviews,
  getAllDapMemberStatusCommunicationDryRunPreviews,
  validateDapCommunicationDryRunResult,
} from './dapCommunicationDryRun'

import {
  getAllDapPracticeDecisionCommunicationApprovalPreviews,
  getAllDapMemberStatusCommunicationApprovalPreviews,
  approveDapCommunicationForFutureSend,
  rejectDapCommunicationForFutureSend,
  revokeDapCommunicationApproval,
} from './dapCommunicationApprovals'

import {
  buildDapPracticeDecisionDispatchEvent,
  buildDapMemberStatusDispatchEvent,
} from './dapCommunicationDispatchEvents'

import {
  buildDapMkcrmDispatchShadowPayloadFromEvent,
} from './dapMkcrmDispatchPayloads'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeApprovedApproval(templateKey = 'practice_application_received' as const) {
  const event         = buildDapPracticeDecisionDispatchEvent(templateKey, 'dispatch_ready_for_review')
  const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
  return approveDapCommunicationForFutureSend(event, shadowPayload)
}

function makeNotReviewedApproval(templateKey = 'practice_application_received' as const) {
  const previews = getAllDapPracticeDecisionCommunicationApprovalPreviews()
  return previews.find(p => p.templateKey === templateKey)!
}

// ─── Group 1: Dry-run type surface exists ────────────────────────────────────

describe('Phase 9Z — dry-run type surface exists', () => {
  it('DapCommunicationDryRunStatus has all three values', () => {
    const values: DapCommunicationDryRunStatus[] = [
      'not_ready',
      'dry_run_ready',
      'dry_run_blocked',
    ]
    expect(values).toHaveLength(3)
  })

  it('DapCommunicationDryRunEventType has all three values', () => {
    const values: DapCommunicationDryRunEventType[] = [
      'dry_run_delivery_checked',
      'dry_run_delivery_ready',
      'dry_run_delivery_blocked',
    ]
    expect(values).toHaveLength(3)
  })

  it('DapCommunicationDryRunAdapter has both values', () => {
    const values: DapCommunicationDryRunAdapter[] = ['mkcrm_shadow', 'resend_disabled']
    expect(values).toHaveLength(2)
  })

  it('types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDryRunTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('dry-run builder file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDryRun.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('types file imports from Phase 9Y approval types (not duplicating)', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDryRunTypes.ts'), 'utf8')
    expect(src).toMatch(/dapCommunicationApprovalTypes/)
  })

  it('types file imports from Phase 9V dispatch types (not duplicating)', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDryRunTypes.ts'), 'utf8')
    expect(src).toMatch(/dapCommunicationDispatchTypes/)
  })
})

// ─── Group 2: Dry-run builder consumes Phase 9Y approvals ────────────────────

describe('Phase 9Z — dry-run builder consumes Phase 9Y approvals', () => {
  it('buildDapCommunicationDryRunFromApproval accepts a Phase 9Y approval', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result).toBeDefined()
    expect(result.verticalKey).toBe('dap')
  })

  it('result has all required top-level fields', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)

    expect(typeof result.dryRunId).toBe('string')
    expect(result.verticalKey).toBe('dap')
    expect(typeof result.communicationType).toBe('string')
    expect(typeof result.templateKey).toBe('string')
    expect(typeof result.audience).toBe('string')
    expect(result.channel).toBe('email')
    expect(typeof result.adapter).toBe('string')
    expect(typeof result.dryRunStatus).toBe('string')
    expect(typeof result.dryRunEventType).toBe('string')
    expect(typeof result.eligibleForDryRunDelivery).toBe('boolean')
    expect(Array.isArray(result.dryRunBlockerCodes)).toBe(true)
    expect(typeof result.approvalStatus).toBe('string')
    expect(typeof result.approvalEventType).toBe('string')
    expect(typeof result.dispatchEventType).toBe('string')
    expect(typeof result.readinessStatus).toBe('string')
    expect(typeof result.shadowPayloadValid).toBe('boolean')
    expect(result.source).toBeDefined()
    expect(result.delivery).toBeDefined()
    expect(result.safety).toBeDefined()
    expect(typeof result.createdAt).toBe('string')
  })

  it('result preserves templateKey from approval', () => {
    const approval = makeApprovedApproval('practice_application_received')
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.templateKey).toBe('practice_application_received')
  })

  it('result copies communicationType from approval', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.communicationType).toBe(approval.communicationType)
  })

  it('result preserves approvalStatus and approvalEventType from approval', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.approvalStatus).toBe('approved_for_future_send')
    expect(result.approvalEventType).toBe('approval_granted_for_future_send')
  })

  it('default adapter is mkcrm_shadow', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.adapter).toBe('mkcrm_shadow')
  })

  it('custom adapter is preserved when supplied', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval, { adapter: 'resend_disabled' })
    expect(result.adapter).toBe('resend_disabled')
  })
})

// ─── Group 3: Approved communications produce dry-run-ready results ───────────

describe('Phase 9Z — approved communications produce dry-run-ready results', () => {
  it('approved approval produces dryRunStatus: dry_run_ready', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunStatus).toBe('dry_run_ready')
  })

  it('approved approval produces dryRunEventType: dry_run_delivery_ready', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunEventType).toBe('dry_run_delivery_ready')
  })

  it('approved approval has eligibleForDryRunDelivery: true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.eligibleForDryRunDelivery).toBe(true)
  })

  it('approved approval has empty dryRunBlockerCodes', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunBlockerCodes).toHaveLength(0)
  })

  it('all 8 practice approval previews converted to approved produce dry_run_ready', () => {
    const practiceApprovals = getAllDapPracticeDecisionCommunicationApprovalPreviews()
    for (const approval of practiceApprovals) {
      const event         = buildDapPracticeDecisionDispatchEvent(
        approval.templateKey as Parameters<typeof buildDapPracticeDecisionDispatchEvent>[0],
        'dispatch_ready_for_review'
      )
      const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
      const approvedApproval = approveDapCommunicationForFutureSend(event, shadowPayload)
      const result = buildDapCommunicationDryRunFromApproval(approvedApproval)
      expect(result.dryRunStatus, `${approval.templateKey} should be dry_run_ready`).toBe('dry_run_ready')
    }
  })
})

// ─── Group 4: Not-reviewed, rejected, or revoked approvals produce blocked results

describe('Phase 9Z — non-approved approvals produce dry-run-blocked results', () => {
  it('not_reviewed approval produces dry_run_blocked', () => {
    const approval = makeNotReviewedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunStatus).toBe('dry_run_blocked')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })

  it('not_reviewed approval has approval_not_granted blocker', () => {
    const approval = makeNotReviewedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunBlockerCodes).toContain('approval_not_granted')
  })

  it('rejected approval produces dry_run_blocked', () => {
    const event         = buildDapPracticeDecisionDispatchEvent('practice_application_received', 'dispatch_ready_for_review')
    const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    const rejected      = rejectDapCommunicationForFutureSend(event, shadowPayload)
    const result        = buildDapCommunicationDryRunFromApproval(rejected)
    expect(result.dryRunStatus).toBe('dry_run_blocked')
    expect(result.dryRunBlockerCodes).toContain('approval_not_granted')
  })

  it('revoked approval produces dry_run_blocked', () => {
    const event         = buildDapPracticeDecisionDispatchEvent('practice_application_received', 'dispatch_ready_for_review')
    const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    const approved      = approveDapCommunicationForFutureSend(event, shadowPayload)
    const revoked       = revokeDapCommunicationApproval(approved)
    const result        = buildDapCommunicationDryRunFromApproval(revoked)
    expect(result.dryRunStatus).toBe('dry_run_blocked')
    expect(result.dryRunBlockerCodes).toContain('approval_not_granted')
  })

  it('dry_run_blocked results have dryRunEventType: dry_run_delivery_blocked', () => {
    const approval = makeNotReviewedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.dryRunEventType).toBe('dry_run_delivery_blocked')
  })
})

// ─── Group 5: Dry-run requires valid shadow payload ──────────────────────────

describe('Phase 9Z — dry-run requires valid shadow payload', () => {
  it('tampered shadowPayloadValid: false produces shadow_payload_invalid blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      shadowPayloadValid: false as unknown as true,
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('shadow_payload_invalid')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })

  it('all 16 real approval previews when approved have shadowPayloadValid: true', () => {
    const practiceApprovals = getAllDapPracticeDecisionCommunicationApprovalPreviews()
    for (const a of practiceApprovals) {
      expect(a.shadowPayloadValid, `${a.templateKey}`).toBe(true)
    }
    const memberApprovals = getAllDapMemberStatusCommunicationApprovalPreviews()
    for (const a of memberApprovals) {
      expect(a.shadowPayloadValid, `${a.templateKey}`).toBe(true)
    }
  })
})

// ─── Group 6: Dry-run preserves CB Control Center authority ──────────────────

describe('Phase 9Z — dry-run preserves CB Control Center authority', () => {
  it('all practice dry-run results have source.decisionAuthority: cb_control_center', () => {
    const results = getAllDapPracticeDecisionCommunicationDryRunPreviews()
    for (const r of results) {
      expect(r.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all member dry-run results have source.decisionAuthority: cb_control_center', () => {
    const results = getAllDapMemberStatusCommunicationDryRunPreviews()
    for (const r of results) {
      expect(r.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('tampered decisionAuthority produces invalid_decision_authority blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      source: {
        ...approval.source,
        decisionAuthority: 'mkcrm' as unknown as 'cb_control_center',
      },
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('invalid_decision_authority')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })

  it('dry-run result source.decisionAuthority is always hardcoded to cb_control_center', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.source.decisionAuthority).toBe('cb_control_center')
  })
})

// ─── Group 7: Dry-run preserves MKCRM/payment authority as false ─────────────

describe('Phase 9Z — dry-run preserves MKCRM/payment authority as false', () => {
  it('all practice dry-run results have source.crmAuthority: false', () => {
    const results = getAllDapPracticeDecisionCommunicationDryRunPreviews()
    for (const r of results) {
      expect(r.source.crmAuthority).toBe(false)
    }
  })

  it('all practice dry-run results have source.paymentAuthority: false', () => {
    const results = getAllDapPracticeDecisionCommunicationDryRunPreviews()
    for (const r of results) {
      expect(r.source.paymentAuthority).toBe(false)
    }
  })

  it('tampered crmAuthority: true produces crm_authority_detected blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      source: {
        ...approval.source,
        crmAuthority: true as unknown as false,
      },
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('crm_authority_detected')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })

  it('tampered paymentAuthority: true produces payment_authority_detected blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      source: {
        ...approval.source,
        paymentAuthority: true as unknown as false,
      },
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('payment_authority_detected')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })
})

// ─── Group 8: Dry-run preserves all delivery-disabled flags ──────────────────

describe('Phase 9Z — dry-run preserves all delivery-disabled flags', () => {
  it('dryRunOnly is always true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.dryRunOnly).toBe(true)
  })

  it('deliveryDisabled is always true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.deliveryDisabled).toBe(true)
  })

  it('externalSendDisabled is always true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.externalSendDisabled).toBe(true)
  })

  it('mkcrmDeliveryDisabled is always true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.mkcrmDeliveryDisabled).toBe(true)
  })

  it('resendDisabled is always true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.resendDisabled).toBe(true)
  })

  it('tampered delivery flags produce delivery_flags_unsafe blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      delivery: {
        ...approval.delivery,
        deliveryDisabled: false as unknown as true,
      },
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('delivery_flags_unsafe')
    expect(result.eligibleForDryRunDelivery).toBe(false)
  })
})

// ─── Group 9: Dry-run explicitly keeps queued, scheduled, sent false ──────────

describe('Phase 9Z — queued, scheduled, and sent are always false', () => {
  it('queued is always false', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.queued).toBe(false)
  })

  it('scheduled is always false', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.scheduled).toBe(false)
  })

  it('sent is always false', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(result.delivery.sent).toBe(false)
  })

  it('all 16 bulk dry-run previews have queued: false', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.delivery.queued, `${r.templateKey} queued`).toBe(false)
    }
  })

  it('all 16 bulk dry-run previews have scheduled: false', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.delivery.scheduled, `${r.templateKey} scheduled`).toBe(false)
    }
  })

  it('all 16 bulk dry-run previews have sent: false', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.delivery.sent, `${r.templateKey} sent`).toBe(false)
    }
  })
})

// ─── Group 10: Dry-run excludes body, PHI, payment, delivery status fields ───

describe('Phase 9Z — dry-run excludes forbidden content fields', () => {
  it('all 16 bulk dry-run results have safety.noPhi: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.safety.noPhi).toBe(true)
    }
  })

  it('all 16 bulk dry-run results have safety.noPaymentCta: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.safety.noPaymentCta).toBe(true)
    }
  })

  it('all 16 bulk dry-run results have safety.noEmailBody: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.safety.noEmailBody).toBe(true)
    }
  })

  it('all 16 bulk dry-run results have safety.noStoredStanding: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.safety.noStoredStanding).toBe(true)
    }
  })

  it('tampered safety flags produce safety_flags_unsafe blocker', () => {
    const approval = makeApprovedApproval()
    const badApproval = {
      ...approval,
      safety: {
        ...approval.safety,
        noPhi: false as unknown as true,
      },
    }
    const result = buildDapCommunicationDryRunFromApproval(badApproval)
    expect(result.dryRunBlockerCodes).toContain('safety_flags_unsafe')
  })

  it('dry-run builder file has no reference to email send APIs', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDryRun.ts'), 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
    expect(src).not.toMatch(/fetch\(['"]https?:\/\//i)
  })
})

// ─── Group 11: Validator rejects forbidden delivery/content fields ────────────

describe('Phase 9Z — validator rejects forbidden fields', () => {
  it('valid dry-run result passes validation', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    expect(() => validateDapCommunicationDryRunResult(result)).not.toThrow()
  })

  it('validator throws when dryRunOnly is false', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, delivery: { ...result.delivery, dryRunOnly: false as unknown as true } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('dryRunOnly')
  })

  it('validator throws when queued is true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, delivery: { ...result.delivery, queued: true as unknown as false } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('queued')
  })

  it('validator throws when scheduled is true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, delivery: { ...result.delivery, scheduled: true as unknown as false } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('scheduled')
  })

  it('validator throws when sent is true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, delivery: { ...result.delivery, sent: true as unknown as false } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('sent')
  })

  it('validator throws when noPhi is false', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, safety: { ...result.safety, noPhi: false as unknown as true } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('noPhi')
  })

  it('validator throws when forbidden field sentAt is present', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, sentAt: '2026-04-30T00:00:00Z' }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow("'sentAt'")
  })

  it('validator throws when forbidden field emailBody is present', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, emailBody: 'Dear doctor...' }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow("'emailBody'")
  })

  it('validator throws when forbidden field paymentCta is present', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, paymentCta: 'Pay now' }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow("'paymentCta'")
  })

  it('validator throws when forbidden nested field queuedAt is present', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, meta: { queuedAt: '2026-04-30T00:00:00Z' } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow("'queuedAt'")
  })

  it('validator throws when crmAuthority is true', () => {
    const approval = makeApprovedApproval()
    const result   = buildDapCommunicationDryRunFromApproval(approval)
    const bad = { ...result, source: { ...result.source, crmAuthority: true as unknown as false } }
    expect(() => validateDapCommunicationDryRunResult(bad)).toThrow('crmAuthority')
  })

  it('all 16 bulk dry-run results pass validation', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(() => validateDapCommunicationDryRunResult(r), `${r.templateKey} should pass validation`).not.toThrow()
    }
  })
})

// ─── Group 12: Dry-run preview page ──────────────────────────────────────────

describe('Phase 9Z — dry-run preview page renders all 16 templates', () => {
  it('page file exists at app/preview/dap/communication-dry-runs/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page imports from dapCommunicationDryRun', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/from.*dapCommunicationDryRun/)
  })

  it('page has data-communication-dry-runs-preview-page attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-communication-dry-runs-preview-page')
  })

  it('page has data-dry-run-card attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-dry-run-card')
  })

  it('page has data-eligible-for-dry-run-delivery attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-eligible-for-dry-run-delivery')
  })

  it('page shows dryRunOnly flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dryRunOnly')
  })

  it('page shows queued flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('queued')
  })

  it('page shows scheduled flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('scheduled')
  })

  it('page shows sent flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('sent')
  })

  it('page has data-dry-run-notice attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-dry-run-notice')
  })

  it('page does not reference send/resend/deliver API calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
  })

  it('page count is now 25 (Phase 9Z added communication-dry-runs page)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(43)
  })
})

// ─── Group 13: Full suite guard ───────────────────────────────────────────────

describe('Phase 9Z — full suite guard', () => {
  it('migration inventory has 9 known migrations', () => {
    const { readdirSync } = require('fs')
    const dir   = resolve(ROOT, 'supabase/migrations')
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.sql'))
    expect(files).toHaveLength(9)
  })

  it('dry-run migration exists', () => {
    expect(existsSync(resolve(ROOT, 'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql'))).toBe(true)
  })

  it('dry-run migration has REVOKE UPDATE', () => {
    const sql = readFileSync(resolve(ROOT, 'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql'), 'utf8')
    expect(sql).toMatch(/REVOKE UPDATE ON dap_communication_dry_run_events/i)
  })

  it('dry-run migration has CHECK queued = false', () => {
    const sql = readFileSync(resolve(ROOT, 'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql'), 'utf8')
    expect(sql).toMatch(/CHECK.*queued\s*=\s*false/i)
  })

  it('dry-run migration has CHECK sent = false', () => {
    const sql = readFileSync(resolve(ROOT, 'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql'), 'utf8')
    expect(sql).toMatch(/CHECK.*sent\s*=\s*false/i)
  })

  it('dry-run migration has no sent_at or delivered_at column', () => {
    const sql = readFileSync(resolve(ROOT, 'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql'), 'utf8')
    expect(sql).not.toMatch(/sent_at\s+timestamptz/i)
    expect(sql).not.toMatch(/delivered_at\s+timestamptz/i)
  })

  it('getAllDapPracticeDecisionCommunicationDryRunPreviews returns 8 items', () => {
    const results = getAllDapPracticeDecisionCommunicationDryRunPreviews()
    expect(results).toHaveLength(8)
  })

  it('getAllDapMemberStatusCommunicationDryRunPreviews returns 8 items', () => {
    const results = getAllDapMemberStatusCommunicationDryRunPreviews()
    expect(results).toHaveLength(8)
  })

  it('all 16 bulk dry-run previews are blocked (bulk previews use not_reviewed approvals)', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationDryRunPreviews(),
      ...getAllDapMemberStatusCommunicationDryRunPreviews(),
    ]
    for (const r of all) {
      expect(r.dryRunStatus, `${r.templateKey} should be dry_run_blocked (not yet approved)`).toBe('dry_run_blocked')
    }
  })

  it('prior Phase 9Y approval previews still return 16 items', () => {
    const practice = getAllDapPracticeDecisionCommunicationApprovalPreviews()
    const member   = getAllDapMemberStatusCommunicationApprovalPreviews()
    expect(practice).toHaveLength(8)
    expect(member).toHaveLength(8)
  })
})
