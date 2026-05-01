// CBCC adapter — DAP (Dental Advantage Plan) project metadata.
//
// This file describes a single concrete project for the generic engine. The
// engine itself is vertical-neutral; the project metadata, stage instances,
// and approval state below are DAP-specific and live ONLY in this adapter
// directory. The generic core (lib/cbcc/*.ts) does not import any of this.
//
// Identity
//   id      : 'dental-advantage-plan'  (engine-canonical project id)
//   slug    : 'dental-advantage-plan'  (URL-safe slug; same as id by choice)
//   name    : 'Dental Advantage Plan'  (display)
//   short   : 'DAP'                    (display, breadcrumbs, log lines)
//   vertical: 'dental-membership-registry'
//
// State
//   Stage 1 ('definition')  is approved as of 2026-04-30 (owner-recorded).
//   Stages 2–7 are not_started; locking is computed by stageLocking from the
//   predecessor approval rule. Notably, this gives Stage 2 unlocked, Stages
//   3–7 locked at construction time, and the engine's deterministic rules —
//   not the adapter — answer "is X locked?" at runtime.

import type { CbccProject, CbccStage } from '../../types'

export const DAP_PROJECT_ID = 'dental-advantage-plan'
export const DAP_PROJECT_SLUG = 'dental-advantage-plan'
export const DAP_PROJECT_NAME = 'Dental Advantage Plan'
export const DAP_PROJECT_SHORT_NAME = 'DAP'
export const DAP_PROJECT_VERTICAL = 'dental-membership-registry'
export const DAP_ADAPTER_KEY = 'dap'

const DAP_PROJECT_CREATED_AT = '2026-04-30T00:00:00.000Z'
const DAP_PROJECT_UPDATED_AT = '2026-05-01T00:00:00.000Z'

// Canonical 7-stage instance list. The engine's stage-locking module uses the
// status field on each stage to compute lock state for downstream stages — it
// is a programmer error to set a downstream stage to anything but a non-
// blocking status when its predecessors are not approved.
const DAP_STAGE_INSTANCES: ReadonlyArray<CbccStage> = [
  {
    id: 'definition',
    order: 1,
    status: 'approved',
    approval: {
      decidedBy: 'Owner',
      decidedAt: '2026-04-30T00:00:00.000Z',
      notes: 'Stage 1 approved as part of Phase 18E (CBCC workspace shell).',
    },
  },
  { id: 'discovery', order: 2, status: 'not_started' },
  { id: 'truth-schema', order: 3, status: 'not_started' },
  { id: 'positioning', order: 4, status: 'not_started' },
  { id: 'content-strategy', order: 5, status: 'not_started' },
  { id: 'architecture', order: 6, status: 'not_started' },
  { id: 'build-launch', order: 7, status: 'not_started' },
] as const

export const DAP_PROJECT: CbccProject = Object.freeze({
  id: DAP_PROJECT_ID,
  slug: DAP_PROJECT_SLUG,
  name: DAP_PROJECT_NAME,
  description:
    'Patient-facing registry that helps people without dental insurance find participating dental practices that offer practice-managed membership plans.',
  adapterKey: DAP_ADAPTER_KEY,
  status: 'active',
  stages: DAP_STAGE_INSTANCES,
  createdAt: DAP_PROJECT_CREATED_AT,
  updatedAt: DAP_PROJECT_UPDATED_AT,
})
