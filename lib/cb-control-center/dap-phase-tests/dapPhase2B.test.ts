// Phase 2B — Admin Rejection Email Preview Layer
// CB Control Center makes enrollment decisions. MKCRM does not. Payment systems do not.
// Preview-only. No email sending. No PHI. No payment CTAs.

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..', '..')
const PAGE_PATH = resolve(ROOT, 'app/preview/dap/admin-rejection-emails/page.tsx')

import {
  getDapAdminRejectionEmailDispatchReadiness,
  getAllDapAdminRejectionEmailDispatchReadiness,
  getDapPracticeDecisionEmailDispatchReadiness,
  getDapMemberStatusEmailDispatchReadiness,
} from '../dapCommunicationDispatchReadiness'
import type { DapRejectionEmailQueueEntry } from '../dapRejectionEmailQueue'
import { getDapRejectionEmailQueueEntryFromEvent, findDapRejectionEmailQueueEntry } from '../dapRejectionEmailQueue'
import { getAllDapPracticeDecisionEmailPreviews } from '../dapPracticeDecisionEmailPreview'
import { getAllDapMemberStatusEmailPreviews } from '../dapMemberStatusEmailPreview'
import type { DapRequestEvent } from '../../dap/registry/dapRequestTypes'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeRejectionEvent(requestId = 'req-test-001'): DapRequestEvent {
  return {
    id:              'evt-001',
    request_id:      requestId,
    event_type:      'request_rejected',
    event_timestamp: '2026-05-01T12:00:00Z',
    actor_type:      'admin',
    event_note:      null,
    metadata_json:   null,
  }
}

function makeNonRejectionEvent(): DapRequestEvent {
  return {
    id:              'evt-002',
    request_id:      'req-test-002',
    event_type:      'request_approved',
    event_timestamp: '2026-05-01T12:00:00Z',
    actor_type:      'admin',
    event_note:      null,
    metadata_json:   null,
  }
}

import type {
  DapAdminRejectionEmailTemplateKey,
  DapAdminRejectionEmailAudience,
} from '../dapAdminRejectionEmailTypes'

import {
  getDapAdminRejectionEmailCopy,
  getAllDapAdminRejectionEmailCopy,
  isDapAdminRejectionEmailCopySafe,
  assertDapAdminRejectionEmailCopySafe,
  DAP_REJECTION_FORBIDDEN_TERMS,
  DAP_REJECTION_FOOTER_NOTE,
} from '../dapAdminRejectionEmailCopy'

import {
  getDapAdminRejectionEmailPreview,
  getAllDapAdminRejectionEmailPreviews,
} from '../dapAdminRejectionEmailPreview'

const ALL_TEMPLATE_KEYS: DapAdminRejectionEmailTemplateKey[] = [
  'practice_enrollment_rejected',
  'practice_participation_rejected',
  'member_enrollment_rejected',
  'membership_activation_rejected',
]

function collectCopyText(key: DapAdminRejectionEmailTemplateKey): string {
  const c = getDapAdminRejectionEmailCopy(key)
  return [c.subject, c.headline, c.previewText, ...c.body, c.footerNote].join(' ').toLowerCase()
}

// ─── Phase 2B — Type exports ──────────────────────────────────────────────────

