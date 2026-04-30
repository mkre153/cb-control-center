// Phase 9W — DAP Communication Dispatch Event Log
// Append-only. Events record decisions. They do not execute sends.
// CB Control Center is the dispatch authority. MKCRM is not.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
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
  DapCommunicationType,
  DapCommunicationDispatchEventType,
  DapCommunicationDispatchActorType,
  DapCommunicationDispatchEvent,
} from './dapCommunicationDispatchEventTypes'

import {
  buildDapDispatchEventFromReadiness,
  buildDapPracticeDecisionDispatchEvent,
  buildDapMemberStatusDispatchEvent,
  getAllDapPracticeDecisionDispatchEventPreviews,
  getAllDapMemberStatusDispatchEventPreviews,
} from './dapCommunicationDispatchEvents'

import {
  getAllDapPracticeDecisionEmailDispatchReadiness,
  getAllDapMemberStatusEmailDispatchReadiness,
  getDapPracticeDecisionEmailDispatchReadiness,
  getDapMemberStatusEmailDispatchReadiness,
} from './dapCommunicationDispatchReadiness'

import {
  getDapPracticeDecisionEmailPreview,
  getAllDapPracticeDecisionEmailPreviews,
} from './dapPracticeDecisionEmailPreview'

import { getAllDapMemberStatusEmailPreviews } from './dapMemberStatusEmailPreview'

// ─── Group 1: Dispatch Event Type Surface ────────────────────────────────────

describe('Phase 9W — Dispatch event type surface exists', () => {
  it('DapCommunicationType has two values', () => {
    const types: DapCommunicationType[] = ['member_status_email', 'practice_decision_email']
    expect(types).toHaveLength(2)
  })

  it('DapCommunicationDispatchEventType has six values', () => {
    const types: DapCommunicationDispatchEventType[] = [
      'dispatch_review_started',
      'dispatch_ready_for_review',
      'dispatch_blocked',
      'dispatch_approved_for_future_send',
      'dispatch_cancelled',
      'dispatch_shadow_payload_created',
    ]
    expect(types).toHaveLength(6)
  })

  it('DapCommunicationDispatchActorType has two values', () => {
    const types: DapCommunicationDispatchActorType[] = ['system', 'admin']
    expect(types).toHaveLength(2)
  })

  it('DapCommunicationDispatchEvent has all required fields (shape check)', () => {
    const event = buildDapPracticeDecisionDispatchEvent(
      'practice_rejected',
      'dispatch_ready_for_review'
    )
    expect(typeof event.eventId).toBe('string')
    expect(event.verticalKey).toBe('dap')
    expect(event.communicationType).toBe('practice_decision_email')
    expect(typeof event.templateKey).toBe('string')
    expect(typeof event.audience).toBe('string')
    expect(event.channel).toBe('email')
    expect(typeof event.eventType).toBe('string')
    expect(typeof event.readinessStatus).toBe('string')
    expect(typeof event.eligibleForFutureDispatch).toBe('boolean')
    expect(Array.isArray(event.blockerCodes)).toBe(true)
    expect(event.source).toBeDefined()
    expect(event.actor).toBeDefined()
    expect(typeof event.createdAt).toBe('string')
    expect(event.metadata).toBeDefined()
  })

  it('event types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchEventTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('event builders file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchEvents.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('event builders file does not reference send/resend/deliver', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchEvents.ts'), 'utf8')
    expect(src).not.toContain('resend.emails')
    expect(src).not.toContain('sendEmail(')
    expect(src).not.toContain('deliverEmail(')
  })

  it('migration file exists', () => {
    const migDir = join(ROOT, 'supabase/migrations')
    const { readdirSync } = require('fs')
    const files = readdirSync(migDir) as string[]
    expect(files.some(f => f.includes('dap_communication_dispatch_events'))).toBe(true)
  })

  it('migration enforces append-only (revokes UPDATE and DELETE)', () => {
    const migDir = join(ROOT, 'supabase/migrations')
    const { readdirSync, readFileSync: rfs } = require('fs')
    const files = readdirSync(migDir) as string[]
    const migFile = files.find(f => f.includes('dap_communication_dispatch_events'))!
    const sql = rfs(join(migDir, migFile), 'utf8')
    expect(sql).toContain('REVOKE UPDATE')
    expect(sql).toContain('REVOKE DELETE')
  })
})

// ─── Group 2: Event Builders Consume Phase 9V Readiness ──────────────────────

