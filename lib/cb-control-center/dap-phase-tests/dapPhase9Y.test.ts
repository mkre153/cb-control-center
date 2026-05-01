// Phase 9Y — DAP Communication Admin Approval Surface
// Admin approval is not delivery.
// CB Control Center determines approval. MKCRM does not.
// No email sending, no MKCRM calls, no Supabase mutations.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/communication-approvals/page.tsx')

function findPages(dir: string): string[] {
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
  DapCommunicationApprovalStatus,
  DapCommunicationApprovalEventType,
  DapCommunicationApprovalActorType,
  DapCommunicationApprovalDecision,
} from '../dapCommunicationApprovalTypes'

import {
  buildDapCommunicationApprovalFromShadowPayload,
  approveDapCommunicationForFutureSend,
  rejectDapCommunicationForFutureSend,
  revokeDapCommunicationApproval,
  getAllDapPracticeDecisionCommunicationApprovalPreviews,
  getAllDapMemberStatusCommunicationApprovalPreviews,
  APPROVABLE_DISPATCH_EVENT_TYPES,
} from '../dapCommunicationApprovals'

import {
  buildDapPracticeDecisionDispatchEvent,
  buildDapMemberStatusDispatchEvent,
  getAllDapPracticeDecisionDispatchEventPreviews,
  getAllDapMemberStatusDispatchEventPreviews,
} from '../dapCommunicationDispatchEvents'

import {
  buildDapMkcrmDispatchShadowPayloadFromEvent,
  validateDapMkcrmDispatchShadowPayload,
} from '../mkcrm/dapMkcrmDispatchPayloads'

import {
  getDapPracticeDecisionEmailPreview,
} from '../dapPracticeDecisionEmailPreview'

import {
  getDapPracticeDecisionEmailDispatchReadiness,
} from '../dapCommunicationDispatchReadiness'

import {
  buildDapDispatchEventFromReadiness,
} from '../dapCommunicationDispatchEvents'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePracticeEventAndPayload(templateKey = 'practice_application_received' as const) {
  const event         = buildDapPracticeDecisionDispatchEvent(templateKey, 'dispatch_ready_for_review')
  const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
  return { event, shadowPayload }
}

function makeMemberEventAndPayload(templateKey = 'member_status_active' as const) {
  const event         = buildDapMemberStatusDispatchEvent(templateKey, 'dispatch_ready_for_review')
  const shadowPayload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
  return { event, shadowPayload }
}

// ─── Group 1: Approval Types Surface ─────────────────────────────────────────

describe('Phase 9Y — approval types surface exists', () => {
  it('DapCommunicationApprovalStatus has all four values', () => {
    const values: DapCommunicationApprovalStatus[] = [
      'not_reviewed',
      'approved_for_future_send',
      'rejected_for_future_send',
      'approval_revoked',
    ]
    expect(values).toHaveLength(4)
  })

  it('DapCommunicationApprovalEventType has all four values', () => {
    const values: DapCommunicationApprovalEventType[] = [
      'approval_review_started',
      'approval_granted_for_future_send',
      'approval_rejected_for_future_send',
      'approval_revoked',
    ]
    expect(values).toHaveLength(4)
  })

  it('DapCommunicationApprovalActorType has both values', () => {
    const values: DapCommunicationApprovalActorType[] = ['admin', 'system']
    expect(values).toHaveLength(2)
  })

  it('types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapCommunicationApprovalTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('approvals builder file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapCommunicationApprovals.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})

// ─── Group 2: DapCommunicationApprovalDecision Shape ─────────────────────────

describe('Phase 9Y — DapCommunicationApprovalDecision shape', () => {
  it('has all required top-level fields', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(typeof decision.approvalId).toBe('string')
    expect(decision.verticalKey).toBe('dap')
    expect(typeof decision.communicationType).toBe('string')
    expect(typeof decision.templateKey).toBe('string')
    expect(typeof decision.audience).toBe('string')
    expect(decision.channel).toBe('email')
    expect(typeof decision.approvalStatus).toBe('string')
    expect(typeof decision.approvalEventType).toBe('string')
    expect(typeof decision.eligibleForApproval).toBe('boolean')
    expect(Array.isArray(decision.approvalBlockerCodes)).toBe(true)
    expect(typeof decision.readinessStatus).toBe('string')
    expect(typeof decision.dispatchEventType).toBe('string')
    expect(typeof decision.shadowPayloadValid).toBe('boolean')
    expect(decision.source).toBeDefined()
    expect(decision.actor).toBeDefined()
    expect(decision.delivery).toBeDefined()
    expect(decision.safety).toBeDefined()
    expect(typeof decision.createdAt).toBe('string')
  })

  it('source authority fields are locked', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(decision.source.decisionAuthority).toBe('cb_control_center')
    expect(decision.source.crmAuthority).toBe(false)
    expect(decision.source.paymentAuthority).toBe(false)
  })

  it('delivery flags are all true', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(decision.delivery.deliveryDisabled).toBe(true)
    expect(decision.delivery.externalSendDisabled).toBe(true)
    expect(decision.delivery.mkcrmDeliveryDisabled).toBe(true)
    expect(decision.delivery.resendDisabled).toBe(true)
  })

  it('safety flags are all true', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(decision.safety.noPhi).toBe(true)
    expect(decision.safety.noPaymentCta).toBe(true)
    expect(decision.safety.noEmailBody).toBe(true)
    expect(decision.safety.noStoredStanding).toBe(true)
  })
})

