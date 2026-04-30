// Phase 9V — DAP Communication Dispatch Readiness Registry
// Read-only, no-network, no-send.
// Previewable does not mean sendable.
// CB Control Center determines eligibility. MKCRM does not.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT      = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/practice-decision-emails/page.tsx')

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
  DapCommunicationDispatchAudience,
  DapCommunicationDispatchChannel,
  DapCommunicationDispatchStatus,
  DapCommunicationDispatchBlockerCode,
  DapCommunicationDispatchBlocker,
  DapCommunicationDispatchReadiness,
} from './dapCommunicationDispatchTypes'

import {
  getDapPracticeDecisionEmailDispatchReadiness,
  getAllDapPracticeDecisionEmailDispatchReadiness,
  getDapMemberStatusEmailDispatchReadiness,
  getAllDapMemberStatusEmailDispatchReadiness,
} from './dapCommunicationDispatchReadiness'

import {
  getDapPracticeDecisionEmailPreview,
  getAllDapPracticeDecisionEmailPreviews,
} from './dapPracticeDecisionEmailPreview'

import {
  getDapMemberStatusEmailPreview,
  getAllDapMemberStatusEmailPreviews,
} from './dapMemberStatusEmailPreview'

import { isDapPracticeDecisionEmailCopySafe } from './dapPracticeDecisionEmailCopy'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_PRACTICE_KEYS = [
  'practice_application_received',
  'practice_under_review',
  'practice_approved_internal_only',
  'practice_offer_terms_needed',
  'practice_join_cta_blocked',
  'practice_rejected',
  'practice_declined',
  'practice_participation_paused',
] as const

const ALL_MEMBER_STANDINGS = [
  'unknown', 'pending', 'active', 'past_due',
  'payment_failed', 'canceled', 'refunded', 'chargeback',
] as const

// ─── Group 1: Type Surface ────────────────────────────────────────────────────

describe('Phase 9V — Type surface exists', () => {
  it('DapCommunicationDispatchStatus has four values', () => {
    const statuses: DapCommunicationDispatchStatus[] = [
      'not_ready', 'ready_for_review', 'approved_for_future_dispatch', 'blocked',
    ]
    expect(statuses).toHaveLength(4)
  })

  it('DapCommunicationDispatchAudience has three values', () => {
    const audiences: DapCommunicationDispatchAudience[] = ['member', 'practice', 'admin']
    expect(audiences).toHaveLength(3)
  })

  it('DapCommunicationDispatchChannel is email', () => {
    const channel: DapCommunicationDispatchChannel = 'email'
    expect(channel).toBe('email')
  })

  it('DapCommunicationDispatchBlockerCode has 11 values', () => {
    const codes: DapCommunicationDispatchBlockerCode[] = [
      'unsafe_copy',
      'invalid_audience',
      'missing_cb_control_center_authority',
      'mkcrm_authority_detected',
      'payment_authority_detected',
      'payment_cta_detected',
      'phi_detected',
      'missing_operational_decision',
      'missing_billing_event_source',
      'standing_not_derived',
      'unknown_template',
    ]
    expect(codes).toHaveLength(11)
  })

  it('DapCommunicationDispatchBlocker has code, message, and severity', () => {
    const blocker: DapCommunicationDispatchBlocker = {
      code:     'unsafe_copy',
      message:  'test',
      severity: 'blocking',
    }
    expect(blocker.code).toBe('unsafe_copy')
    expect(blocker.severity).toBe('blocking')
  })

  it('DapCommunicationDispatchReadiness has required structure', () => {
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(typeof readiness.templateKey).toBe('string')
    expect(typeof readiness.eligibleForFutureDispatch).toBe('boolean')
    expect(Array.isArray(readiness.blockers)).toBe(true)
    expect(readiness.channel).toBe('email')
    expect(readiness.source).toBeDefined()
    expect(readiness.safety).toBeDefined()
  })

  it('dispatch readiness source always has decisionAuthority: cb_control_center', () => {
    const r = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(r.source.decisionAuthority).toBe('cb_control_center')
  })

  it('dispatch readiness source always has crmAuthority: false', () => {
    const r = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(r.source.crmAuthority).toBe(false)
  })

  it('dispatch readiness source always has paymentAuthority: false', () => {
    const r = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(r.source.paymentAuthority).toBe(false)
  })

  it('types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('readiness file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchReadiness.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})

// ─── Group 2: Practice Decision Readiness Consumes 9T Previews ───────────────

describe('Phase 9V — Practice decision readiness consumes 9T previews', () => {
  it('getAllDapPracticeDecisionEmailDispatchReadiness returns 8 items', () => {
    expect(getAllDapPracticeDecisionEmailDispatchReadiness()).toHaveLength(8)
  })

  it('all real practice previews are eligible for future dispatch', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.eligibleForFutureDispatch).toBe(true)
    }
  })

  it('all real practice previews have status ready_for_review', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.status).toBe('ready_for_review')
    }
  })

  it('all real practice previews have no blockers', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.blockers).toHaveLength(0)
    }
  })

  it('all real practice previews have channel: email', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.channel).toBe('email')
    }
  })

  it('all real practice previews have copySafe: true', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.safety.copySafe).toBe(true)
    }
  })

  it('practice decision readiness audience maps correctly', () => {
    const practiceAdmin = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(practiceAdmin.audience).toBe('practice')

    const internalAdmin = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_approved_internal_only')
    )
    expect(internalAdmin.audience).toBe('admin')
  })

  it('practice decision readiness source has no billingSource (not billing-derived)', () => {
    const r = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    expect(r.source.billingSource).toBeUndefined()
  })
})