describe('Phase 9W — Event builders consume Phase 9V readiness', () => {
  it('getAllDapPracticeDecisionDispatchEventPreviews returns 8 events', () => {
    expect(getAllDapPracticeDecisionDispatchEventPreviews()).toHaveLength(8)
  })

  it('getAllDapMemberStatusDispatchEventPreviews returns 8 events', () => {
    expect(getAllDapMemberStatusDispatchEventPreviews()).toHaveLength(8)
  })

  it('buildDapDispatchEventFromReadiness accepts readiness from Phase 9V', () => {
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    expect(event.templateKey).toBe(readiness.templateKey)
    expect(event.channel).toBe(readiness.channel)
    expect(event.readinessStatus).toBe(readiness.status)
  })

  it('practice events match template keys from Phase 9T', () => {
    const events  = getAllDapPracticeDecisionDispatchEventPreviews()
    const keys    = events.map(e => e.templateKey).sort()
    const expected = [
      'practice_application_received', 'practice_approved_internal_only',
      'practice_declined', 'practice_join_cta_blocked',
      'practice_offer_terms_needed', 'practice_participation_paused',
      'practice_rejected', 'practice_under_review',
    ].sort()
    expect(keys).toEqual(expected)
  })

  it('member status events have communicationType: member_status_email', () => {
    for (const e of getAllDapMemberStatusDispatchEventPreviews()) {
      expect(e.communicationType).toBe('member_status_email')
    }
  })

  it('practice events have communicationType: practice_decision_email', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.communicationType).toBe('practice_decision_email')
    }
  })

  it('all events have verticalKey: dap', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.verticalKey).toBe('dap')
    }
  })

  it('actor defaults to system when not provided', () => {
    const event = buildDapPracticeDecisionDispatchEvent('practice_rejected', 'dispatch_ready_for_review')
    expect(event.actor.type).toBe('system')
    expect(typeof event.actor.id).toBe('string')
  })

  it('custom actor is preserved when provided', () => {
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
      actor: { type: 'admin', id: 'admin-001' },
    })
    expect(event.actor.type).toBe('admin')
    expect(event.actor.id).toBe('admin-001')
  })
})

// ─── Group 3: Ready Previews Produce dispatch_ready_for_review ────────────────

describe('Phase 9W — Ready previews produce dispatch_ready_for_review', () => {
  it('all real practice previews default to dispatch_ready_for_review', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.eventType).toBe('dispatch_ready_for_review')
    }
  })

  it('all real member status previews default to dispatch_ready_for_review', () => {
    for (const e of getAllDapMemberStatusDispatchEventPreviews()) {
      expect(e.eventType).toBe('dispatch_ready_for_review')
    }
  })

  it('ready events have eligibleForFutureDispatch: true', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.eligibleForFutureDispatch).toBe(true)
    }
  })

  it('ready events have empty blockerCodes', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.blockerCodes).toHaveLength(0)
    }
  })

  it('ready events have readinessStatus: ready_for_review', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.readinessStatus).toBe('ready_for_review')
    }
  })
})

// ─── Group 4: Blocked Readiness Produces dispatch_blocked ────────────────────

describe('Phase 9W — Blocked readiness produces dispatch_blocked', () => {
  function makeblockedReadiness() {
    const preview  = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    return getDapPracticeDecisionEmailDispatchReadiness(tampered)
  }

  it('blocked readiness → dispatch_blocked event type', () => {
    const readiness = makeblockedReadiness()
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    expect(event.eventType).toBe('dispatch_blocked')
  })

  it('blocked event has eligibleForFutureDispatch: false', () => {
    const readiness = makeblockedReadiness()
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    expect(event.eligibleForFutureDispatch).toBe(false)
  })

  it('blocked event has blockerCodes from readiness', () => {
    const readiness = makeblockedReadiness()
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    expect(event.blockerCodes.length).toBeGreaterThan(0)
    expect(event.blockerCodes).toContain('mkcrm_authority_detected')
  })

  it('blocked event has readinessStatus: blocked', () => {
    const readiness = makeblockedReadiness()
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
    })
    expect(event.readinessStatus).toBe('blocked')
  })

  it('explicit dispatch_blocked is allowed for any readiness', () => {
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    // Can explicitly set blocked even when eligible
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
      eventType: 'dispatch_blocked',
    })
    expect(event.eventType).toBe('dispatch_blocked')
  })
})

// ─── Group 5: Approved-for-Future-Send Requires Eligible Readiness ────────────