describe('Phase 2B — type and export surface', () => {
  it('DapAdminRejectionEmailTemplateKey has exactly 4 values', () => {
    expect(ALL_TEMPLATE_KEYS).toHaveLength(4)
  })

  it('getDapAdminRejectionEmailCopy is exported', () => {
    expect(typeof getDapAdminRejectionEmailCopy).toBe('function')
  })

  it('getAllDapAdminRejectionEmailCopy is exported', () => {
    expect(typeof getAllDapAdminRejectionEmailCopy).toBe('function')
  })

  it('isDapAdminRejectionEmailCopySafe is exported', () => {
    expect(typeof isDapAdminRejectionEmailCopySafe).toBe('function')
  })

  it('assertDapAdminRejectionEmailCopySafe is exported', () => {
    expect(typeof assertDapAdminRejectionEmailCopySafe).toBe('function')
  })

  it('DAP_REJECTION_FORBIDDEN_TERMS is a non-empty array', () => {
    expect(Array.isArray(DAP_REJECTION_FORBIDDEN_TERMS)).toBe(true)
    expect(DAP_REJECTION_FORBIDDEN_TERMS.length).toBeGreaterThan(0)
  })

  it('DAP_REJECTION_FOOTER_NOTE is a non-empty string', () => {
    expect(typeof DAP_REJECTION_FOOTER_NOTE).toBe('string')
    expect(DAP_REJECTION_FOOTER_NOTE.length).toBeGreaterThan(0)
  })

  it('copy types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailTypes.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailCopy.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('preview builder does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailPreview.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file does not import from MKCRM modules', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailCopy.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*mkcrm/i)
    expect(src).not.toMatch(/import.*mkcrm/i)
  })
})

// ─── Phase 2B — Copy completeness ────────────────────────────────────────────

describe('Phase 2B — all templates have required copy fields', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} has all required fields`, () => {
      const copy = getDapAdminRejectionEmailCopy(key)
      expect(copy.templateKey).toBe(key)
      expect(typeof copy.subject).toBe('string')
      expect(copy.subject.length).toBeGreaterThan(0)
      expect(typeof copy.headline).toBe('string')
      expect(copy.headline.length).toBeGreaterThan(0)
      expect(typeof copy.previewText).toBe('string')
      expect(Array.isArray(copy.body)).toBe(true)
      expect(copy.body.length).toBeGreaterThan(0)
      expect(typeof copy.footerNote).toBe('string')
      expect(copy.footerNote.length).toBeGreaterThan(0)
    })

    it(`${key} audience is a valid value`, () => {
      const copy = getDapAdminRejectionEmailCopy(key)
      const validAudiences: DapAdminRejectionEmailAudience[] = ['practice_admin', 'member']
      expect(validAudiences).toContain(copy.audience)
    })
  }
})

// ─── Phase 2B — Safety flags ─────────────────────────────────────────────────

describe('Phase 2B — safety flags are locked on all templates', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} has includesPaymentCta: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesPaymentCta).toBe(false)
    })

    it(`${key} has includesPhi: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesPhi).toBe(false)
    })

    it(`${key} has includesCta: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesCta).toBe(false)
    })
  }

  it('footer note references CB Control Center authority boundary', () => {
    expect(DAP_REJECTION_FOOTER_NOTE.toLowerCase()).toContain('cb control center')
    expect(DAP_REJECTION_FOOTER_NOTE.toLowerCase()).toContain('mkcrm')
  })
})

// ─── Phase 2B — Forbidden term scanner ───────────────────────────────────────

describe('Phase 2B — copy scanner catches unsafe language', () => {
  it('all canonical templates pass isDapAdminRejectionEmailCopySafe', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(
        isDapAdminRejectionEmailCopySafe(getDapAdminRejectionEmailCopy(key)),
        `${key} failed safety check`
      ).toBe(true)
    }
  })

  it('assertDapAdminRejectionEmailCopySafe does not throw on canonical templates', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(() =>
        assertDapAdminRejectionEmailCopySafe(getDapAdminRejectionEmailCopy(key))
      ).not.toThrow()
    }
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "denied"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      body: ['Your request was denied.'],
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "insurance"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      subject: 'Your insurance claim was rejected.',
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "diagnosis"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      body: ['Your diagnosis was reviewed.'],
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when includesPaymentCta is not false', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      includesPaymentCta: true as unknown as false,
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('no canonical copy contains forbidden terms', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      const text = collectCopyText(key)
      for (const term of DAP_REJECTION_FORBIDDEN_TERMS) {
        expect(
          text,
          `Template "${key}" contains forbidden term: "${term}"`
        ).not.toContain(term.toLowerCase())
      }
    }
  })
})

// ─── Phase 2B — Preview builder ───────────────────────────────────────────────

describe('Phase 2B — preview builder authority boundary', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} preview has decisionAuthority: cb_control_center`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.decisionAuthority).toBe('cb_control_center')
    })

    it(`${key} preview has crmAuthority: false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.crmAuthority).toBe(false)
    })

    it(`${key} preview has paymentAuthority: false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.paymentAuthority).toBe(false)
    })

    it(`${key} preview has previewOnly: true`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.previewOnly).toBe(true)
    })
  }
})

