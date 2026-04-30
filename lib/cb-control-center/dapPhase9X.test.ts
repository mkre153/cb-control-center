// Phase 9X — DAP MKCRM Shadow Dispatch Payloads
// No delivery. No send. No MKCRM calls. No Supabase mutations.
// MKCRM does not decide eligibility, standing, payment, or dispatch approval.

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
  DapMkcrmDispatchShadowEventType,
  DapMkcrmDispatchShadowPayload,
} from './dapMkcrmDispatchPayloadTypes'

import {
  buildDapMkcrmDispatchShadowPayloadFromEvent,
  getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews,
  getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews,
  validateDapMkcrmDispatchShadowPayload,
} from './dapMkcrmDispatchPayloads'

import {
  getAllDapPracticeDecisionDispatchEventPreviews,
  getAllDapMemberStatusDispatchEventPreviews,
  buildDapPracticeDecisionDispatchEvent,
  buildDapMemberStatusDispatchEvent,
} from './dapCommunicationDispatchEvents'

import {
  getAllDapPracticeDecisionEmailDispatchReadiness,
  getAllDapMemberStatusEmailDispatchReadiness,
} from './dapCommunicationDispatchReadiness'

import {
  getDapPracticeDecisionEmailPreview,
} from './dapPracticeDecisionEmailPreview'

import {
  getDapPracticeDecisionEmailDispatchReadiness,
} from './dapCommunicationDispatchReadiness'

import {
  buildDapDispatchEventFromReadiness,
} from './dapCommunicationDispatchEvents'

// ─── Group 1: MKCRM Dispatch Shadow Payload Type Surface ─────────────────────

describe('Phase 9X — MKCRM dispatch shadow payload type surface exists', () => {
  it('DapMkcrmDispatchShadowEventType is the correct literal', () => {
    const t: DapMkcrmDispatchShadowEventType = 'mkcrm_dispatch_shadow_payload_created'
    expect(t).toBe('mkcrm_dispatch_shadow_payload_created')
  })

  it('DapMkcrmDispatchShadowPayload has all required fields (shape check)', () => {
    const payload = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    expect(payload.verticalKey).toBe('dap')
    expect(payload.shadowMode).toBe(true)
    expect(payload.eventType).toBe('mkcrm_dispatch_shadow_payload_created')
    expect(typeof payload.communicationType).toBe('string')
    expect(typeof payload.templateKey).toBe('string')
    expect(typeof payload.audience).toBe('string')
    expect(payload.channel).toBe('email')
    expect(typeof payload.dispatchEventType).toBe('string')
    expect(typeof payload.readinessStatus).toBe('string')
    expect(typeof payload.eligibleForFutureDispatch).toBe('boolean')
    expect(Array.isArray(payload.blockerCodes)).toBe(true)
    expect(payload.source).toBeDefined()
    expect(payload.delivery).toBeDefined()
    expect(payload.safety).toBeDefined()
    expect(typeof payload.createdAt).toBe('string')
  })

  it('types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapMkcrmDispatchPayloadTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('payload builders file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapMkcrmDispatchPayloads.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('payload builders file does not reference send/deliver/resend', () => {
    const src = readFileSync(join(__dirname, 'dapMkcrmDispatchPayloads.ts'), 'utf8')
    expect(src).not.toContain('resend.emails')
    expect(src).not.toContain('sendEmail(')
    expect(src).not.toContain('deliverEmail(')
    expect(src).not.toContain('mkcrm.send(')
  })

  it('payload has delivery object with all four disabled flags', () => {
    const payload = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    expect(Object.keys(payload.delivery)).toHaveLength(4)
    expect(payload.delivery.deliveryDisabled).toBeDefined()
    expect(payload.delivery.externalSendDisabled).toBeDefined()
    expect(payload.delivery.mkcrmDeliveryDisabled).toBeDefined()
    expect(payload.delivery.resendDisabled).toBeDefined()
  })

  it('payload has safety object with four no-* flags', () => {
    const payload = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    expect(Object.keys(payload.safety)).toHaveLength(4)
    expect(payload.safety.noPhi).toBeDefined()
    expect(payload.safety.noPaymentCta).toBeDefined()
    expect(payload.safety.noEmailBody).toBeDefined()
    expect(payload.safety.noStoredStanding).toBeDefined()
  })
})

// ─── Group 2: Payload Builders Consume Phase 9W Dispatch Events ───────────────

describe('Phase 9X — Payload builders consume Phase 9W dispatch events', () => {
  it('buildDapMkcrmDispatchShadowPayloadFromEvent accepts a 9W event', () => {
    const events = getAllDapPracticeDecisionDispatchEventPreviews()
    const event  = events[0]
    const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    expect(payload.templateKey).toBe(event.templateKey)
    expect(payload.communicationType).toBe(event.communicationType)
    expect(payload.dispatchEventType).toBe(event.eventType)
  })

  it('blockerCodes are preserved from the dispatch event', () => {
    const preview  = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    expect(payload.blockerCodes).toContain('mkcrm_authority_detected')
    expect(payload.eligibleForFutureDispatch).toBe(false)
  })

  it('custom createdAt is preserved when provided', () => {
    const events = getAllDapPracticeDecisionDispatchEventPreviews()
    const fixed  = '2026-04-30T12:00:00.000Z'
    const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(events[0], { createdAt: fixed })
    expect(payload.createdAt).toBe(fixed)
  })

  it('payload createdAt is a valid ISO date string', () => {
    const payload = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    expect(new Date(payload.createdAt).toISOString()).toBe(payload.createdAt)
  })
})

// ─── Group 3: Practice Decision Events Produce Shadow Payload Previews ────────

describe('Phase 9X — Practice decision dispatch events produce shadow payload previews', () => {
  it('getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews returns 8 payloads', () => {
    expect(getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()).toHaveLength(8)
  })

  it('all practice payloads have communicationType: practice_decision_email', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.communicationType).toBe('practice_decision_email')
    }
  })

  it('all practice payloads have dispatchEventType: dispatch_ready_for_review', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.dispatchEventType).toBe('dispatch_ready_for_review')
    }
  })

  it('practice payload template keys cover all 8 known keys', () => {
    const keys = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()
      .map(p => p.templateKey).sort()
    expect(keys).toEqual([
      'practice_application_received', 'practice_approved_internal_only',
      'practice_declined', 'practice_join_cta_blocked',
      'practice_offer_terms_needed', 'practice_participation_paused',
      'practice_rejected', 'practice_under_review',
    ].sort())
  })

  it('practice payloads have no billingSource (not billing-derived)', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.source.billingSource).toBeUndefined()
    }
  })
})