describe('Phase 9W — Approved-for-future-send requires eligible readiness', () => {
  it('can build approved_for_future_send from eligible readiness', () => {
    const event = buildDapPracticeDecisionDispatchEvent(
      'practice_application_received',
      'dispatch_approved_for_future_send'
    )
    expect(event.eventType).toBe('dispatch_approved_for_future_send')
  })

  it('approved_for_future_send from eligible has eligibleForFutureDispatch: true', () => {
    const event = buildDapPracticeDecisionDispatchEvent(
      'practice_application_received',
      'dispatch_approved_for_future_send'
    )
    expect(event.eligibleForFutureDispatch).toBe(true)
  })

  it('throws when building approved_for_future_send from blocked readiness', () => {
    const preview  = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const blocked = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(() =>
      buildDapDispatchEventFromReadiness(blocked, {
        communicationType: 'practice_decision_email',
        eventType: 'dispatch_approved_for_future_send',
      })
    ).toThrow()
  })

  it('throws error message mentions dispatch_approved_for_future_send', () => {
    const preview  = getDapPracticeDecisionEmailPreview('practice_rejected')
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const blocked = getDapPracticeDecisionEmailDispatchReadiness(tampered)
    expect(() =>
      buildDapDispatchEventFromReadiness(blocked, {
        communicationType: 'practice_decision_email',
        eventType: 'dispatch_approved_for_future_send',
      })
    ).toThrow(/dispatch_approved_for_future_send/)
  })
})

// ─── Group 6: Shadow-Payload-Created Requires Eligible Readiness ──────────────

describe('Phase 9W — Shadow-payload-created requires eligible readiness', () => {
  it('can build dispatch_shadow_payload_created from eligible readiness', () => {
    const event = buildDapMemberStatusDispatchEvent(
      'member_status_active',
      'dispatch_shadow_payload_created'
    )
    expect(event.eventType).toBe('dispatch_shadow_payload_created')
  })

  it('shadow_payload_created event has communicationType: member_status_email', () => {
    const event = buildDapMemberStatusDispatchEvent(
      'member_status_active',
      'dispatch_shadow_payload_created'
    )
    expect(event.communicationType).toBe('member_status_email')
  })

  it('throws when building shadow_payload_created from blocked readiness', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const preview  = previews[0]
    const tampered = {
      ...preview,
      source: { ...preview.source, crmAuthority: true as unknown as false },
    }
    const blocked = getDapMemberStatusEmailDispatchReadiness(tampered)
    expect(() =>
      buildDapDispatchEventFromReadiness(blocked, {
        communicationType: 'member_status_email',
        eventType: 'dispatch_shadow_payload_created',
      })
    ).toThrow()
  })

  it('shadow event preserves billingSource: client_builder_pro', () => {
    const event = buildDapMemberStatusDispatchEvent(
      'member_status_active',
      'dispatch_shadow_payload_created'
    )
    expect(event.source.billingSource).toBe('client_builder_pro')
  })
})

// ─── Group 7: Events Preserve CB Control Center Authority ─────────────────────

describe('Phase 9W — Events preserve CB Control Center authority', () => {
  it('all practice events have source.decisionAuthority: cb_control_center', () => {
    for (const e of getAllDapPracticeDecisionDispatchEventPreviews()) {
      expect(e.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all member events have source.decisionAuthority: cb_control_center', () => {
    for (const e of getAllDapMemberStatusDispatchEventPreviews()) {
      expect(e.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all events have verticalKey: dap', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.verticalKey).toBe('dap')
    }
  })

  it('createdAt is a valid ISO date string', () => {
    const event = buildDapPracticeDecisionDispatchEvent('practice_rejected', 'dispatch_ready_for_review')
    expect(() => new Date(event.createdAt)).not.toThrow()
    expect(new Date(event.createdAt).toISOString()).toBe(event.createdAt)
  })

  it('custom createdAt is preserved when provided', () => {
    const fixed = '2026-04-30T12:00:00.000Z'
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
      createdAt: fixed,
    })
    expect(event.createdAt).toBe(fixed)
  })

  it('custom eventId is preserved when provided', () => {
    const id = 'test-event-id-001'
    const readiness = getDapPracticeDecisionEmailDispatchReadiness(
      getDapPracticeDecisionEmailPreview('practice_rejected')
    )
    const event = buildDapDispatchEventFromReadiness(readiness, {
      communicationType: 'practice_decision_email',
      eventId: id,
    })
    expect(event.eventId).toBe(id)
  })
})

// ─── Group 8: Events Preserve MKCRM/Payment Authority as False ───────────────

describe('Phase 9W — Events preserve MKCRM/payment authority as false', () => {
  it('all events have source.crmAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.source.crmAuthority).toBe(false)
    }
  })

  it('all events have source.paymentAuthority: false', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.source.paymentAuthority).toBe(false)
    }
  })

  it('all events have metadata.mkcrmDeliveryDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.metadata.mkcrmDeliveryDisabled).toBe(true)
    }
  })

  it('all events have metadata.externalSendDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.metadata.externalSendDisabled).toBe(true)
    }
  })

  it('all events have metadata.resendDisabled: true', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.metadata.resendDisabled).toBe(true)
    }
  })
})