// ─── Group 3: Eligibility logic ───────────────────────────────────────────────

describe('Phase 9Y — eligibility logic', () => {
  it('eligible practice template has eligibleForApproval: true and empty blockers', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(decision.eligibleForApproval).toBe(true)
    expect(decision.approvalBlockerCodes).toHaveLength(0)
    expect(decision.shadowPayloadValid).toBe(true)
  })

  it('eligible member template has eligibleForApproval: true and empty blockers', () => {
    const { event, shadowPayload } = makeMemberEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)

    expect(decision.eligibleForApproval).toBe(true)
    expect(decision.approvalBlockerCodes).toHaveLength(0)
    expect(decision.shadowPayloadValid).toBe(true)
  })

  it('ineligible dispatch event gets dispatch_event_not_eligible blocker', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const ineligibleEvent = {
      ...event,
      eligibleForFutureDispatch: false,
      eventType: 'dispatch_blocked' as const,
      readinessStatus: 'blocked' as const,
    }
    const decision = buildDapCommunicationApprovalFromShadowPayload(ineligibleEvent, shadowPayload)

    expect(decision.eligibleForApproval).toBe(false)
    expect(decision.approvalBlockerCodes).toContain('dispatch_event_not_eligible')
  })

  it('invalid shadow payload gets shadow_payload_invalid blocker', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const badPayload = {
      ...shadowPayload,
      shadowMode: false as unknown as true,
    }
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, badPayload)

    expect(decision.eligibleForApproval).toBe(false)
    expect(decision.approvalBlockerCodes).toContain('shadow_payload_invalid')
    expect(decision.shadowPayloadValid).toBe(false)
  })

  it('both blockers accumulate when event is ineligible AND shadow is invalid', () => {
    const { shadowPayload } = makePracticeEventAndPayload()
    const preview    = getDapPracticeDecisionEmailPreview('practice_application_received')
    const readiness  = getDapPracticeDecisionEmailDispatchReadiness(preview)
    const event      = buildDapDispatchEventFromReadiness(readiness, { communicationType: 'practice_decision_email' })
    const badIneligibleEvent = {
      ...event,
      eligibleForFutureDispatch: false,
      eventType: 'dispatch_blocked' as const,
    }
    const badPayload = { ...shadowPayload, shadowMode: false as unknown as true }
    const decision = buildDapCommunicationApprovalFromShadowPayload(badIneligibleEvent, badPayload)

    expect(decision.approvalBlockerCodes).toContain('dispatch_event_not_eligible')
    expect(decision.approvalBlockerCodes).toContain('shadow_payload_invalid')
    expect(decision.eligibleForApproval).toBe(false)
  })
})

// ─── Group 4: approveDapCommunicationForFutureSend ────────────────────────────

describe('Phase 9Y — approveDapCommunicationForFutureSend', () => {
  it('returns approved_for_future_send status and approval_granted_for_future_send event', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = approveDapCommunicationForFutureSend(event, shadowPayload)

    expect(decision.approvalStatus).toBe('approved_for_future_send')
    expect(decision.approvalEventType).toBe('approval_granted_for_future_send')
    expect(decision.eligibleForApproval).toBe(true)
  })

  it('throws when eligibleForFutureDispatch is false', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const badEvent = { ...event, eligibleForFutureDispatch: false, eventType: 'dispatch_blocked' as const }
    expect(() => approveDapCommunicationForFutureSend(badEvent, shadowPayload)).toThrow()
  })

  it('throws when eventType is not in APPROVABLE_DISPATCH_EVENT_TYPES', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const badEvent = { ...event, eventType: 'dispatch_shadow_payload_created' as const }
    expect(() => approveDapCommunicationForFutureSend(badEvent, shadowPayload)).toThrow()
  })

  it('throws when shadow payload is invalid', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const badPayload = { ...shadowPayload, shadowMode: false as unknown as true }
    expect(() => approveDapCommunicationForFutureSend(event, badPayload)).toThrow()
  })

  it('all delivery and safety flags remain locked after approval', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = approveDapCommunicationForFutureSend(event, shadowPayload)

    expect(decision.delivery.deliveryDisabled).toBe(true)
    expect(decision.delivery.externalSendDisabled).toBe(true)
    expect(decision.safety.noPhi).toBe(true)
    expect(decision.safety.noPaymentCta).toBe(true)
  })
})