describe('Phase 2B — preview delivery flags locked to dry-run', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} delivery.queued is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.queued).toBe(false)
    })

    it(`${key} delivery.scheduled is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.scheduled).toBe(false)
    })

    it(`${key} delivery.sent is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.sent).toBe(false)
    })

    it(`${key} delivery.dryRunOnly is true`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.dryRunOnly).toBe(true)
    })
  }

  it('getAllDapAdminRejectionEmailPreviews returns one preview per template key', () => {
    const all = getAllDapAdminRejectionEmailPreviews()
    expect(all).toHaveLength(ALL_TEMPLATE_KEYS.length)
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(all.some(p => p.templateKey === key)).toBe(true)
    }
  })
})

// ─── Phase 2B — Preview page ──────────────────────────────────────────────────

describe('Phase 2B — preview page', () => {
  it('preview page exists at app/preview/dap/admin-rejection-emails/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('preview page has data-preview-only="true" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only="true"')
  })

  it('preview page has data-send-enabled="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-send-enabled="false"')
  })

  it('preview page has data-implies-phi="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-phi="false"')
  })

  it('preview page has data-implies-payment="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-payment="false"')
  })

  it('preview page does not contain a send button or form', () => {
    const src = readFileSync(PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('<form')
    expect(src).not.toContain('type="submit"')
    expect(src).not.toContain('send email')
  })

  it('preview page does not import Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})

// ─── Phase 2B — Rejection email queue entry ───────────────────────────────────

describe('Phase 2B — rejection email queue gated on request_rejected event', () => {
  it('getDapRejectionEmailQueueEntryFromEvent returns a queue entry for request_rejected', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent())
    expect(entry).not.toBeNull()
    expect(entry!.decisionAuthority).toBe('cb_control_center')
    expect(entry!.crmAuthority).toBe(false)
    expect(entry!.paymentAuthority).toBe(false)
    expect(entry!.sent).toBe(false)
  })

  it('getDapRejectionEmailQueueEntryFromEvent returns null for non-rejection events', () => {
    expect(getDapRejectionEmailQueueEntryFromEvent(makeNonRejectionEvent())).toBeNull()
  })

  it('findDapRejectionEmailQueueEntry returns entry when event list contains request_rejected', () => {
    const events: DapRequestEvent[] = [makeNonRejectionEvent(), makeRejectionEvent()]
    const entry = findDapRejectionEmailQueueEntry(events)
    expect(entry).not.toBeNull()
    expect(entry!.requestId).toBe('req-test-001')
  })

  it('findDapRejectionEmailQueueEntry returns null when no request_rejected event', () => {
    const events: DapRequestEvent[] = [makeNonRejectionEvent()]
    expect(findDapRejectionEmailQueueEntry(events)).toBeNull()
  })

  it('queue entry has safety flags locked', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent())!
    expect(entry.safety.includesPhi).toBe(false)
    expect(entry.safety.includesPaymentCta).toBe(false)
  })

  it('queue entry preserves requestId from the event', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent('req-specific-123'))!
    expect(entry.requestId).toBe('req-specific-123')
  })

  it('queue entry queuedAt matches event timestamp', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent())!
    expect(entry.queuedAt).toBe('2026-05-01T12:00:00Z')
  })
})

// ─── Phase 2B — Dispatch readiness: rejection emails ─────────────────────────