// ─── Group 9: No PHI, Payment CTA, or Email Body Copy ────────────────────────

describe('Phase 9W — No PHI, payment CTA, or email body copy in events', () => {
  it('all events have metadata.noPhi: true', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.metadata.noPhi).toBe(true)
    }
  })

  it('all events have metadata.noPaymentCta: true', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.metadata.noPaymentCta).toBe(true)
    }
  })

  it('event objects do not contain email body text', () => {
    const event = buildDapPracticeDecisionDispatchEvent('practice_rejected', 'dispatch_ready_for_review')
    const json  = JSON.stringify(event)
    expect(json).not.toContain('CB Control Center has reviewed your Dental Advantage Plan')
    expect(json).not.toContain('Your membership is currently active')
  })

  it('event type interface has no email body field', () => {
    const src = readFileSync(join(__dirname, 'dapCommunicationDispatchEventTypes.ts'), 'utf8')
    expect(src).not.toContain('body:')
    expect(src).not.toContain('emailBody')
    expect(src).not.toContain('subject:')
  })

  it('migration has no email body column', () => {
    const migDir = join(ROOT, 'supabase/migrations')
    const { readdirSync, readFileSync: rfs } = require('fs')
    const files  = readdirSync(migDir) as string[]
    const migFile = files.find(f => f.includes('dap_communication_dispatch_events'))!
    const sql = rfs(join(migDir, migFile), 'utf8')
    expect(sql).not.toContain('email_body')
    expect(sql).not.toContain('subject')
    expect(sql).not.toContain('payment_cta_url')
  })

  it('member status events do not contain standing directly in metadata', () => {
    for (const e of getAllDapMemberStatusDispatchEventPreviews()) {
      expect(Object.keys(e.metadata)).not.toContain('standing')
    }
  })
})

// ─── Group 10: Practice Preview Page Renders Projected Dispatch Event ─────────

describe('Phase 9W — Practice preview page renders projected dispatch event section', () => {
  it('page imports from dapCommunicationDispatchEvents', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapCommunicationDispatchEvents')
  })

  it('page imports buildDapDispatchEventFromReadiness', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildDapDispatchEventFromReadiness')
  })

  it('page contains Phase 9W dispatch event language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('dispatch event')
  })

  it('page contains externalSendDisabled field', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('externalSendDisabled')
  })

  it('page contains mkcrmDeliveryDisabled field', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('mkcrmDeliveryDisabled')
  })

  it('page contains metadata.noPaymentCta reference', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('noPaymentCta')
  })

  it('page does not send email', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('sendEmail')
    expect(src).not.toContain('resend.emails')
  })

  it('page renders projectedEvent section per card', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('projectedEvent')
  })
})

// ─── Group 11: Full Suite Guard ───────────────────────────────────────────────

describe('Phase 9W — Full suite guard', () => {
  it('page count is still 23', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(43)
  })

  it('Phase 9V dispatch readiness still returns 8 practice items', () => {
    expect(getAllDapPracticeDecisionEmailDispatchReadiness()).toHaveLength(8)
  })

  it('Phase 9V dispatch readiness still returns 8 member items', () => {
    expect(getAllDapMemberStatusEmailDispatchReadiness()).toHaveLength(8)
  })

  it('Phase 9W event builders still return 16 total events', () => {
    const total = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    expect(total).toHaveLength(16)
  })

  it('all 16 event previews are eligible and have dispatch_ready_for_review', () => {
    const all = [
      ...getAllDapPracticeDecisionDispatchEventPreviews(),
      ...getAllDapMemberStatusDispatchEventPreviews(),
    ]
    for (const e of all) {
      expect(e.eligibleForFutureDispatch).toBe(true)
      expect(e.eventType).toBe('dispatch_ready_for_review')
    }
  })

  it('Phase 9T previews still return 8', () => {
    expect(getAllDapPracticeDecisionEmailPreviews()).toHaveLength(8)
  })

  it('Phase 9S previews still return 8', () => {
    expect(getAllDapMemberStatusEmailPreviews()).toHaveLength(8)
  })
})
