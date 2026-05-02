/**
 * Phase 9R — Member Status Page Preview QA
 *
 * PURPOSE: Prove that the member status preview surface correctly displays
 * derived DAP member standing from Phase 9Q, without introducing payment
 * logic, mutation surfaces, or forbidden CTA language.
 *
 * Locked language:
 *   Derived member standing.
 *   Client Builder Pro billing events.
 *   Append-only billing events.
 *   MKCRM does not determine billing status.
 *   DAP does not manually set member standing.
 *
 * COVERAGE:
 *   Group 1  — Preview helper exports exist
 *   Group 2  — Preview helper returns derived read model
 *   Group 3  — Standing labels are stable
 *   Group 4  — Standing descriptions are safe
 *   Group 5  — Page route exists
 *   Group 6  — Page is preview-only (no production route)
 *   Group 7  — Page does not contain forbidden CTA language
 *   Group 8  — Page reinforces correct authority
 *   Group 9  — Phase 9Q read model remains authoritative
 *   Group 10 — No mutation surface
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  getDapMemberStatusPreview,
  getDapMemberStatusPreviewEvents,
  formatDapMemberStandingLabel,
  formatDapMemberStandingDescription,
} from '../dapMemberStatusPreview'
import { deriveDapMemberStatusReadModel } from '../dapMemberStatusRules'
import type { DapMemberStanding, DapMemberStatusReadModel } from '../../dap/membership/dapMemberStatusTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT         = resolve(__dirname, '../../..')
const HELPER_PATH  = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusPreview.ts')
const PAGE_PATH    = resolve(ROOT, 'app/preview/dap/members/[membershipId]/status/page.tsx')

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeReadModel(standing: DapMemberStanding): DapMemberStatusReadModel {
  return {
    verticalKey:              'dap',
    membershipId:             'mem-test',
    standing,
    derivedFromBillingEvents: true,
    eventCount:               0,
    reasons:                  [],
  }
}

// ─── Group 1: Preview helper exports exist ────────────────────────────────────

describe('Preview helper exports — all required functions are exported', () => {
  it('getDapMemberStatusPreview is a function', () => {
    expect(typeof getDapMemberStatusPreview).toBe('function')
  })

  it('getDapMemberStatusPreviewEvents is a function', () => {
    expect(typeof getDapMemberStatusPreviewEvents).toBe('function')
  })

  it('formatDapMemberStandingLabel is a function', () => {
    expect(typeof formatDapMemberStandingLabel).toBe('function')
  })

  it('formatDapMemberStandingDescription is a function', () => {
    expect(typeof formatDapMemberStandingDescription).toBe('function')
  })

  it('helper file exists', () => {
    expect(existsSync(HELPER_PATH)).toBe(true)
  })
})

// ─── Group 2: Preview helper returns derived read model ───────────────────────

describe('Preview helper — returns derived read model from Phase 9Q', () => {
  const ACTIVE_ID   = 'mem-preview-active'
  const UNKNOWN_ID  = 'mem-unknown-xyz'

  it('preview.readModel.derivedFromBillingEvents is true for fixture membership', () => {
    expect(getDapMemberStatusPreview(ACTIVE_ID).readModel.derivedFromBillingEvents).toBe(true)
  })

  it('preview.readModel.membershipId matches the requested id', () => {
    expect(getDapMemberStatusPreview(ACTIVE_ID).readModel.membershipId).toBe(ACTIVE_ID)
  })

  it('preview.membershipId matches the requested id', () => {
    expect(getDapMemberStatusPreview(ACTIVE_ID).membershipId).toBe(ACTIVE_ID)
  })

  it('preview.readModel.eventCount equals preview.billingEvents.length', () => {
    const preview = getDapMemberStatusPreview(ACTIVE_ID)
    expect(preview.readModel.eventCount).toBe(preview.billingEvents.length)
  })

  it('preview for mem-preview-active has standing active', () => {
    expect(getDapMemberStatusPreview(ACTIVE_ID).readModel.standing).toBe('active')
  })

  it('preview for mem-preview-past-due has standing past_due', () => {
    expect(getDapMemberStatusPreview('mem-preview-past-due').readModel.standing).toBe('past_due')
  })

  it('preview for mem-preview-canceled has standing canceled', () => {
    expect(getDapMemberStatusPreview('mem-preview-canceled').readModel.standing).toBe('canceled')
  })

  it('preview for mem-preview-pending has standing pending', () => {
    expect(getDapMemberStatusPreview('mem-preview-pending').readModel.standing).toBe('pending')
  })

  it('preview for unknown membershipId has standing unknown', () => {
    expect(getDapMemberStatusPreview(UNKNOWN_ID).readModel.standing).toBe('unknown')
  })

  it('preview for unknown membershipId has eventCount 0', () => {
    expect(getDapMemberStatusPreview(UNKNOWN_ID).readModel.eventCount).toBe(0)
  })

  it('getDapMemberStatusPreviewEvents returns empty array for unknown membershipId', () => {
    expect(getDapMemberStatusPreviewEvents(UNKNOWN_ID)).toEqual([])
  })

  it('preview result matches deriveDapMemberStatusReadModel called directly', () => {
    const events  = getDapMemberStatusPreviewEvents(ACTIVE_ID)
    const direct  = deriveDapMemberStatusReadModel(ACTIVE_ID, events)
    const preview = getDapMemberStatusPreview(ACTIVE_ID)
    expect(preview.readModel.standing).toBe(direct.standing)
    expect(preview.readModel.eventCount).toBe(direct.eventCount)
    expect(preview.readModel.lastBillingEventType).toBe(direct.lastBillingEventType)
  })

  it('preview display.label is a non-empty string', () => {
    const label = getDapMemberStatusPreview(ACTIVE_ID).display.label
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('preview display.description is a non-empty string', () => {
    const description = getDapMemberStatusPreview(ACTIVE_ID).display.description
    expect(typeof description).toBe('string')
    expect(description.length).toBeGreaterThan(0)
  })

  it('preview display.lastEventLabel is set for memberships with events', () => {
    const preview = getDapMemberStatusPreview(ACTIVE_ID)
    expect(preview.display.lastEventLabel).toBeDefined()
  })

  it('preview display.lastEventLabel is undefined for unknown membershipId', () => {
    const preview = getDapMemberStatusPreview(UNKNOWN_ID)
    expect(preview.display.lastEventLabel).toBeUndefined()
  })
})

// ─── Group 3: Standing labels are stable ──────────────────────────────────────

describe('Standing labels — all eight standings have stable display labels', () => {
  it('unknown → Unknown', () => {
    expect(formatDapMemberStandingLabel('unknown')).toBe('Unknown')
  })

  it('pending → Pending', () => {
    expect(formatDapMemberStandingLabel('pending')).toBe('Pending')
  })

  it('active → Active', () => {
    expect(formatDapMemberStandingLabel('active')).toBe('Active')
  })

  it('past_due → Past Due', () => {
    expect(formatDapMemberStandingLabel('past_due')).toBe('Past Due')
  })

  it('payment_failed → Payment Failed', () => {
    expect(formatDapMemberStandingLabel('payment_failed')).toBe('Payment Failed')
  })

  it('canceled → Canceled', () => {
    expect(formatDapMemberStandingLabel('canceled')).toBe('Canceled')
  })

  it('refunded → Refunded', () => {
    expect(formatDapMemberStandingLabel('refunded')).toBe('Refunded')
  })

  it('chargeback → Chargeback', () => {
    expect(formatDapMemberStandingLabel('chargeback')).toBe('Chargeback')
  })
})

// ─── Group 4: Standing descriptions are safe ──────────────────────────────────

describe('Standing descriptions — no forbidden language in any description', () => {
  const STANDINGS: DapMemberStanding[] = [
    'unknown', 'pending', 'active', 'past_due',
    'payment_failed', 'canceled', 'refunded', 'chargeback',
  ]

  const FORBIDDEN = [
    'set standing',
    'update standing',
    'store standing',
    'MKCRM determines',
    'MKCRM billing',
    'payment processor',
    'checkout',
    'card',
    'diagnosis',
    'treatment',
    'procedure',
    'insurance claim',
  ]

  for (const standing of STANDINGS) {
    for (const phrase of FORBIDDEN) {
      it(`description for '${standing}' does not contain '${phrase}'`, () => {
        const desc = formatDapMemberStandingDescription(makeReadModel(standing))
        expect(desc.toLowerCase()).not.toContain(phrase.toLowerCase())
      })
    }
  }

  it('description for unknown mentions Client Builder Pro', () => {
    const desc = formatDapMemberStandingDescription(makeReadModel('unknown'))
    expect(desc).toContain('Client Builder Pro')
  })

  it('description for active is non-empty', () => {
    const desc = formatDapMemberStandingDescription(makeReadModel('active'))
    expect(desc.length).toBeGreaterThan(0)
  })
})

// ─── Group 5: Page route exists ───────────────────────────────────────────────

describe('Page route — preview page file exists at the correct path', () => {
  it('page file exists at app/preview/dap/members/[membershipId]/status/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page file is non-empty', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.length).toBeGreaterThan(0)
  })

  it('page exports a default function (server component)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/export default/)
  })

  it('page uses force-dynamic', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain("force-dynamic")
  })

  it('page uses Promise<{ membershipId: string }> params pattern', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('membershipId')
    expect(src).toContain('Promise<')
  })
})

// ─── Group 6: Page is preview-only ───────────────────────────────────────────

describe('Preview-only — no production member status routes were created', () => {
  it('no production route at app/dap/members/[membershipId]/status/page.tsx', () => {
    const prod = resolve(ROOT, 'app/dap/members/[membershipId]/status/page.tsx')
    expect(existsSync(prod)).toBe(false)
  })

  it('no production route at app/members/[membershipId]/status/page.tsx', () => {
    const prod = resolve(ROOT, 'app/members/[membershipId]/status/page.tsx')
    expect(existsSync(prod)).toBe(false)
  })

  it('page path contains /preview/', () => {
    expect(PAGE_PATH).toContain('/preview/')
  })

  it('no API route was created for member status', () => {
    const apiRoute = resolve(ROOT, 'app/api/dap/members/route.ts')
    expect(existsSync(apiRoute)).toBe(false)
  })
})

// ─── Group 7: Page does not contain forbidden CTA language ────────────────────

describe('No forbidden CTAs — page contains no payment or checkout language', () => {
  const src = readFileSync(PAGE_PATH, 'utf8')

  it('page does not contain "Pay now"', () => {
    expect(src).not.toContain('Pay now')
  })

  it('page does not contain "Update payment"', () => {
    expect(src).not.toContain('Update payment')
  })

  it('page does not contain "Subscribe"', () => {
    expect(src).not.toContain('Subscribe')
  })

  it('page does not contain "Checkout"', () => {
    expect(src).not.toContain('Checkout')
  })

  it('page does not contain "Enter card"', () => {
    expect(src).not.toContain('Enter card')
  })

  it('page does not contain "Billing portal"', () => {
    expect(src).not.toContain('Billing portal')
  })

  it('page does not contain "Process payment"', () => {
    expect(src).not.toContain('Process payment')
  })

  it('page does not contain member name or patient name fields', () => {
    expect(src).not.toContain('patientName')
    expect(src).not.toContain('memberName')
  })

  it('page does not contain diagnosis or treatment fields', () => {
    expect(src.toLowerCase()).not.toContain('diagnosis')
    expect(src.toLowerCase()).not.toContain('treatment')
    expect(src.toLowerCase()).not.toContain('procedure')
  })
})

// ─── Group 8: Page reinforces correct authority ───────────────────────────────

describe('Correct authority — page copy reflects the derive-not-store model', () => {
  const src = readFileSync(PAGE_PATH, 'utf8')

  it('page contains "Client Builder Pro" or "client_builder_pro"', () => {
    expect(src).toMatch(/Client Builder Pro|client_builder_pro/)
  })

  it('page contains "derived" (case-insensitive)', () => {
    expect(src.toLowerCase()).toContain('derived')
  })

  it('page contains "append-only"', () => {
    expect(src.toLowerCase()).toContain('append-only')
  })

  it('page contains "MKCRM does not determine billing status"', () => {
    expect(src).toContain('MKCRM does not determine billing status')
  })

  it('page contains data-member-standing attribute', () => {
    expect(src).toContain('data-member-standing')
  })

  it('page contains data-billing-event-log section', () => {
    expect(src).toContain('data-billing-event-log')
  })

  it('page contains data-derived-status-notice', () => {
    expect(src).toContain('data-derived-status-notice')
  })

  it('page contains "derivedFromBillingEvents"', () => {
    expect(src).toContain('derivedFromBillingEvents')
  })
})

// ─── Group 9: Phase 9Q read model remains authoritative ──────────────────────

describe('Phase 9Q authority — preview helper delegates to deriveDapMemberStatusReadModel', () => {
  it('helper source imports deriveDapMemberStatusReadModel', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).toContain('deriveDapMemberStatusReadModel')
  })

  it('helper source imports from dapMemberStatusRules', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).toContain('dapMemberStatusRules')
  })

  it('preview for active membership produces same standing as direct 9Q call', () => {
    const events  = getDapMemberStatusPreviewEvents('mem-preview-active')
    const direct  = deriveDapMemberStatusReadModel('mem-preview-active', events)
    const preview = getDapMemberStatusPreview('mem-preview-active')
    expect(preview.readModel.standing).toBe(direct.standing)
    expect(preview.readModel.eventCount).toBe(direct.eventCount)
  })

  it('preview for past-due membership produces same standing as direct 9Q call', () => {
    const events  = getDapMemberStatusPreviewEvents('mem-preview-past-due')
    const direct  = deriveDapMemberStatusReadModel('mem-preview-past-due', events)
    const preview = getDapMemberStatusPreview('mem-preview-past-due')
    expect(preview.readModel.standing).toBe(direct.standing)
  })

  it('helper does not re-implement the EVENT_TO_STANDING mapping', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('client_builder_subscription_created:')
    expect(src).not.toContain('client_builder_subscription_activated:')
  })
})

// ─── Group 10: No mutation surface ────────────────────────────────────────────

describe('No mutation surface — no setters or standing overrides', () => {
  it('helper file does not export setStanding', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('setStanding')
  })

  it('helper file does not export updateStanding', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('updateStanding')
  })

  it('helper file does not export storeStanding', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('storeStanding')
  })

  it('helper file does not export overrideStanding', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('overrideStanding')
  })

  it('helper file does not export manualStanding', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('manualStanding')
  })

  it('helper file has no .insert( or .update( database calls', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
    expect(src).not.toContain('.update(')
  })

  it('helper file does not import Supabase', () => {
    const src = readFileSync(HELPER_PATH, 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('page does not contain setStanding or updateStanding', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('setStanding')
    expect(src).not.toContain('updateStanding')
    expect(src).not.toContain('storeStanding')
    expect(src).not.toContain('overrideStanding')
  })
})
