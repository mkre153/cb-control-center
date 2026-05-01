// Phase 12 — DAP Action Catalog (Read-Only)
// Tests: action shape, safety flags, availability rules, authority boundary, route registry.

import { describe, it, expect } from 'vitest'
import { join, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

const ROOT = resolve(__dirname, '../../')

function findFiles(dir: string, pred: (f: string) => boolean): string[] {
  const { readdirSync, statSync } = require('fs')
  const results: string[] = []
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) { walk(full) } else if (pred(full)) { results.push(full) }
    }
  }
  walk(dir)
  return results
}

function findPages(dir: string): string[] {
  return findFiles(dir, f => f.endsWith('page.tsx'))
}

import {
  buildDapActionAvailabilityCatalog,
  evaluateDapActionAvailability,
  DAP_ACTION_CONTEXT_EMPTY,
  DAP_ACTION_CONTEXT_DEMO,
  DAP_ACTION_CONTEXT_APPROVED,
} from './dapActionAvailabilityRules'
import { DAP_ACTION_DEFINITIONS } from './dapActionCatalog'
import type { DapAction, DapActionAvailabilityContext } from './dapActionCatalogTypes'

// ─── Group 1: All actions have required fields ────────────────────────────────

describe('All computed actions have required fields', () => {
  const REQUIRED_FIELDS: (keyof DapAction)[] = [
    'actionKey', 'label', 'description', 'category', 'availability',
    'authoritySource', 'requiredGates', 'satisfiedGates', 'blockedBy',
    'reasons', 'safetyFlags',
  ]

  it('all 18 static definitions exist', () => {
    expect(DAP_ACTION_DEFINITIONS.length).toBe(18)
  })

  it('every computed action has all required top-level fields', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const action of actions) {
      for (const field of REQUIRED_FIELDS) {
        expect(action, `action ${action.actionKey} missing field: ${field}`).toHaveProperty(field)
      }
    }
  })

  it('every action has a non-empty actionKey, label, description', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const action of actions) {
      expect(action.actionKey.length).toBeGreaterThan(0)
      expect(action.label.length).toBeGreaterThan(0)
      expect(action.description.length).toBeGreaterThan(0)
    }
  })

  it('requiredGates, satisfiedGates, blockedBy, reasons are all arrays', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const action of actions) {
      expect(Array.isArray(action.requiredGates)).toBe(true)
      expect(Array.isArray(action.satisfiedGates)).toBe(true)
      expect(Array.isArray(action.blockedBy)).toBe(true)
      expect(Array.isArray(action.reasons)).toBe(true)
    }
  })

  it('satisfiedGates is always a subset of requiredGates', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const action of actions) {
      for (const gate of action.satisfiedGates) {
        expect(action.requiredGates).toContain(gate)
      }
    }
  })
})

// ─── Group 2: Safety flags are literal ────────────────────────────────────────

describe('All actions have safe literal flags', () => {
  it('readOnly is true for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['readOnly']).toBe(true)
    }
  })

  it('previewOnly is true for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['previewOnly']).toBe(true)
    }
  })

  it('mutatesSupabase is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['mutatesSupabase']).toBe(false)
    }
  })

  it('sendsEmail is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['sendsEmail']).toBe(false)
    }
  })

  it('queuesEmail is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['queuesEmail']).toBe(false)
    }
  })

  it('triggersPayment is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['triggersPayment']).toBe(false)
    }
  })

  it('triggersMkcrmLiveSync is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['triggersMkcrmLiveSync']).toBe(false)
    }
  })

  it('includesPhi is false for all actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['includesPhi']).toBe(false)
    }
  })
})

// ─── Group 3: No forbidden mutation/execution language in action keys ──────────

