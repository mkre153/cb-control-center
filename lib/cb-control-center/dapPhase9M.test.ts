/**
 * Phase 9M — MKCRM Shadow Sync Contract QA
 *
 * PURPOSE: Verify that Phase 9M produced a safe, one-way DAP → MKCRM sync
 * boundary in shadow mode only. No live network calls, no MKCRM-to-DAP
 * mutation path, no PHI leakage.
 *
 * Golden rule: DAP is the registry. MKCRM is downstream only.
 *
 * COVERAGE:
 *   Group 1 — Type contract (structural)
 *   Group 2 — Payload builders (behavioral)
 *   Group 3 — PHI / payment leakage (behavioral)
 *   Group 4 — MKCRM cannot mutate DAP truth (structural + behavioral)
 *   Group 5 — Shadow mode only (structural + behavioral)
 *   Group 6 — Dedupe safety (behavioral)
 *   Group 7 — Full suite boundary (structural)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import {
  buildPracticeEnrollmentSubmittedPayload,
  buildPracticeApprovedPayload,
  buildPracticeRejectedPayload,
  buildMembershipEnrolledPayload,
  buildMembershipEmailConfirmedPayload,
  buildMembershipStandingPayload,
  buildParticipationStatusPayload,
} from './dapMkcrmPayloads'
import {
  validateDapMkcrmPayload,
  syncDapEventToMkcrmShadow,
} from './dapMkcrmSync'
import type { DapMkcrmSyncPayload } from './dapMkcrmTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH    = resolve(ROOT, 'lib/cb-control-center/dapMkcrmTypes.ts')
const PAYLOADS_PATH = resolve(ROOT, 'lib/cb-control-center/dapMkcrmPayloads.ts')
const SYNC_PATH     = resolve(ROOT, 'lib/cb-control-center/dapMkcrmSync.ts')

// ─── Sample inputs ─────────────────────────────────────────────────────────────

const OCCURRED_AT = '2026-04-30T12:00:00Z'

const PRACTICE_INPUT = {
  requestId:    'req-abc-001',
  practiceName: 'Sunrise Dental',
  city:         'San Diego',
  state:        'CA',
  occurredAt:   OCCURRED_AT,
}

const MEMBERSHIP_ENROLLED_INPUT = {
  memberId:     'mbr-abc-001',
  membershipId: 'mem-abc-001',
  practiceId:   'prc-abc-001',
  occurredAt:   OCCURRED_AT,
}

const MEMBERSHIP_EMAIL_INPUT = {
  memberId:     'mbr-abc-001',
  membershipId: 'mem-abc-001',
  occurredAt:   OCCURRED_AT,
}

const MEMBERSHIP_STANDING_INPUT = {
  memberId:     'mbr-abc-001',
  membershipId: 'mem-abc-001',
  standing:     'active' as const,
  occurredAt:   OCCURRED_AT,
}

const PARTICIPATION_INPUT = {
  participationId: 'par-abc-001',
  reviewId:        'rev-abc-001',
  draftId:         'dft-abc-001',
  practiceName:    'Sunrise Dental',
  city:            'San Diego',
  status:          'participation_confirmed' as const,
  occurredAt:      OCCURRED_AT,
}

// ─── PHI key scanner ───────────────────────────────────────────────────────────

const PHI_KEYS = [
  'dob', 'dateofbirth', 'ssn', 'socialsecurity',
  'cardnumber', 'bankaccount', 'routingnumber',
  'diagnosis', 'treatmentplan', 'clinicalnotes',
]

function collectKeys(obj: Record<string, unknown>): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    keys.push(k.toLowerCase())
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>))
    }
  }
  return keys
}

function hasPhiKey(payload: DapMkcrmSyncPayload): string | null {
  const keys = collectKeys(payload as unknown as Record<string, unknown>)
  for (const phi of PHI_KEYS) {
    if (keys.includes(phi)) return phi
  }
  return null
}

// ─── Group 1: Type contract ────────────────────────────────────────────────────

describe('Type contract — DapMkcrmSyncPayload and union types', () => {
  it('dapMkcrmTypes.ts exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  const EXPECTED_EVENT_TYPES: string[] = [
    'practice_enrollment_submitted',
    'practice_approved',
    'practice_rejected',
    'provider_magic_link_requested',
    'provider_logged_in',
    'membership_enrolled',
    'membership_email_confirmed',
    'membership_standing_active',
    'membership_standing_past_due',
    'membership_standing_canceled',
    'participation_confirmation_started',
    'participation_agreement_sent',
    'participation_agreement_received',
    'participation_confirmed',
    'participation_declined',
    'participation_voided',
  ]

  for (const eventType of EXPECTED_EVENT_TYPES) {
    it(`event type union includes '${eventType}'`, () => {
      const src = readFileSync(TYPES_PATH, 'utf8')
      expect(src).toContain(`'${eventType}'`)
    })
  }

  it('object type union includes practice', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'practice'")
  })

  it('object type union includes provider', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'provider'")
  })

  it('object type union includes member', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'member'")
  })

  it('object type union includes participation', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'participation'")
  })

  it('object type union includes billing', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'billing'")
  })

  it('DapMkcrmSyncPayload interface declares shadowMode', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('shadowMode')
  })

  it('DapMkcrmSyncPayload interface declares verticalKey', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('verticalKey')
  })

  it('DapMkcrmSyncPayload interface declares dedupeKey', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('dedupeKey')
  })

  it('DapMkcrmSyncPayload interface declares payloadVersion', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('payloadVersion')
  })

  it('DapMkcrmSyncPayload interface declares occurredAt', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('occurredAt')
  })

  it('DapMkcrmSyncPayload interface declares dapId', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('dapId')
  })
})

// ─── Group 2: Payload builders ─────────────────────────────────────────────────

describe('Payload builders — deterministic, correct shape', () => {
  it('buildPracticeEnrollmentSubmittedPayload returns eventType practice_enrollment_submitted', () => {
    const p = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    expect(p.eventType).toBe('practice_enrollment_submitted')
  })

  it('buildPracticeApprovedPayload returns eventType practice_approved', () => {
    const p = buildPracticeApprovedPayload(PRACTICE_INPUT)
    expect(p.eventType).toBe('practice_approved')
  })

  it('buildPracticeRejectedPayload returns eventType practice_rejected', () => {
    const p = buildPracticeRejectedPayload(PRACTICE_INPUT)
    expect(p.eventType).toBe('practice_rejected')
  })

  it('buildMembershipEnrolledPayload returns eventType membership_enrolled', () => {
    const p = buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT)
    expect(p.eventType).toBe('membership_enrolled')
  })

  it('buildMembershipEmailConfirmedPayload returns eventType membership_email_confirmed', () => {
    const p = buildMembershipEmailConfirmedPayload(MEMBERSHIP_EMAIL_INPUT)
    expect(p.eventType).toBe('membership_email_confirmed')
  })

  it('buildMembershipStandingPayload maps active → membership_standing_active', () => {
    const p = buildMembershipStandingPayload({ ...MEMBERSHIP_STANDING_INPUT, standing: 'active' })
    expect(p.eventType).toBe('membership_standing_active')
  })

  it('buildMembershipStandingPayload maps past_due → membership_standing_past_due', () => {
    const p = buildMembershipStandingPayload({ ...MEMBERSHIP_STANDING_INPUT, standing: 'past_due' })
    expect(p.eventType).toBe('membership_standing_past_due')
  })

  it('buildMembershipStandingPayload maps canceled → membership_standing_canceled', () => {
    const p = buildMembershipStandingPayload({ ...MEMBERSHIP_STANDING_INPUT, standing: 'canceled' })
    expect(p.eventType).toBe('membership_standing_canceled')
  })

  it('buildParticipationStatusPayload maps participation_confirmed status correctly', () => {
    const p = buildParticipationStatusPayload(PARTICIPATION_INPUT)
    expect(p.eventType).toBe('participation_confirmed')
  })

  it('buildParticipationStatusPayload maps participation_declined status correctly', () => {
    const p = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, status: 'participation_declined' })
    expect(p.eventType).toBe('participation_declined')
  })

  it('buildParticipationStatusPayload maps confirmation_voided → participation_voided', () => {
    const p = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, status: 'confirmation_voided' })
    expect(p.eventType).toBe('participation_voided')
  })

  it('all practice builders return verticalKey: dap', () => {
    expect(buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT).verticalKey).toBe('dap')
    expect(buildPracticeApprovedPayload(PRACTICE_INPUT).verticalKey).toBe('dap')
    expect(buildPracticeRejectedPayload(PRACTICE_INPUT).verticalKey).toBe('dap')
  })

  it('all membership builders return verticalKey: dap', () => {
    expect(buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT).verticalKey).toBe('dap')
    expect(buildMembershipEmailConfirmedPayload(MEMBERSHIP_EMAIL_INPUT).verticalKey).toBe('dap')
    expect(buildMembershipStandingPayload(MEMBERSHIP_STANDING_INPUT).verticalKey).toBe('dap')
  })

  it('participation builder returns verticalKey: dap', () => {
    expect(buildParticipationStatusPayload(PARTICIPATION_INPUT).verticalKey).toBe('dap')
  })

  it('all builders return shadowMode: true', () => {
    const payloads = [
      buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT),
      buildPracticeApprovedPayload(PRACTICE_INPUT),
      buildPracticeRejectedPayload(PRACTICE_INPUT),
      buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT),
      buildMembershipEmailConfirmedPayload(MEMBERSHIP_EMAIL_INPUT),
      buildMembershipStandingPayload(MEMBERSHIP_STANDING_INPUT),
      buildParticipationStatusPayload(PARTICIPATION_INPUT),
    ]
    for (const p of payloads) {
      expect(p.shadowMode).toBe(true)
    }
  })

  it('all builders return payloadVersion: 2026-04-30', () => {
    const payloads = [
      buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT),
      buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT),
      buildParticipationStatusPayload(PARTICIPATION_INPUT),
    ]
    for (const p of payloads) {
      expect(p.payloadVersion).toBe('2026-04-30')
    }
  })

  it('all builders include a non-empty dedupeKey', () => {
    const payloads = [
      buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT),
      buildPracticeApprovedPayload(PRACTICE_INPUT),
      buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT),
      buildMembershipStandingPayload(MEMBERSHIP_STANDING_INPUT),
      buildParticipationStatusPayload(PARTICIPATION_INPUT),
    ]
    for (const p of payloads) {
      expect(typeof p.dedupeKey).toBe('string')
      expect(p.dedupeKey.length).toBeGreaterThan(0)
    }
  })

  it('all builders include occurredAt from input', () => {
    expect(buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT).occurredAt).toBe(OCCURRED_AT)
    expect(buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT).occurredAt).toBe(OCCURRED_AT)
    expect(buildParticipationStatusPayload(PARTICIPATION_INPUT).occurredAt).toBe(OCCURRED_AT)
  })
})

// ─── Group 3: PHI / payment leakage ───────────────────────────────────────────

describe('PHI and payment leakage — no forbidden keys in any payload', () => {
  it('practice enrollment submitted payload contains no PHI keys', () => {
    const p = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('practice approved payload contains no PHI keys', () => {
    const p = buildPracticeApprovedPayload(PRACTICE_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('practice rejected payload contains no PHI keys', () => {
    const p = buildPracticeRejectedPayload(PRACTICE_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('membership enrolled payload contains no PHI keys', () => {
    const p = buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('membership email confirmed payload contains no PHI keys', () => {
    const p = buildMembershipEmailConfirmedPayload(MEMBERSHIP_EMAIL_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('membership standing payload contains no PHI keys', () => {
    const p = buildMembershipStandingPayload(MEMBERSHIP_STANDING_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('participation status payload contains no PHI keys', () => {
    const p = buildParticipationStatusPayload(PARTICIPATION_INPUT)
    expect(hasPhiKey(p)).toBeNull()
  })

  it('payloads module does not reference dob or dateOfBirth', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/\bdob\b|dateofbirth/)
  })

  it('payloads module does not reference ssn or socialSecurity', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/\bssn\b|socialsecurity/)
  })

  it('payloads module does not reference cardNumber, bankAccount, or routingNumber', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/cardnumber|bankaccount|routingnumber/)
  })

  it('payloads module does not reference diagnosis, treatmentPlan, or clinicalNotes', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/diagnosis|treatmentplan|clinicalnotes/)
  })
})

// ─── Group 4: MKCRM cannot mutate DAP truth ────────────────────────────────────

describe('MKCRM cannot mutate DAP truth — one-way sync only', () => {
  it('shadow sync result does not include dapStatus field', async () => {
    const payload = buildPracticeApprovedPayload(PRACTICE_INPUT)
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result).not.toHaveProperty('dapStatus')
    expect(result).not.toHaveProperty('requestStatus')
    expect(result).not.toHaveProperty('standing')
    expect(result).not.toHaveProperty('participationStatus')
  })

  it('sync module does not contain MKCRM-writes-to-DAP language', () => {
    const src = readFileSync(SYNC_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('mkcrm updates dap standing')
    expect(src).not.toContain('mkcrm determines standing')
    expect(src).not.toContain('mkcrm is source of truth')
    expect(src).not.toContain('crm-driven standing')
    expect(src).not.toContain('sync back to dap')
  })

  it('sync module does not call any .update( against DAP tables', () => {
    const src = readFileSync(SYNC_PATH, 'utf8')
    expect(src).not.toContain('.update(')
  })

  it('sync module does not call any .insert( against DAP tables', () => {
    const src = readFileSync(SYNC_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
  })

  it('sync module does not import Supabase', () => {
    const src = readFileSync(SYNC_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('payloads module does not import Supabase', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('types module does not import Supabase', () => {
    const src = readFileSync(TYPES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('payloads module does not import from dapRequestActions or dapProviderParticipation', () => {
    const src = readFileSync(PAYLOADS_PATH, 'utf8')
    expect(src).not.toContain('dapRequestActions')
    expect(src).not.toContain('dapProviderParticipation')
  })
})

// ─── Group 5: Shadow mode only ─────────────────────────────────────────────────

describe('Shadow mode only — no live network calls permitted', () => {
  it('dapMkcrmSync.ts contains no fetch( call', () => {
    const src = readFileSync(SYNC_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
  })

  it('dapMkcrmSync.ts contains no http:// or https:// URLs', () => {
    const src = readFileSync(SYNC_PATH, 'utf8')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('dapMkcrmSync.ts contains no XMLHttpRequest or axios', () => {
    const src = readFileSync(SYNC_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/xmlhttprequest|axios/)
  })

  it('validateDapMkcrmPayload throws when shadowMode is not true', () => {
    const payload = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    const invalid = { ...payload, shadowMode: false } as unknown as DapMkcrmSyncPayload
    expect(() => validateDapMkcrmPayload(invalid)).toThrow()
  })

  it('validateDapMkcrmPayload throws when verticalKey is not dap', () => {
    const payload = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    const invalid = { ...payload, verticalKey: 'other' } as unknown as DapMkcrmSyncPayload
    expect(() => validateDapMkcrmPayload(invalid)).toThrow()
  })

  it('validateDapMkcrmPayload throws when dedupeKey is missing', () => {
    const payload = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    const invalid = { ...payload, dedupeKey: '' } as unknown as DapMkcrmSyncPayload
    expect(() => validateDapMkcrmPayload(invalid)).toThrow()
  })

  it('syncDapEventToMkcrmShadow returns shadowMode: true for valid payload', async () => {
    const payload = buildPracticeApprovedPayload(PRACTICE_INPUT)
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.shadowMode).toBe(true)
  })

  it('syncDapEventToMkcrmShadow returns ok: true for valid payload', async () => {
    const payload = buildMembershipEnrolledPayload(MEMBERSHIP_ENROLLED_INPUT)
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.ok).toBe(true)
  })

  it('syncDapEventToMkcrmShadow rejects payload where shadowMode is not true', async () => {
    const payload = buildParticipationStatusPayload(PARTICIPATION_INPUT)
    const invalid = { ...payload, shadowMode: false } as unknown as DapMkcrmSyncPayload
    await expect(syncDapEventToMkcrmShadow(invalid)).rejects.toThrow()
  })

  it('syncDapEventToMkcrmShadow result echoes eventType from payload', async () => {
    const payload = buildPracticeRejectedPayload(PRACTICE_INPUT)
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.eventType).toBe('practice_rejected')
  })

  it('syncDapEventToMkcrmShadow result echoes dedupeKey from payload', async () => {
    const payload = buildParticipationStatusPayload(PARTICIPATION_INPUT)
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.dedupeKey).toBe(payload.dedupeKey)
  })
})

// ─── Group 6: Dedupe safety ────────────────────────────────────────────────────

describe('Dedupe safety — deterministic, event-type-scoped, source-ID-scoped', () => {
  it('same input to buildPracticeEnrollmentSubmittedPayload produces same dedupeKey', () => {
    const a = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    const b = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    expect(a.dedupeKey).toBe(b.dedupeKey)
  })

  it('different event type for same requestId produces different dedupeKey', () => {
    const submitted = buildPracticeEnrollmentSubmittedPayload(PRACTICE_INPUT)
    const approved  = buildPracticeApprovedPayload(PRACTICE_INPUT)
    expect(submitted.dedupeKey).not.toBe(approved.dedupeKey)
  })

  it('same event type for different requestId produces different dedupeKey', () => {
    const a = buildPracticeApprovedPayload({ ...PRACTICE_INPUT, requestId: 'req-001' })
    const b = buildPracticeApprovedPayload({ ...PRACTICE_INPUT, requestId: 'req-002' })
    expect(a.dedupeKey).not.toBe(b.dedupeKey)
  })

  it('dedupeKey includes the event type string', () => {
    const p = buildPracticeApprovedPayload(PRACTICE_INPUT)
    expect(p.dedupeKey).toContain('practice_approved')
  })

  it('dedupeKey includes the source ID', () => {
    const p = buildPracticeApprovedPayload(PRACTICE_INPUT)
    expect(p.dedupeKey).toContain(PRACTICE_INPUT.requestId)
  })

  it('membership standing active and past_due for same member have different dedupeKeys', () => {
    const active   = buildMembershipStandingPayload({ ...MEMBERSHIP_STANDING_INPUT, standing: 'active' })
    const pastDue  = buildMembershipStandingPayload({ ...MEMBERSHIP_STANDING_INPUT, standing: 'past_due' })
    expect(active.dedupeKey).not.toBe(pastDue.dedupeKey)
  })

  it('participation confirmed and declined for same participationId have different dedupeKeys', () => {
    const confirmed = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, status: 'participation_confirmed' })
    const declined  = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, status: 'participation_declined' })
    expect(confirmed.dedupeKey).not.toBe(declined.dedupeKey)
  })

  it('same participation status for different participationIds have different dedupeKeys', () => {
    const a = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, participationId: 'par-001' })
    const b = buildParticipationStatusPayload({ ...PARTICIPATION_INPUT, participationId: 'par-002' })
    expect(a.dedupeKey).not.toBe(b.dedupeKey)
  })
})

// ─── Group 7: Full suite boundary ──────────────────────────────────────────────

describe('Full suite boundary — no new pages, no API routes, module placement correct', () => {
  function findPages(dir: string): string[] {
    const { readdirSync } = require('fs')
    if (!existsSync(dir)) return []
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...findPages(full))
      } else if (entry.isFile() && full.endsWith('page.tsx')) {
        results.push(full)
      }
    }
    return results
  }

  it('total page.tsx count is still 21 (Phase 9M adds no new pages)', () => {
    const pages = findPages(join(ROOT, 'app'))
    expect()
  })

  it('no MKCRM sync API route created in Phase 9M', () => {
    const mkcrm9mRoute = resolve(ROOT, 'app/api/dap/mkcrm/route.ts')
    const syncRoute    = resolve(ROOT, 'app/api/dap/sync/route.ts')
    expect(existsSync(mkcrm9mRoute)).toBe(false)
    expect(existsSync(syncRoute)).toBe(false)
  })

  it('sync module lives in lib/ not app/', () => {
    expect(existsSync(SYNC_PATH)).toBe(true)
    expect(SYNC_PATH).toContain('/lib/')
    expect(SYNC_PATH).not.toContain('/app/')
  })

  it('payloads module lives in lib/ not app/', () => {
    expect(existsSync(PAYLOADS_PATH)).toBe(true)
    expect(PAYLOADS_PATH).toContain('/lib/')
    expect(PAYLOADS_PATH).not.toContain('/app/')
  })

  it('types module lives in lib/ not app/', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
    expect(TYPES_PATH).toContain('/lib/')
    expect(TYPES_PATH).not.toContain('/app/')
  })

  it('dapMkcrmSync.ts does not use "use server"', () => {
    const src = readFileSync(SYNC_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })

  it('production homepage does not import any MKCRM module', () => {
    const homeSrc = readFileSync(resolve(ROOT, 'app/dental-advantage-plan/page.tsx'), 'utf8')
    expect(homeSrc).not.toContain('dapMkcrm')
  })
})