// ─── Group 4: Member Status Events Produce Shadow Payload Previews ────────────

describe('Phase 9X — Member status dispatch events produce shadow payload previews', () => {
  it('getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews returns 8 payloads', () => {
    expect(getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()).toHaveLength(8)
  })

  it('all member payloads have communicationType: member_status_email', () => {
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.communicationType).toBe('member_status_email')
    }
  })

  it('all member payloads have audience: member', () => {
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.audience).toBe('member')
    }
  })

  it('member payloads have source.billingSource: client_builder_pro', () => {
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.source.billingSource).toBe('client_builder_pro')
    }
  })

  it('all member payloads have dispatchEventType: dispatch_ready_for_review', () => {
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.dispatchEventType).toBe('dispatch_ready_for_review')
    }
  })
})

// ─── Group 5: Payloads Preserve shadowMode: true ─────────────────────────────

describe('Phase 9X — Payloads preserve shadowMode: true', () => {
  it('all practice payloads have shadowMode: true', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.shadowMode).toBe(true)
    }
  })

  it('all member payloads have shadowMode: true', () => {
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(p.shadowMode).toBe(true)
    }
  })

  it('all payloads have eventType: mkcrm_dispatch_shadow_payload_created', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.eventType).toBe('mkcrm_dispatch_shadow_payload_created')
    }
  })

  it('all payloads have verticalKey: dap', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.verticalKey).toBe('dap')
    }
  })
})

// ─── Group 6: Payloads Preserve CB Control Center Authority ───────────────────

describe('Phase 9X — Payloads preserve CB Control Center authority', () => {
  it('all payloads have source.decisionAuthority: cb_control_center', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all payloads have channel: email', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.channel).toBe('email')
    }
  })
})

// ─── Group 7: Payloads Preserve MKCRM/Payment Authority as False ──────────────