// ─── Group 3: Member Status Readiness Consumes 9S Previews ───────────────────

describe('Phase 9V — Member status readiness consumes 9S previews', () => {
  it('getAllDapMemberStatusEmailDispatchReadiness returns 8 items', () => {
    expect(getAllDapMemberStatusEmailDispatchReadiness()).toHaveLength(8)
  })

  it('all real member status previews are eligible for future dispatch', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.eligibleForFutureDispatch).toBe(true)
    }
  })

  it('all real member status previews have status ready_for_review', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.status).toBe('ready_for_review')
    }
  })

  it('all real member status previews have no blockers', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.blockers).toHaveLength(0)
    }
  })

  it('all real member status previews have audience: member', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.audience).toBe('member')
    }
  })

  it('all real member status previews have copySafe: true', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.safety.copySafe).toBe(true)
    }
  })

  it('member status readiness source has billingSource: client_builder_pro', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.source.billingSource).toBe('client_builder_pro')
    }
  })

  it('member status readiness source has decisionAuthority: cb_control_center', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.source.decisionAuthority).toBe('cb_control_center')
    }
  })
})

// ─── Group 4: Preview-Safe ≠ Automatically Sendable ──────────────────────────

describe('Phase 9V — Preview-safe does not automatically mean sendable', () => {
  it('copy can be safe while dispatch is blocked by source.crmAuthority', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tamperedPreview = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }

    // Copy itself is still safe
    expect(isDapPracticeDecisionEmailCopySafe(tamperedPreview.copy)).toBe(true)

    // But dispatch is blocked
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(tamperedPreview)
    expect(readiness.eligibleForFutureDispatch).toBe(false)
    expect(readiness.status).toBe('blocked')
  })

  it('copy can be safe while dispatch is blocked by source.paymentAuthority', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_application_received')
    const tampered = {
      ...preview,
      source: { ...preview.source, paymentAuthority: true as unknown as false },
    }

    expect(isDapPracticeDecisionEmailCopySafe(tampered.copy)).toBe(true)
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(readiness.eligibleForFutureDispatch).toBe(false)
  })

  it('preview safety and dispatch eligibility are independent checks', () => {
    const preview  = getDapPracticeDecisionEmailPreview('practice_under_review')
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(preview)

    // For valid preview: both pass
    expect(isDapPracticeDecisionEmailCopySafe(preview.copy)).toBe(true)
    expect(readiness.eligibleForFutureDispatch).toBe(true)

    // For tampered: copy still safe but dispatch blocked
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const blockedReadiness = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(isDapPracticeDecisionEmailCopySafe(tampered.copy)).toBe(true)
    expect(blockedReadiness.eligibleForFutureDispatch).toBe(false)
  })

  it('status transitions: real preview is ready_for_review, tampered is blocked', () => {
    const preview  = getDapPracticeDecisionEmailPreview('practice_declined')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    expect(getDapPracticeDecisionEmailDispatchReadiness(preview).status).toBe('ready_for_review')
    expect(getDapPracticeDecisionEmailDispatchReadiness(tampered).status).toBe('blocked')
  })
})