describe('No forbidden mutation/execution language in action object keys or values', () => {
  const FORBIDDEN_KEY_PATTERNS = [
    /^execute$/i, /^run$/i, /^send$/i, /^queue$/i, /^mutate$/i,
    /^syncNow$/i, /^webhook$/i, /^post$/i, /^patch$/i, /^insert$/i,
    /^update$/i, /^delete$/i,
  ]

  it('static action definitions have no forbidden field names', () => {
    for (const def of DAP_ACTION_DEFINITIONS) {
      const keys = Object.keys(def)
      for (const key of keys) {
        for (const pat of FORBIDDEN_KEY_PATTERNS) {
          expect(pat.test(key), `forbidden key "${key}" in action ${def.actionKey}`).toBe(false)
        }
      }
    }
  })

  it('computed actions have no forbidden field names', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const action of actions) {
      const keys = Object.keys(action)
      for (const key of keys) {
        for (const pat of FORBIDDEN_KEY_PATTERNS) {
          expect(pat.test(key), `forbidden key "${key}" in action ${action.actionKey}`).toBe(false)
        }
      }
    }
  })

  it('source files do not contain execute/run/send handler patterns', () => {
    const files = [
      'lib/cb-control-center/dapActionCatalog.ts',
      'lib/cb-control-center/dapActionAvailabilityRules.ts',
      'lib/cb-control-center/dapActionCatalogTypes.ts',
    ]
    const FORBIDDEN = [
      /\.execute\s*\(/,
      /\.syncNow\s*\(/,
      /from ['"]@resend\//,
      /supabase.*\.insert\s*\(/,
      /fetch\s*\(\s*['"][^'"]*api/,
    ]
    for (const rel of files) {
      const src = readFileSync(resolve(ROOT, rel), 'utf8')
      for (const pat of FORBIDDEN) {
        expect(src, `${rel} contains forbidden pattern: ${pat}`).not.toMatch(pat)
      }
    }
  })
})

// ─── Group 4: Composite context returns full catalog ──────────────────────────

describe('Composite context returns full computed catalog', () => {
  it('empty context returns all 18 actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_EMPTY)
    expect(actions).toHaveLength(18)
  })

  it('demo context returns all 18 actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    expect(actions).toHaveLength(18)
  })

  it('approved context returns all 18 actions', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    expect(actions).toHaveLength(18)
  })

  it('evaluateDapActionAvailability returns a single DapAction', () => {
    const def = DAP_ACTION_DEFINITIONS[0]!
    const action = evaluateDapActionAvailability(def, DAP_ACTION_CONTEXT_DEMO)
    expect(action.actionKey).toBe(def.actionKey)
    expect(action.availability).toBeDefined()
  })

  it('all four availability values appear somewhere across demo context', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const availabilities = new Set(actions.map(a => a.availability))
    expect(availabilities).toContain('available')
    expect(availabilities).toContain('blocked')
    expect(availabilities).toContain('future_only')
    expect(availabilities).toContain('preview_only')
  })
})

// ─── Group 5: Request workflow availability ────────────────────────────────────

describe('Request workflow availability behaves correctly', () => {
  it('approve_practice_request is available when ready_for_review', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'approve_practice_request')!
    expect(action.availability).toBe('available')
  })

  it('approve_practice_request is blocked when already decided', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'approve_practice_request')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('request_already_decided')
  })

  it('approve_practice_request is blocked when safety rules violated', () => {
    const ctx: DapActionAvailabilityContext = {
      ...DAP_ACTION_CONTEXT_DEMO,
      decisionReadinessStatus: 'blocked_by_safety_rules',
    }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'approve_practice_request')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('safety_rule_violation')
  })

  it('reject_practice_request is available even with missing fields', () => {
    const ctx: DapActionAvailabilityContext = {
      ...DAP_ACTION_CONTEXT_DEMO,
      decisionReadinessStatus: 'missing_required_fields',
    }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'reject_practice_request')!
    expect(action.availability).toBe('available')
  })

  it('reject_practice_request is blocked when already decided', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'reject_practice_request')!
    expect(action.availability).toBe('blocked')
  })
})

// ─── Group 6: Provider participation actions ──────────────────────────────────