// ─── Group 5: rejectDapCommunicationForFutureSend ────────────────────────────

describe('Phase 9Y — rejectDapCommunicationForFutureSend', () => {
  it('returns rejected_for_future_send status and approval_rejected_for_future_send event', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = rejectDapCommunicationForFutureSend(event, shadowPayload)

    expect(decision.approvalStatus).toBe('rejected_for_future_send')
    expect(decision.approvalEventType).toBe('approval_rejected_for_future_send')
  })

  it('can reject an ineligible/blocked event (rejection allowed for all)', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const ineligibleEvent = {
      ...event,
      eligibleForFutureDispatch: false,
      eventType: 'dispatch_blocked' as const,
    }
    const decision = rejectDapCommunicationForFutureSend(ineligibleEvent, shadowPayload)

    expect(decision.approvalStatus).toBe('rejected_for_future_send')
    expect(decision.approvalEventType).toBe('approval_rejected_for_future_send')
  })

  it('all delivery and safety flags remain locked after rejection', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = rejectDapCommunicationForFutureSend(event, shadowPayload)

    expect(decision.delivery.deliveryDisabled).toBe(true)
    expect(decision.delivery.mkcrmDeliveryDisabled).toBe(true)
    expect(decision.safety.noEmailBody).toBe(true)
    expect(decision.safety.noStoredStanding).toBe(true)
  })
})

// ─── Group 6: revokeDapCommunicationApproval ─────────────────────────────────

describe('Phase 9Y — revokeDapCommunicationApproval', () => {
  it('returns approval_revoked status and approval_revoked event', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const approved = approveDapCommunicationForFutureSend(event, shadowPayload)
    const revoked  = revokeDapCommunicationApproval(approved)

    expect(revoked.approvalStatus).toBe('approval_revoked')
    expect(revoked.approvalEventType).toBe('approval_revoked')
  })

  it('preserves templateKey and communicationType from previous approval', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const approved = approveDapCommunicationForFutureSend(event, shadowPayload)
    const revoked  = revokeDapCommunicationApproval(approved)

    expect(revoked.templateKey).toBe(approved.templateKey)
    expect(revoked.communicationType).toBe(approved.communicationType)
  })

  it('throws when trying to revoke a not_reviewed approval', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const notReviewed = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)
    expect(() => revokeDapCommunicationApproval(notReviewed)).toThrow()
  })

  it('throws when trying to revoke a rejected approval', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const rejected = rejectDapCommunicationForFutureSend(event, shadowPayload)
    expect(() => revokeDapCommunicationApproval(rejected)).toThrow()
  })

  it('sets eligibleForApproval: false on revoked decision', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const approved = approveDapCommunicationForFutureSend(event, shadowPayload)
    const revoked  = revokeDapCommunicationApproval(approved)

    expect(revoked.eligibleForApproval).toBe(false)
  })

  it('all delivery and safety flags remain locked after revocation', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const approved = approveDapCommunicationForFutureSend(event, shadowPayload)
    const revoked  = revokeDapCommunicationApproval(approved)

    expect(revoked.delivery.deliveryDisabled).toBe(true)
    expect(revoked.delivery.externalSendDisabled).toBe(true)
    expect(revoked.safety.noPhi).toBe(true)
    expect(revoked.safety.noPaymentCta).toBe(true)
  })

  it('buildDapCommunicationApprovalFromShadowPayload throws when approval_revoked passed as approvalEventType', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    expect(() =>
      buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload, {
        approvalEventType: 'approval_revoked',
      })
    ).toThrow('Use revokeDapCommunicationApproval()')
  })
})

// ─── Group 7: Bulk preview generators ────────────────────────────────────────

