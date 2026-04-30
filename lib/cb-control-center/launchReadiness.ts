import type { EnrichedBlocker } from './types'

export type LaunchCapabilityStatus = 'yes' | 'no' | 'partial'

export interface LaunchCapability {
  question: string
  status: LaunchCapabilityStatus
  reason?: string
}

export function getLaunchReadiness(blockers: EnrichedBlocker[]): LaunchCapability[] {
  const open = new Set(
    blockers.filter(b => b.resolutionStatus === 'open').map(b => b.id)
  )

  const eb001 = open.has('eb-001')
  const eb002 = open.has('eb-002')
  const eb003 = open.has('eb-003')
  const eb004 = open.has('eb-004')

  return [
    {
      question: 'Can publish education pages?',
      status: 'partial',
      reason: 'No pricing or provider claims',
    },
    {
      question: 'Can publish provider pages?',
      status: eb001 ? 'no' : 'yes',
      reason: eb001 ? 'Provider participation not confirmed' : undefined,
    },
    {
      question: 'Can show "dentists near you"?',
      status: eb001 ? 'no' : 'yes',
      reason: eb001 ? 'Provider participation not confirmed' : undefined,
    },
    {
      question: 'Can show "Join plan"?',
      status: (eb002 || eb004) ? 'no' : 'yes',
      reason: (eb002 && eb004)
        ? 'Offer terms and CTA gate unconfirmed'
        : eb002
        ? 'Offer terms not confirmed'
        : eb004
        ? 'CTA gate not defined'
        : undefined,
    },
    {
      question: 'Can show savings examples?',
      status: eb002 ? 'no' : 'yes',
      reason: eb002 ? 'Offer terms not confirmed' : undefined,
    },
    {
      question: 'Can collect patient requests?',
      status: eb003 ? 'no' : 'yes',
      reason: eb003 ? 'Request flow not finalized' : undefined,
    },
  ]
}
