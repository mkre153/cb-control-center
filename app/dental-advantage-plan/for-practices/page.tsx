import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Dental Practices — Join the DAP Directory',
  description:
    'Learn how participating in the Dental Advantage Plan directory can help your practice connect with patients seeking direct membership plan options.',
}

export default function ForPracticesPage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="for_practices"
      data-implies-payment="false"
      data-implies-insurance="false"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          For Dental Practices
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Dental Advantage Plan is a patient discovery directory — not a payment processor, claims adjudicator, or insurance network. Participating practices set their own membership terms and fees.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">What participation means</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
            <span>Your practice appears in the DAP directory when patients search for membership plan dentists near them.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
            <span>You set your own annual membership fee, inclusions, and terms — DAP does not dictate clinical or pricing decisions.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
            <span>Patients who find your practice through DAP contact you directly — no referral fees, no claims processing.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
            <span>Confirmation and listing approval is handled through CB Control Center — your participation is documented and verified before any public listing appears.</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">What participation does not mean</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">✗</span>
            <span>DAP does not collect patient payments on your behalf.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">✗</span>
            <span>DAP does not adjudicate claims or determine clinical eligibility.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">✗</span>
            <span>Participation does not bind your practice to any guarantee of patient volume or savings amounts.</span>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 space-y-3">
        <p className="text-sm font-semibold text-blue-900">Ready to get listed?</p>
        <p className="text-sm text-blue-800">
          Practices interested in participating can begin the onboarding process below. Listing is subject to confirmation and approval.
        </p>
        <Link
          href="/preview/dap/onboarding"
          className="inline-block px-4 py-2 text-sm font-semibold bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Start practice onboarding
        </Link>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          All practice listings are reviewed and confirmed before appearing publicly. DAP does not guarantee listing eligibility for any practice.
        </p>
      </div>
    </main>
  )
}
