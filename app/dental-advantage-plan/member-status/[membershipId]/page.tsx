// Public member status page.
// Displays standing derived server-side from billing events.
// No PHI. No payment CTAs. No raw billing events. No MKCRM authority.
// Client Builder Pro is the payment system. DAP is the registry.

import type { Metadata } from 'next'
import {
  getDapMemberStatusReadModel,
  isDapMembershipKnown,
} from '@/lib/dap/membership/dapMemberStatusReadModel'
import type { DapMemberPublicStatus } from '@/lib/dap/membership/dapMemberStatusPublicTypes'

export const dynamic = 'force-dynamic'

type Params = Promise<{ membershipId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return {
    title: 'Membership Status | Dental Advantage Plan',
    description: 'Check the current standing of your Dental Advantage Plan membership.',
  }
}

function statusBadgeClass(status: DapMemberPublicStatus): string {
  switch (status) {
    case 'active':           return 'bg-green-50 text-green-700 border border-green-200'
    case 'pending':          return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'attention_needed': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'inactive':         return 'bg-gray-100 text-gray-600 border border-gray-300'
    case 'unknown':          return 'bg-gray-50 text-gray-500 border border-gray-200'
  }
}

export default async function MemberStatusPage({ params }: { params: Params }) {
  const { membershipId } = await params

  if (!isDapMembershipKnown(membershipId)) {
    return (
      <main
        className="max-w-lg mx-auto px-4 py-12 space-y-6"
        data-page-kind="member_status"
        data-member-found="false"
        data-implies-phi="false"
        data-implies-payment="false"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Dental Advantage Plan
          </p>
          <h1 className="text-xl font-semibold text-gray-900">Membership Status</h1>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
          <p className="text-sm font-semibold text-gray-800">
            We could not find a membership with this ID.
          </p>
          <p className="font-mono text-xs text-gray-400 break-all">{membershipId}</p>
          <p className="text-sm text-gray-600">
            Please check the number and try again, or contact your dental practice for assistance.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">
            DAP does not store or process payments. Membership status is derived from your enrollment record.
          </p>
        </div>
      </main>
    )
  }

  const model = getDapMemberStatusReadModel(membershipId)

  return (
    <main
      className="max-w-lg mx-auto px-4 py-12 space-y-6"
      data-page-kind="member_status"
      data-member-found="true"
      data-public-status={model.publicStatus}
      data-implies-phi="false"
      data-implies-payment="false"
      data-standing-derived="true"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Dental Advantage Plan
        </p>
        <h1 className="text-xl font-semibold text-gray-900">Membership Status</h1>
        <p className="font-mono text-xs text-gray-400" data-membership-id>{model.membershipId}</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4" data-status-card>
        <div>
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${statusBadgeClass(model.publicStatus)}`}
            data-public-status={model.publicStatus}
          >
            {model.statusLabel}
          </span>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed" data-status-summary>
          {model.statusSummary}
        </p>

        <div className="rounded-md bg-gray-50 border border-gray-100 px-4 py-3" data-next-step>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            What to do next
          </p>
          <p className="text-sm text-gray-700">{model.nextStep}</p>
        </div>
      </section>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Membership status is derived from your enrollment record.
          Plan details and availability vary by participating dental practice.
          DAP does not process payments.
        </p>
      </div>
    </main>
  )
}
