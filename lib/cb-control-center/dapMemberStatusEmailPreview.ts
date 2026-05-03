// DAP member standing is derived from append-only Client Builder Pro billing events.
// MKCRM does not determine billing status.
// Preview-only notification copy — no email sending.

import type { DapMemberStanding, DapMemberStatusReadModel } from '../dap/membership/dapMemberStatusTypes'
import type { DapMemberStatusEmailCopy } from './dapMemberStatusEmailTypes'
import { getDapMemberStatusEmailCopy } from './dapMemberStatusEmailCopy'
import { getDapMemberStatusPreview } from '../dap/membership/dapMemberStatusPreview'

// ─── Result type ──────────────────────────────────────────────────────────────

export interface DapMemberStatusEmailPreview {
  membershipId:  string
  standing:      DapMemberStanding
  readModel:     DapMemberStatusReadModel
  copy:          DapMemberStatusEmailCopy
  source: {
    derivedFromBillingEvents: true
    billingSource:            'client_builder_pro'
    crmAuthority:             false
  }
}

// ─── Preview for a specific membership (uses Phase 9R fixture data) ────────────

export function getDapMemberStatusEmailPreview(membershipId: string): DapMemberStatusEmailPreview {
  const preview = getDapMemberStatusPreview(membershipId)
  const { readModel } = preview
  const copy = getDapMemberStatusEmailCopy(readModel.standing)

  return {
    membershipId,
    standing:  readModel.standing,
    readModel,
    copy,
    source: {
      derivedFromBillingEvents: true,
      billingSource:            'client_builder_pro',
      crmAuthority:             false,
    },
  }
}

// ─── All eight template previews (one per standing) ───────────────────────────

const ALL_STANDINGS: DapMemberStanding[] = [
  'unknown', 'pending', 'active', 'past_due',
  'payment_failed', 'canceled', 'refunded', 'chargeback',
]

export function getAllDapMemberStatusEmailPreviews(): DapMemberStatusEmailPreview[] {
  return ALL_STANDINGS.map(standing => {
    const copy       = getDapMemberStatusEmailCopy(standing)
    const templateId = `mem-template-${standing.replace(/_/g, '-')}`
    const readModel: DapMemberStatusReadModel = {
      verticalKey:              'dap',
      membershipId:             templateId,
      standing,
      derivedFromBillingEvents: true,
      eventCount:               0,
      reasons:                  ['preview template'],
    }
    return {
      membershipId:  templateId,
      standing,
      readModel,
      copy,
      source: {
        derivedFromBillingEvents: true,
        billingSource:            'client_builder_pro',
        crmAuthority:             false,
      },
    }
  })
}
