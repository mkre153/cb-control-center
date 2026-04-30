// Member admin summary — admin-facing complement to the public status page (Phase 10).
// Shows standing source, safety flags, template availability.
// No PHI. No payment CTA. Computed by server.

import type { DapMemberStanding } from './dapMemberStatusTypes'
import type { DapMemberPublicStatus } from './dapMemberStatusPublicTypes'
import {
  getDapMemberStatusReadModel,
  DAP_P10_FIXTURE_MEMBERSHIP_IDS,
} from './dapMemberStatusReadModel'
import { getDapMemberStatusEmailCopy } from './dapMemberStatusEmailCopy'

export interface DapMemberAdminSummary {
  membershipId:                     string
  standing:                         DapMemberStanding
  publicStatus:                     DapMemberPublicStatus
  standingSource:                   'billing_events'
  derivedFromBillingEvents:         true
  includesPaymentCta:               false
  includesPhi:                      false
  computedByServer:                 true
  statusPageSafe:                   boolean
  communicationTemplatesAvailable:  boolean
  communicationTemplateCount:       number
  warnings:                         string[]
}

const SAFETY = {
  derivedFromBillingEvents: true  as const,
  includesPaymentCta:       false as const,
  includesPhi:              false as const,
  computedByServer:         true  as const,
}

export function getDapMemberAdminSummary(membershipId: string): DapMemberAdminSummary {
  const readModel = getDapMemberStatusReadModel(membershipId)
  const copy      = getDapMemberStatusEmailCopy(readModel.standing)
  const warnings: string[] = []

  if (readModel.standing === 'unknown') {
    warnings.push('Standing could not be determined from available billing events.')
  }

  const statusPageSafe =
    readModel.safety.includesPhi === false &&
    readModel.safety.includesPaymentCta === false

  const templateCount = copy ? 1 : 0

  return {
    membershipId,
    standing:       readModel.standing,
    publicStatus:   readModel.publicStatus,
    standingSource: 'billing_events',
    ...SAFETY,
    statusPageSafe,
    communicationTemplatesAvailable: templateCount > 0,
    communicationTemplateCount:      templateCount,
    warnings,
  }
}

export function getAllDapMemberAdminSummaries(): DapMemberAdminSummary[] {
  return DAP_P10_FIXTURE_MEMBERSHIP_IDS.map(getDapMemberAdminSummary)
}