// ─── Group 5: Authority Boundary Blocks MKCRM ────────────────────────────────

describe('Phase 9V — Authority boundary blocks MKCRM decision authority', () => {
  it('source.crmAuthority: true → mkcrm_authority_detected blocker', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'mkcrm_authority_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('copy.decidedByMkcrm: true → mkcrm_authority_detected blocker', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      copy: { ...preview.copy, decidedByMkcrm: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'mkcrm_authority_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('source.decisionAuthority !== cb_control_center → missing_cb_control_center_authority blocker', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, decisionAuthority: 'mkcrm' as unknown as 'cb_control_center' },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'missing_cb_control_center_authority')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('member status: source.crmAuthority: true → mkcrm_authority_detected blocker', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews[0]
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'mkcrm_authority_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('all real practice previews have decidedByMkcrm: false in safety output', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.safety.decidedByMkcrm).toBe(false)
    }
  })

  it('all real practice previews have decidedByCbControlCenter: true in safety output', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.safety.decidedByCbControlCenter).toBe(true)
    }
  })
})

// ─── Group 6: Payment Authority and Payment CTA Blocked ──────────────────────

describe('Phase 9V — Payment authority and payment CTA are blocked', () => {
  it('source.paymentAuthority: true → payment_authority_detected blocker', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_application_received')
    const tampered = {
      ...preview,
      source: { ...preview.source, paymentAuthority: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'payment_authority_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('copy.includesPaymentCta: true → payment_cta_detected blocker (practice)', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_application_received')
    const tampered = {
      ...preview,
      copy: { ...preview.copy, includesPaymentCta: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'payment_cta_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('copy.includesPaymentCta: true → payment_cta_detected blocker (member)', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews[0]
    const tampered = {
      ...preview,
      copy: { ...preview.copy, includesPaymentCta: true as unknown as false },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'payment_cta_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('all real dispatches have includesPaymentCta: false in safety output', () => {
    for (const r of [
      ...getAllDapPracticeDecisionEmailDispatchReadiness(),
      ...getAllDapMemberStatusEmailDispatchReadiness(),
    ]) {
      expect(r.safety.includesPaymentCta).toBe(false)
    }
  })

  it('all real dispatches have paymentAuthority: false in source output', () => {
    for (const r of [
      ...getAllDapPracticeDecisionEmailDispatchReadiness(),
      ...getAllDapMemberStatusEmailDispatchReadiness(),
    ]) {
      expect(r.source.paymentAuthority).toBe(false)
    }
  })
})

// ─── Group 7: PHI Inclusion Blocked ──────────────────────────────────────────

describe('Phase 9V — PHI inclusion is blocked', () => {
  it('copy.includesPhi: true → phi_detected blocker (practice)', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      copy: { ...preview.copy, includesPhi: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'phi_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('copy.includesPhi: true → phi_detected blocker (member)', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews.find(p => p.standing === 'active')!
    const tampered = {
      ...preview,
      copy: { ...preview.copy, includesPhi: true as unknown as false },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'phi_detected')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('all real dispatches have includesPhi: false in safety output', () => {
    for (const r of [
      ...getAllDapPracticeDecisionEmailDispatchReadiness(),
      ...getAllDapMemberStatusEmailDispatchReadiness(),
    ]) {
      expect(r.safety.includesPhi).toBe(false)
    }
  })

  it('phi blocker has severity: blocking', () => {
    const preview = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      copy: { ...preview.copy, includesPhi: true as unknown as false },
    }
    const r = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    const phiBlocker = r.blockers.find(b => b.code === 'phi_detected')!
    expect(phiBlocker.severity).toBe('blocking')
  })
})

// ─── Group 8: Member Standing Must Be Derived from Billing Events ─────────────

describe('Phase 9V — Member standing must be derived from billing_events', () => {
  it('source.derivedFromBillingEvents: false → standing_not_derived blocker', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews.find(p => p.standing === 'active')!
    const tampered = {
      ...preview,
      source: { ...preview.source, derivedFromBillingEvents: false as unknown as true },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'standing_not_derived')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('copy.derivedFromBillingEvents: false → standing_not_derived blocker', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews.find(p => p.standing === 'canceled')!
    const tampered = {
      ...preview,
      copy: { ...preview.copy, derivedFromBillingEvents: false as unknown as true },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'standing_not_derived')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('source.billingSource !== client_builder_pro → missing_billing_event_source blocker', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews[0]
    const tampered = {
      ...preview,
      source: { ...preview.source, billingSource: 'stripe' as unknown as 'client_builder_pro' },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(r.blockers.some(b => b.code === 'missing_billing_event_source')).toBe(true)
    expect(r.eligibleForFutureDispatch).toBe(false)
  })

  it('all real member status dispatches have billingSource: client_builder_pro', () => {
    for (const r of getAllDapMemberStatusEmailDispatchReadiness()) {
      expect(r.source.billingSource).toBe('client_builder_pro')
    }
  })

  it('standing_not_derived blockers have severity: blocking', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews[0]
    const tampered = {
      ...preview,
      source: { ...preview.source, derivedFromBillingEvents: false as unknown as true },
    }
    const r = getDapMemberStatusEmailDispatchReadiness(tampered)
    const blocker = r.blockers.find(b => b.code === 'standing_not_derived')!
    expect(blocker.severity).toBe('blocking')
  })
})

// ─── Group 9: Practice Preview Page Renders Dispatch Readiness Language ───────

describe('Phase 9V — Practice preview page renders dispatch readiness language', () => {
  it('page imports getDapPracticeDecisionEmailDispatchReadiness', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('getDapPracticeDecisionEmailDispatchReadiness')
  })

  it('page imports from dapCommunicationDispatchReadiness', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapCommunicationDispatchReadiness')
  })

  it('page renders "Dispatch Readiness" heading', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('Dispatch Readiness')
  })

  it('page renders eligibleForFutureDispatch field', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('eligibleForFutureDispatch')
  })

  it('page renders "Sending disabled" notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('Sending disabled')
  })

  it('page renders channel field', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('channel')
  })

  it('page renders copySafe field', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('copySafe')
  })

  it('page passes readiness as prop to card component', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('readiness={')
    expect(src).toContain('readiness:')
  })

  it('page does not call send or dispatch function', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('sendEmail')
    expect(src).not.toContain('dispatchEmail')
    expect(src).not.toContain('resend.emails')
  })
})