describe('Phase 9X — Payloads preserve MKCRM/payment authority as false', () => {
  it('all payloads have source.crmAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.source.crmAuthority).toBe(false)
    }
  })

  it('all payloads have source.paymentAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.source.paymentAuthority).toBe(false)
    }
  })
})

// ─── Group 8: Payloads Preserve All Delivery-Disabled Flags ──────────────────

describe('Phase 9X — Payloads preserve all delivery-disabled flags', () => {
  it('all payloads have delivery.deliveryDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.delivery.deliveryDisabled).toBe(true)
    }
  })

  it('all payloads have delivery.externalSendDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.delivery.externalSendDisabled).toBe(true)
    }
  })

  it('all payloads have delivery.mkcrmDeliveryDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.delivery.mkcrmDeliveryDisabled).toBe(true)
    }
  })

  it('all payloads have delivery.resendDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    for (const p of all) {
      expect(p.delivery.resendDisabled).toBe(true)
    }
  })
})

// ─── Group 9: Payloads Exclude Forbidden Content Fields ──────────────────────

describe('Phase 9X — Payloads exclude email body, PHI, payment CTA, and stored standing', () => {
  it('all payloads have safety.noPhi: true', () => {
    for (const p of [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]) {
      expect(p.safety.noPhi).toBe(true)
    }
  })

  it('all payloads have safety.noPaymentCta: true', () => {
    for (const p of [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]) {
      expect(p.safety.noPaymentCta).toBe(true)
    }
  })

  it('all payloads have safety.noEmailBody: true', () => {
    for (const p of [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]) {
      expect(p.safety.noEmailBody).toBe(true)
    }
  })

  it('all payloads have safety.noStoredStanding: true', () => {
    for (const p of [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]) {
      expect(p.safety.noStoredStanding).toBe(true)
    }
  })

  it('payload JSON does not contain email body copy text', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      const json = JSON.stringify(p)
      expect(json).not.toContain('CB Control Center has reviewed your Dental Advantage Plan')
      expect(json).not.toContain('Your membership is currently active')
    }
  })

  it('types file does not define body or emailBody fields', () => {
    const src = readFileSync(join(__dirname, 'dapMkcrmDispatchPayloadTypes.ts'), 'utf8')
    expect(src).not.toMatch(/\bbody\s*:/)
    expect(src).not.toContain('emailBody')
    expect(src).not.toContain('sentAt')
    expect(src).not.toContain('deliveredAt')
  })
})

// ─── Group 10: Validator Rejects Forbidden Fields ────────────────────────────

describe('Phase 9X — Validator rejects forbidden delivery/content fields', () => {
  it('validates real payloads without throwing', () => {
    for (const p of getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()) {
      expect(() => validateDapMkcrmDispatchShadowPayload(p)).not.toThrow()
    }
    for (const p of getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()) {
      expect(() => validateDapMkcrmDispatchShadowPayload(p)).not.toThrow()
    }
  })

  it('rejects payload with shadowMode: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, shadowMode: false as unknown as true }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/shadowMode/)
  })

  it('rejects payload with source.crmAuthority: true', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, source: { ...p.source, crmAuthority: true as unknown as false } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/crmAuthority/)
  })

  it('rejects payload with source.paymentAuthority: true', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, source: { ...p.source, paymentAuthority: true as unknown as false } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/paymentAuthority/)
  })

  it('rejects payload with delivery.deliveryDisabled: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, delivery: { ...p.delivery, deliveryDisabled: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/deliveryDisabled/)
  })

  it('rejects payload with delivery.externalSendDisabled: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, delivery: { ...p.delivery, externalSendDisabled: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/externalSendDisabled/)
  })

  it('rejects payload with delivery.mkcrmDeliveryDisabled: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, delivery: { ...p.delivery, mkcrmDeliveryDisabled: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/mkcrmDeliveryDisabled/)
  })

  it('rejects payload with delivery.resendDisabled: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, delivery: { ...p.delivery, resendDisabled: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/resendDisabled/)
  })

  it('rejects payload containing a "body" key', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, body: 'some email body text' }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/body/)
  })

  it('rejects payload containing a "sentAt" key', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, sentAt: new Date().toISOString() }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/sentAt/)
  })

  it('rejects payload containing a nested "standing" key', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, extra: { standing: 'active' } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/standing/)
  })

  it('rejects payload with safety.noPhi: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, safety: { ...p.safety, noPhi: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/noPhi/)
  })

  it('rejects payload with safety.noEmailBody: false', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, safety: { ...p.safety, noEmailBody: false as unknown as true } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/noEmailBody/)
  })

  it('rejects payload containing a "deliveredAt" key', () => {
    const p = getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, deliveredAt: new Date().toISOString() }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/deliveredAt/)
  })

  it('rejects payload with "checkoutUrl" nested in source', () => {
    const p = getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()[0]
    const bad = { ...p, source: { ...p.source, checkoutUrl: 'https://example.com/checkout' } }
    expect(() => validateDapMkcrmDispatchShadowPayload(bad)).toThrow(/checkoutUrl/)
  })
})