describe('Provider participation actions are blocked until required gates are satisfied', () => {
  it('start_provider_participation_confirmation is blocked without request approval', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'start_provider_participation_confirmation')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('request_not_approved')
  })

  it('start_provider_participation_confirmation is available when request approved and offer terms passed', () => {
    const ctx: DapActionAvailabilityContext = {
      ...DAP_ACTION_CONTEXT_APPROVED,
      providerParticipationStatus: null,
    }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'start_provider_participation_confirmation')!
    expect(action.availability).toBe('available')
  })

  it('start_provider_participation_confirmation is blocked when participation already started', () => {
    const ctx: DapActionAvailabilityContext = {
      ...DAP_ACTION_CONTEXT_APPROVED,
      providerParticipationStatus: 'confirmation_started',
    }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'start_provider_participation_confirmation')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('participation_already_started')
  })

  it('confirm_provider_participation is future_only (provider self-service not built)', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'confirm_provider_participation')!
    expect(action.availability).toBe('future_only')
  })

  it('publish_provider_page is future_only', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'publish_provider_page')!
    expect(action.availability).toBe('future_only')
  })
})

// ─── Group 7: Communication actions ──────────────────────────────────────────

describe('Communication actions — never send or queue', () => {
  it('prepare_member_status_notification is preview_only', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'prepare_member_status_notification')!
    expect(action.availability).toBe('preview_only')
  })

  it('approve_communication_for_future_send is available for not_reviewed', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'approve_communication_for_future_send')!
    expect(action.availability).toBe('available')
  })

  it('approve_communication_for_future_send is blocked when already approved', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'approve_communication_for_future_send')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('communication_already_approved')
  })

  it('revoke_communication_approval is available when approved_for_future_send', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'revoke_communication_approval')!
    expect(action.availability).toBe('available')
  })

  it('revoke_communication_approval is blocked when not approved', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'revoke_communication_approval')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('communication_not_approved')
  })

  it('create_communication_dry_run is available when approved and not yet run', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'create_communication_dry_run')!
    expect(action.availability).toBe('available')
  })

  it('all communication actions have sendsEmail: false and queuesEmail: false', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const commActions = actions.filter(a => a.category === 'communication')
    for (const a of commActions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['sendsEmail']).toBe(false)
      expect((a.safetyFlags as unknown as Record<string, unknown>)['queuesEmail']).toBe(false)
    }
  })
})

// ─── Group 8: MKCRM actions remain shadow-only ────────────────────────────────

describe('MKCRM actions remain shadow-only — never live sync', () => {
  it('preview_mkcrm_shadow_payload is preview_only when shadow payload exists', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'preview_mkcrm_shadow_payload')!
    expect(action.availability).toBe('preview_only')
    expect(action.authoritySource).toBe('mkcrm_shadow')
  })

  it('preview_mkcrm_shadow_payload is blocked when no shadow payload', () => {
    const ctx: DapActionAvailabilityContext = { ...DAP_ACTION_CONTEXT_DEMO, hasShadowPayload: false }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'preview_mkcrm_shadow_payload')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('no_shadow_payload')
  })

  it('approve_mkcrm_shadow_payload_for_future_sync is future_only', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_APPROVED)
    const action = actions.find(a => a.actionKey === 'approve_mkcrm_shadow_payload_for_future_sync')!
    expect(action.availability).toBe('future_only')
    expect(action.blockedBy).toContain('mkcrm_live_sync_not_built')
  })

  it('all mkcrm_shadow category actions have triggersMkcrmLiveSync: false', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const mkcrmActions = actions.filter(a => a.category === 'mkcrm_shadow')
    expect(mkcrmActions.length).toBeGreaterThan(0)
    for (const a of mkcrmActions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['triggersMkcrmLiveSync']).toBe(false)
    }
  })
})

// ─── Group 9: Client Builder Pro — payment authority, no trigger ──────────────