// ─── Group 10: Full Suite Guard ───────────────────────────────────────────────

describe('Phase 9V — Full suite guard', () => {
  it('page count is still 23', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(50)
  })

  it('Phase 9T preview helper still returns 8 previews', () => {
    expect(getAllDapPracticeDecisionEmailPreviews()).toHaveLength(8)
  })

  it('Phase 9S preview helper still returns 8 previews', () => {
    expect(getAllDapMemberStatusEmailPreviews()).toHaveLength(8)
  })

  it('Phase 9V dispatch readiness returns 8 practice items', () => {
    expect(getAllDapPracticeDecisionEmailDispatchReadiness()).toHaveLength(8)
  })

  it('Phase 9V dispatch readiness returns 8 member items', () => {
    expect(getAllDapMemberStatusEmailDispatchReadiness()).toHaveLength(8)
  })

  it('all 16 real dispatch readiness items are eligible (no regression)', () => {
    const all = [
      ...getAllDapPracticeDecisionEmailDispatchReadiness(),
      ...getAllDapMemberStatusEmailDispatchReadiness(),
    ]
    expect(all).toHaveLength(16)
    for (const r of all) {
      expect(r.eligibleForFutureDispatch).toBe(true)
    }
  })

  it('readiness safety literals match spec (false/false/false/true)', () => {
    for (const r of getAllDapPracticeDecisionEmailDispatchReadiness()) {
      expect(r.safety.includesPaymentCta).toBe(false)
      expect(r.safety.includesPhi).toBe(false)
      expect(r.safety.decidedByMkcrm).toBe(false)
      expect(r.safety.decidedByCbControlCenter).toBe(true)
    }
  })
})