describe('Phase 2B — dispatch readiness blocked without rejection event', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} is blocked when queueEntry is null`, () => {
      const preview = getDapAdminRejectionEmailPreview(key)
      const readiness = getDapAdminRejectionEmailDispatchReadiness(preview, null)
      expect(readiness.status).toBe('blocked')
      expect(readiness.eligibleForFutureDispatch).toBe(false)
    })

    it(`${key} blocked readiness has missing_operational_decision blocker`, () => {
      const preview = getDapAdminRejectionEmailPreview(key)
      const readiness = getDapAdminRejectionEmailDispatchReadiness(preview, null)
      const codes = readiness.blockers.map(b => b.code)
      expect(codes).toContain('missing_operational_decision')
    })
  }
})

describe('Phase 2B — dispatch readiness ready when rejection event present', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} is ready_for_review when queue entry is present`, () => {
      const preview  = getDapAdminRejectionEmailPreview(key)
      const entry    = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
      const readiness = getDapAdminRejectionEmailDispatchReadiness(preview, entry)
      expect(readiness.status).toBe('ready_for_review')
      expect(readiness.eligibleForFutureDispatch).toBe(true)
    })

    it(`${key} readiness has no blockers when event is present`, () => {
      const preview  = getDapAdminRejectionEmailPreview(key)
      const entry    = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
      const readiness = getDapAdminRejectionEmailDispatchReadiness(preview, entry)
      expect(readiness.blockers).toHaveLength(0)
    })
  }
})

describe('Phase 2B — dispatch readiness authority and safety invariants', () => {
  it('all rejection readiness models have source.decisionAuthority: cb_control_center', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all rejection readiness models have source.crmAuthority: false', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.source.crmAuthority).toBe(false)
    }
  })

  it('all rejection readiness models have source.paymentAuthority: false', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.source.paymentAuthority).toBe(false)
    }
  })

  it('all rejection readiness models have safety.includesPaymentCta: false', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.safety.includesPaymentCta).toBe(false)
    }
  })

  it('all rejection readiness models have safety.includesPhi: false', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.safety.includesPhi).toBe(false)
    }
  })

  it('all rejection readiness models have safety.copySafe: true', () => {
    const entry = getDapRejectionEmailQueueEntryFromEvent(makeRejectionEvent()) as DapRejectionEmailQueueEntry
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = getDapAdminRejectionEmailDispatchReadiness(getDapAdminRejectionEmailPreview(key), entry)
      expect(r.safety.copySafe).toBe(true)
    }
  })

  it('getAllDapAdminRejectionEmailDispatchReadiness returns 4 blocked entries (no event context)', () => {
    const all = getAllDapAdminRejectionEmailDispatchReadiness()
    expect(all).toHaveLength(4)
    for (const r of all) {
      expect(r.status).toBe('blocked')
    }
  })
})

// ─── Phase 2B — Existing dispatch readiness unchanged ────────────────────────

describe('Phase 2B — existing practice/member dispatch readiness still correct', () => {
  it('practice decision email dispatch readiness functions still exist', () => {
    expect(typeof getDapPracticeDecisionEmailDispatchReadiness).toBe('function')
  })

  it('member status email dispatch readiness functions still exist', () => {
    expect(typeof getDapMemberStatusEmailDispatchReadiness).toBe('function')
  })

  it('all practice decision email previews are ready_for_review', () => {
    const previews = getAllDapPracticeDecisionEmailPreviews()
    for (const p of previews) {
      const r = getDapPracticeDecisionEmailDispatchReadiness(p)
      expect(r.status, `${p.copy.templateKey} should be ready_for_review`).toBe('ready_for_review')
    }
  })

  it('all member status email previews are ready_for_review', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    for (const p of previews) {
      const r = getDapMemberStatusEmailDispatchReadiness(p)
      expect(r.status, `${p.copy.templateKey} should be ready_for_review`).toBe('ready_for_review')
    }
  })
})
