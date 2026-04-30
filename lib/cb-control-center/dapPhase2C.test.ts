// Phase 2C — Admin Decision Visibility Polish
// CB Control Center makes enrollment decisions. MKCRM does not. Payment systems do not.
// Pure read-only visibility models. No email sending. No PHI. No payment CTAs.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

import {
  getDapAdminDecisionVisibilityModel,
  getAllDapAdminDecisionVisibilityModels,
  DAP_ADMIN_DECISION_VISIBILITY_STATES,
} from './dapAdminDecisionVisibility'
import type { DapAdminDecisionVisibilityState } from './dapAdminDecisionVisibility'

import {
  getDapAdminRejectionVisibilityModel,
  getAllDapAdminRejectionVisibilityModels,
  DAP_REJECTION_VISIBILITY_TEMPLATE_KEYS,
} from './dapAdminRejectionVisibility'
import type { DapAdminRejectionEmailTemplateKey } from './dapAdminRejectionEmailTypes'

const ALL_VISIBILITY_STATES: DapAdminDecisionVisibilityState[] = [
  'pending',
  'queued_for_review',
  'needs_review',
  'approved',
  'rejected',
]

const ALL_TEMPLATE_KEYS: DapAdminRejectionEmailTemplateKey[] = [
  'practice_enrollment_rejected',
  'practice_participation_rejected',
  'member_enrollment_rejected',
  'membership_activation_rejected',
]

// ─── Phase 2C — Decision visibility: export surface ───────────────────────────

describe('Phase 2C — dapAdminDecisionVisibility export surface', () => {
  it('getDapAdminDecisionVisibilityModel is exported', () => {
    expect(typeof getDapAdminDecisionVisibilityModel).toBe('function')
  })

  it('getAllDapAdminDecisionVisibilityModels is exported', () => {
    expect(typeof getAllDapAdminDecisionVisibilityModels).toBe('function')
  })

  it('DAP_ADMIN_DECISION_VISIBILITY_STATES has exactly 5 states', () => {
    expect(DAP_ADMIN_DECISION_VISIBILITY_STATES).toHaveLength(5)
  })

  it('DAP_ADMIN_DECISION_VISIBILITY_STATES contains all required values', () => {
    for (const state of ALL_VISIBILITY_STATES) {
      expect(DAP_ADMIN_DECISION_VISIBILITY_STATES).toContain(state)
    }
  })

  it('getAllDapAdminDecisionVisibilityModels returns 5 models', () => {
    expect(getAllDapAdminDecisionVisibilityModels()).toHaveLength(5)
  })

  it('visibility file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapAdminDecisionVisibility.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('visibility file does not import from MKCRM', () => {
    const src = readFileSync(join(__dirname, 'dapAdminDecisionVisibility.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*mkcrm/i)
  })
})

// ─── Phase 2C — Decision visibility: authority flags locked ───────────────────

describe('Phase 2C — decision visibility authority flags are locked on all states', () => {
  for (const state of ALL_VISIBILITY_STATES) {
    it(`${state} has decisionAuthority: cb_control_center`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).decisionAuthority).toBe('cb_control_center')
    })

    it(`${state} has crmAuthority: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).crmAuthority).toBe(false)
    })

    it(`${state} has paymentAuthorityInsideDap: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).paymentAuthorityInsideDap).toBe(false)
    })

    it(`${state} has externalDispatchEnabled: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).externalDispatchEnabled).toBe(false)
    })

    it(`${state} has safety.includesPhi: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).safety.includesPhi).toBe(false)
    })

    it(`${state} has safety.includesPaymentCta: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).safety.includesPaymentCta).toBe(false)
    })
  }
})

// ─── Phase 2C — Decision visibility: per-state fields ────────────────────────

describe('Phase 2C — decision visibility per-state fields', () => {
  it('all states have a non-empty label', () => {
    for (const state of ALL_VISIBILITY_STATES) {
      expect(getDapAdminDecisionVisibilityModel(state).label.length).toBeGreaterThan(0)
    }
  })

  it('all states have a non-empty description', () => {
    for (const state of ALL_VISIBILITY_STATES) {
      expect(getDapAdminDecisionVisibilityModel(state).description.length).toBeGreaterThan(0)
    }
  })

  it('all states have state field matching the requested state', () => {
    for (const state of ALL_VISIBILITY_STATES) {
      expect(getDapAdminDecisionVisibilityModel(state).state).toBe(state)
    }
  })
})

// ─── Phase 2C — Decision visibility: rejected state links to email preview ────

describe('Phase 2C — rejected state links to rejection email preview', () => {
  it('rejected state has communicationPreviewAvailable: true', () => {
    expect(getDapAdminDecisionVisibilityModel('rejected').communicationPreviewAvailable).toBe(true)
  })

  it('rejected state has communicationPreviewPath pointing to admin-rejection-emails', () => {
    const model = getDapAdminDecisionVisibilityModel('rejected')
    expect(model.communicationPreviewPath).toBe('/preview/dap/admin-rejection-emails')
  })

  it('rejected state has 4 applicable rejection templates', () => {
    const model = getDapAdminDecisionVisibilityModel('rejected')
    expect(model.applicableRejectionTemplates).toHaveLength(4)
  })

  it('rejected state lists all 4 template keys', () => {
    const model = getDapAdminDecisionVisibilityModel('rejected')
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(model.applicableRejectionTemplates).toContain(key)
    }
  })
})

// ─── Phase 2C — Decision visibility: non-rejected states have no comms preview ─

describe('Phase 2C — non-rejected states have no communication preview', () => {
  const nonRejected: DapAdminDecisionVisibilityState[] = [
    'pending', 'queued_for_review', 'needs_review', 'approved',
  ]

  for (const state of nonRejected) {
    it(`${state} has communicationPreviewAvailable: false`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).communicationPreviewAvailable).toBe(false)
    })

    it(`${state} has communicationPreviewPath: null`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).communicationPreviewPath).toBeNull()
    })

    it(`${state} has empty applicableRejectionTemplates`, () => {
      expect(getDapAdminDecisionVisibilityModel(state).applicableRejectionTemplates).toHaveLength(0)
    })
  }
})

// ─── Phase 2C — Rejection visibility: export surface ─────────────────────────

describe('Phase 2C — dapAdminRejectionVisibility export surface', () => {
  it('getDapAdminRejectionVisibilityModel is exported', () => {
    expect(typeof getDapAdminRejectionVisibilityModel).toBe('function')
  })

  it('getAllDapAdminRejectionVisibilityModels is exported', () => {
    expect(typeof getAllDapAdminRejectionVisibilityModels).toBe('function')
  })

  it('DAP_REJECTION_VISIBILITY_TEMPLATE_KEYS has exactly 4 values', () => {
    expect(DAP_REJECTION_VISIBILITY_TEMPLATE_KEYS).toHaveLength(4)
  })

  it('getAllDapAdminRejectionVisibilityModels returns 4 models', () => {
    expect(getAllDapAdminRejectionVisibilityModels()).toHaveLength(4)
  })

  it('rejection visibility file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapAdminRejectionVisibility.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})

// ─── Phase 2C — Rejection visibility: authority flags locked ─────────────────

describe('Phase 2C — rejection visibility authority flags are locked on all templates', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} has decisionAuthority: cb_control_center`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).decisionAuthority).toBe('cb_control_center')
    })

    it(`${key} has crmAuthority: false`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).crmAuthority).toBe(false)
    })

    it(`${key} has paymentAuthority: false`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).paymentAuthority).toBe(false)
    })

    it(`${key} has previewOnly: true`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).previewOnly).toBe(true)
    })

    it(`${key} has sent: false`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).sent).toBe(false)
    })

    it(`${key} has safety.includesPhi: false`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).safety.includesPhi).toBe(false)
    })

    it(`${key} has safety.includesPaymentCta: false`, () => {
      expect(getDapAdminRejectionVisibilityModel(key).safety.includesPaymentCta).toBe(false)
    })
  }
})