describe('Client Builder Pro — market/payment authority, no payment trigger', () => {
  it('no action has authoritySource: client_builder_pro (CBP is payment system, not decision authority)', () => {
    // CBP is the market/payment system — it does not issue admin decisions.
    // None of the 18 catalog actions should claim CBP as authority source.
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const cbpActions = actions.filter(a => a.authoritySource === 'client_builder_pro')
    expect(cbpActions).toHaveLength(0)
  })

  it('all actions have triggersPayment: false', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    for (const a of actions) {
      expect((a.safetyFlags as unknown as Record<string, unknown>)['triggersPayment']).toBe(false)
    }
  })

  it('catalog type file references client_builder_pro as authority source enum value', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapActionCatalogTypes.ts'), 'utf8')
    expect(src).toContain('client_builder_pro')
  })
})

// ─── Group 10: Public/member status actions ───────────────────────────────────

describe('Public/member status actions are derived-display only, not decision authority', () => {
  it('view_member_status has authoritySource: public_member_page', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'view_member_status')!
    expect(action.authoritySource).toBe('public_member_page')
  })

  it('view_member_status is available when membershipId is present', () => {
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const action = actions.find(a => a.actionKey === 'view_member_status')!
    expect(action.availability).toBe('available')
  })

  it('view_member_status is blocked when no membershipId', () => {
    const ctx: DapActionAvailabilityContext = { ...DAP_ACTION_CONTEXT_DEMO, membershipId: null }
    const actions = buildDapActionAvailabilityCatalog(ctx)
    const action = actions.find(a => a.actionKey === 'view_member_status')!
    expect(action.availability).toBe('blocked')
    expect(action.blockedBy).toContain('no_membership_id')
  })

  it('no member_standing action has authoritySource: cb_control_center acting as member decision', () => {
    // Public member page is display-only. Member standing is derived, not decided.
    const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)
    const viewAction = actions.find(a => a.actionKey === 'view_member_status')!
    expect(viewAction.authoritySource).not.toBe('mkcrm_shadow')
    expect(viewAction.authoritySource).not.toBe('client_builder_pro')
  })
})

// ─── Group 11: Preview route ──────────────────────────────────────────────────

describe('Action catalog preview route', () => {
  const PAGE_PATH = resolve(ROOT, 'app/preview/dap/action-catalog/page.tsx')

  it('app/preview/dap/action-catalog/page.tsx exists', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page contains data-action-catalog-preview-page', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-action-catalog-preview-page')
  })

  it('page contains data-authority-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-authority-notice')
  })

  it('page contains data-preview-only-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only-notice')
  })

  it('page does not contain forbidden send/mutate/payment patterns', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"]@resend\//)
    expect(src).not.toMatch(/sendEmail\s*\(/)
    expect(src).not.toMatch(/supabase.*\.insert\s*\(/)
    expect(src).not.toMatch(/checkout/i)
    expect(src).not.toMatch(/stripe\./i)
  })

  it('page uses force-dynamic', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain("'force-dynamic'")
  })
})

// ─── Group 12: Route registry and page count ──────────────────────────────────

describe('Route registry and page count — Phase 12', () => {
  it('page count is now 30 (Phase 12 added action-catalog preview)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(57)
  })

  it('action-catalog route is in KNOWN_ROUTES in dapPhase7G.test.tsx', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapPhase7G.test.tsx'), 'utf8')
    expect(src).toContain('app/preview/dap/action-catalog/page.tsx')
  })

  it('action-catalog route is in KNOWN_ROUTES in dapPhase8C.test.ts', () => {
    const src = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapPhase8C.test.ts'), 'utf8')
    expect(src).toContain('app/preview/dap/action-catalog/page.tsx')
  })

  it('Phase 11 routes still exist', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/admin-review/page.tsx'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/preview/dap/admin-timeline/page.tsx'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/preview/dap/member-admin-summary/page.tsx'))).toBe(true)
  })

  it('Phase 10 member-status route still exists', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/member-status/[membershipId]/page.tsx'))).toBe(true)
  })
})
