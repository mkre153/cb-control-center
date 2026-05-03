import Link from 'next/link'
import { REQUEST_FLOW_ROUTE } from '@/lib/dap/registry/dapDisplayRules'

const STEPS = [
  {
    number: '1',
    title: 'Search your area',
    body: 'Enter your ZIP code to find dental practices confirmed to offer an in-house Dental Advantage Plan.',
  },
  {
    number: '2',
    title: 'No match? Request one',
    body: 'If no confirmed provider is near you, tell us which dentist you already visit. We\'ll reach out to them about joining.',
  },
  {
    number: '3',
    title: 'We\'ll keep you posted',
    body: 'We contact the practice on your behalf. If they join, we\'ll notify you. No commitment required from you.',
  },
]

export function HowItWorksSection() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-8">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-6">How it works</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STEPS.map(step => (
          <div key={step.number} className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center">
              {step.number}
            </div>
            <p className="text-sm font-semibold text-gray-800">{step.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3">
          DAP is a directory and demand-generation platform. We connect patients and practices —
          we do not manage appointments, insurance, or billing.
          Each practice sets its own membership pricing.
        </p>
        <Link
          href={REQUEST_FLOW_ROUTE}
          className="inline-flex items-center text-xs font-medium text-green-700 hover:text-green-800"
        >
          Request a dentist near me →
        </Link>
      </div>
    </div>
  )
}