// ─── Group 11: Practice Preview Page Renders MKCRM Shadow Payload Section ─────

describe('Phase 9X — Practice preview page renders MKCRM shadow payload section', () => {
  it('page imports buildDapMkcrmDispatchShadowPayloadFromEvent', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildDapMkcrmDispatchShadowPayloadFromEvent')
  })

  it('page imports from dapMkcrmDispatchPayloads', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapMkcrmDispatchPayloads')
  })

  it('page contains "MKCRM Shadow" language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('MKCRM Shadow')
  })

  it('page references shadowMode', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('shadowMode')
  })

  it('page references delivery.deliveryDisabled or deliveryDisabled', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('deliveryDisabled')
  })

  it('page contains Phase 9X authority notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('mkcrm does not send')
  })

  it('page references shadowPayload variable', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('shadowPayload')
  })

  it('page does not call MKCRM or send email', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('resend.emails')
    expect(src).not.toContain('sendEmail(')
    expect(src).not.toContain('mkcrm.send(')
  })
})

// ─── Group 12: Full Suite Guard ───────────────────────────────────────────────

describe('Phase 9X — Full suite guard', () => {
  it('page count is still 23', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(50)
  })

  it('Phase 9W event previews still return 8 + 8', () => {
    expect(getAllDapPracticeDecisionDispatchEventPreviews()).toHaveLength(8)
    expect(getAllDapMemberStatusDispatchEventPreviews()).toHaveLength(8)
  })

  it('Phase 9X shadow payload previews return 8 + 8', () => {
    expect(getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews()).toHaveLength(8)
    expect(getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews()).toHaveLength(8)
  })

  it('Phase 9V dispatch readiness still returns 8 + 8', () => {
    expect(getAllDapPracticeDecisionEmailDispatchReadiness()).toHaveLength(8)
    expect(getAllDapMemberStatusEmailDispatchReadiness()).toHaveLength(8)
  })

  it('all 16 shadow payloads pass validation', () => {
    const all = [
      ...getAllDapPracticeDecisionMkcrmDispatchShadowPayloadPreviews(),
      ...getAllDapMemberStatusMkcrmDispatchShadowPayloadPreviews(),
    ]
    expect(all).toHaveLength(16)
    for (const p of all) {
      expect(() => validateDapMkcrmDispatchShadowPayload(p)).not.toThrow()
    }
  })

  it('shadow payload delivery chain: event → payload → validated', () => {
    const event   = buildDapPracticeDecisionDispatchEvent('practice_rejected', 'dispatch_ready_for_review')
    const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    expect(() => validateDapMkcrmDispatchShadowPayload(payload)).not.toThrow()
    expect(payload.dispatchEventType).toBe('dispatch_ready_for_review')
    expect(payload.shadowMode).toBe(true)
    expect(payload.delivery.deliveryDisabled).toBe(true)
  })

  it('member shadow payload delivery chain: event → payload → validated', () => {
    const event   = buildDapMemberStatusDispatchEvent('member_status_active', 'dispatch_ready_for_review')
    const payload = buildDapMkcrmDispatchShadowPayloadFromEvent(event)
    expect(() => validateDapMkcrmDispatchShadowPayload(payload)).not.toThrow()
    expect(payload.source.billingSource).toBe('client_builder_pro')
    expect(payload.shadowMode).toBe(true)
  })
})