// ─── Phase 2C — Rejection visibility: per-template fields ────────────────────

describe('Phase 2C — rejection visibility per-template fields', () => {
  it('all templates have previewPath: /preview/dap/admin-rejection-emails', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(getDapAdminRejectionVisibilityModel(key).previewPath).toBe(
        '/preview/dap/admin-rejection-emails'
      )
    }
  })

  it('all templates have templateKey field matching the requested key', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(getDapAdminRejectionVisibilityModel(key).templateKey).toBe(key)
    }
  })

  it('practice templates have audience: practice_admin', () => {
    expect(getDapAdminRejectionVisibilityModel('practice_enrollment_rejected').audience).toBe('practice_admin')
    expect(getDapAdminRejectionVisibilityModel('practice_participation_rejected').audience).toBe('practice_admin')
  })

  it('member templates have audience: member', () => {
    expect(getDapAdminRejectionVisibilityModel('member_enrollment_rejected').audience).toBe('member')
    expect(getDapAdminRejectionVisibilityModel('membership_activation_rejected').audience).toBe('member')
  })
})

// ─── Phase 2C — Request detail page: decision visibility panel ────────────────

describe('Phase 2C — request detail page has decision visibility panel', () => {
  const src = readFileSync(
    join(__dirname, '../../app/preview/dap/requests/[id]/page.tsx'),
    'utf8'
  )

  it('page imports getDapAdminDecisionVisibilityModel', () => {
    expect(src).toContain('getDapAdminDecisionVisibilityModel')
  })

  it('page has data-decision-visibility-panel marker', () => {
    expect(src).toContain('data-decision-visibility-panel')
  })

  it('page renders decisionAuthority: cb_control_center', () => {
    expect(src).toContain('cb_control_center')
  })

  it('page renders crmAuthority false marker', () => {
    expect(src).toContain('data-crm-authority="false"')
  })

  it('page renders paymentAuthority false marker', () => {
    expect(src).toContain('data-payment-authority="false"')
  })

  it('page renders externalDispatch false marker', () => {
    expect(src).toContain('data-dispatch-enabled="false"')
  })

  it('page renders link to rejection email preview for rejected state', () => {
    expect(src).toContain('data-rejection-email-preview-link')
    expect(src).toContain('/preview/dap/admin-rejection-emails')
  })

  it('page does not render a send button in the visibility panel', () => {
    expect(src).not.toContain('send email')
    expect(src).not.toContain('data-action="send"')
  })
})