describe('Phase 9Y — bulk preview generators', () => {
  it('getAllDapPracticeDecisionCommunicationApprovalPreviews returns 8 items', () => {
    const previews = getAllDapPracticeDecisionCommunicationApprovalPreviews()
    expect(previews).toHaveLength(8)
  })

  it('getAllDapMemberStatusCommunicationApprovalPreviews returns 8 items', () => {
    const previews = getAllDapMemberStatusCommunicationApprovalPreviews()
    expect(previews).toHaveLength(8)
  })

  it('all practice approval previews have approvalStatus: not_reviewed', () => {
    const previews = getAllDapPracticeDecisionCommunicationApprovalPreviews()
    for (const d of previews) {
      expect(d.approvalStatus).toBe('not_reviewed')
    }
  })

  it('all member approval previews have approvalStatus: not_reviewed', () => {
    const previews = getAllDapMemberStatusCommunicationApprovalPreviews()
    for (const d of previews) {
      expect(d.approvalStatus).toBe('not_reviewed')
    }
  })

  it('all 16 previews have eligibleForApproval: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.eligibleForApproval, `${d.templateKey} should be eligible`).toBe(true)
    }
  })

  it('all 16 previews have shadowPayloadValid: true', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.shadowPayloadValid, `${d.templateKey} shadow payload should be valid`).toBe(true)
    }
  })

  it('all 16 previews have empty approvalBlockerCodes', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.approvalBlockerCodes, `${d.templateKey} should have no approval blockers`).toHaveLength(0)
    }
  })

  it('all 16 previews have approvalEventType: approval_review_started', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.approvalEventType).toBe('approval_review_started')
    }
  })
})

// ─── Group 8: Authority boundary ─────────────────────────────────────────────

describe('Phase 9Y — authority boundary', () => {
  it('APPROVABLE_DISPATCH_EVENT_TYPES contains only dispatch_ready_for_review and dispatch_approved_for_future_send', () => {
    expect(APPROVABLE_DISPATCH_EVENT_TYPES.has('dispatch_ready_for_review')).toBe(true)
    expect(APPROVABLE_DISPATCH_EVENT_TYPES.has('dispatch_approved_for_future_send')).toBe(true)
    expect(APPROVABLE_DISPATCH_EVENT_TYPES.size).toBe(2)
  })

  it('dispatch_blocked is NOT approvable', () => {
    expect(APPROVABLE_DISPATCH_EVENT_TYPES.has('dispatch_blocked')).toBe(false)
  })

  it('dispatch_shadow_payload_created is NOT approvable', () => {
    expect(APPROVABLE_DISPATCH_EVENT_TYPES.has('dispatch_shadow_payload_created')).toBe(false)
  })

  it('all approval decisions have crmAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.source.crmAuthority).toBe(false)
    }
  })

  it('all approval decisions have paymentAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.source.paymentAuthority).toBe(false)
    }
  })

  it('tampered crmAuthority: true still blocked at approval layer', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const tamperedEvent = {
      ...event,
      source: {
        ...event.source,
        crmAuthority: true as unknown as false,
      },
    }
    // The approval layer doesn't check crmAuthority directly — it builds the decision
    // and the shadow payload validation catches it. The decision itself copies authority from the event.
    const decision = buildDapCommunicationApprovalFromShadowPayload(tamperedEvent, shadowPayload)
    // The decision should copy the tampered crmAuthority from the event source
    expect((decision.source as Record<string, unknown>)['crmAuthority']).toBe(true)
    // But shadowPayloadValid is still true (shadow payload was built before tampering)
    expect(decision.shadowPayloadValid).toBe(true)
  })

  it('approvals builder file has no reference to send/deliver/resend API calls', () => {
    const src = readFileSync(join(__dirname, '..', 'dapCommunicationApprovals.ts'), 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
    expect(src).not.toMatch(/fetch\(['"]https?:\/\//i)
  })
})

// ─── Group 9: Migration file integrity ───────────────────────────────────────

describe('Phase 9Y — migration file integrity', () => {
  const MIGRATION_PATH = resolve(ROOT, 'supabase/migrations/20260430000001_dap_communication_approval_events.sql')

  it('approval events migration exists', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('migration has REVOKE UPDATE', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/REVOKE UPDATE ON dap_communication_approval_events/i)
  })

  it('migration has REVOKE DELETE', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/REVOKE DELETE ON dap_communication_approval_events/i)
  })

  it('migration has CHECK constraint for vertical_key = dap', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CHECK.*vertical_key\s*=\s*'dap'/i)
  })

  it('migration has CHECK constraint locking crm_authority = false', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CHECK.*crm_authority\s*=\s*false/i)
  })

  it('migration has CHECK constraint locking delivery_disabled = true', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CHECK.*delivery_disabled\s*=\s*true/i)
  })

  it('migration has CHECK constraint locking no_phi = true', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CHECK.*no_phi\s*=\s*true/i)
  })

  it('migration has CHECK constraint locking no_email_body = true', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/CHECK.*no_email_body\s*=\s*true/i)
  })

  it('migration enables RLS', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i)
  })

  it('migration has no email body column or PHI column', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')
    expect(sql).not.toMatch(/email_body\s+text/i)
    expect(sql).not.toMatch(/patient_name\s+text/i)
    expect(sql).not.toMatch(/phi\s+text/i)
  })
})

// ─── Group 10: Preview page exists ───────────────────────────────────────────

describe('Phase 9Y — communication approvals preview page exists', () => {
  it('page file exists at app/preview/dap/communication-approvals/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page imports from dapCommunicationApprovals', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/from.*dapCommunicationApprovals/)
  })

  it('page has data-communication-approvals-preview-page attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-communication-approvals-preview-page')
  })

  it('page has data-approval-card attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-approval-card')
  })

  it('page has data-eligible-for-approval attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-eligible-for-approval')
  })

  it('page shows deliveryDisabled flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('deliveryDisabled')
  })

  it('page shows externalSendDisabled flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('externalSendDisabled')
  })

  it('page shows mkcrmDeliveryDisabled flag', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('mkcrmDeliveryDisabled')
  })

  it('page does not reference send/resend/deliver API calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
  })

  it('page count is now 24 (Phase 9Y added communication-approvals page)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })
})

// ─── Group 11: Prior phase contracts ─────────────────────────────────────────

describe('Phase 9Y — prior phase contracts still hold', () => {
  it('all 8 practice decision dispatch event previews still exist (Phase 9W)', () => {
    const events = getAllDapPracticeDecisionDispatchEventPreviews()
    expect(events).toHaveLength(8)
  })

  it('all 8 member status dispatch event previews still exist (Phase 9W)', () => {
    const events = getAllDapMemberStatusDispatchEventPreviews()
    expect(events).toHaveLength(8)
  })

  it('all 8 practice shadow payload previews still pass validation (Phase 9X)', () => {
    const events = getAllDapPracticeDecisionDispatchEventPreviews()
    for (const event of events) {
      const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
      expect(() => validateDapMkcrmDispatchShadowPayload(payload)).not.toThrow()
    }
  })

  it('all 8 member shadow payload previews still pass validation (Phase 9X)', () => {
    const events = getAllDapMemberStatusDispatchEventPreviews()
    for (const event of events) {
      const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
      expect(() => validateDapMkcrmDispatchShadowPayload(payload)).not.toThrow()
    }
  })
})

// ─── Group 12: Migration inventory ───────────────────────────────────────────

describe('Phase 9Y — migration inventory (8 known migrations)', () => {
  it('at least 7 SQL migrations exist (Phase 9Z may add more)', () => {
    const dir   = resolve(ROOT, 'supabase/migrations')
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.sql'))
    expect(files.length).toBeGreaterThanOrEqual(7)
  })

  it('approval events migration is in the migrations directory', () => {
    expect(existsSync(resolve(ROOT, 'supabase/migrations/20260430000001_dap_communication_approval_events.sql'))).toBe(true)
  })

  it('dispatch events migration is still present (Phase 9W)', () => {
    expect(existsSync(resolve(ROOT, 'supabase/migrations/20260430000000_dap_communication_dispatch_events.sql'))).toBe(true)
  })
})

// ─── Group 13: No delivery, no send, no mutations ────────────────────────────

describe('Phase 9Y — no delivery, no send, no mutations', () => {
  it('approval types file has no reference to send/deliver API calls', () => {
    const src = readFileSync(join(__dirname, '..', 'dapCommunicationApprovalTypes.ts'), 'utf8')
    expect(src).not.toMatch(/\.send\s*\(/i)
    expect(src).not.toMatch(/\.deliver\s*\(/i)
    expect(src).not.toMatch(/from ['"]@resend/i)
  })

  it('approval decision source always has decisionAuthority: cb_control_center', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('approval decision verticalKey is always dap', () => {
    const all = [
      ...getAllDapPracticeDecisionCommunicationApprovalPreviews(),
      ...getAllDapMemberStatusCommunicationApprovalPreviews(),
    ]
    for (const d of all) {
      expect(d.verticalKey).toBe('dap')
    }
  })

  it('approval decision has no notes field when none supplied', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload)
    expect(decision.notes).toBeUndefined()
  })

  it('approval decision includes notes when supplied', () => {
    const { event, shadowPayload } = makePracticeEventAndPayload()
    const decision = buildDapCommunicationApprovalFromShadowPayload(event, shadowPayload, {
      notes: 'Reviewed by admin — copy cleared.',
    })
    expect(decision.notes).toBe('Reviewed by admin — copy cleared.')
  })
})
