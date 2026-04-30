import Link from 'next/link'
import { REQUEST_CONFIRMATION_COPY, DIRECTORY_ROUTE } from '@/lib/cb-control-center/dapDisplayRules'

export default function RequestConfirmationPage() {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <span className="text-green-600 text-xl font-bold">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Request received</h1>
        <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          We'll use your request to identify patient demand and may reach out to practices in your area.
          We'll notify you if a DAP provider joins near you.
        </p>
      </div>

      {/* Required expectation copy */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 space-y-1">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Important</p>
        <p className="text-sm text-gray-600 leading-relaxed">{REQUEST_CONFIRMATION_COPY}</p>
      </div>

      <div className="space-y-2 text-xs text-gray-500">
        <p>
          Dental Advantage Plan is a directory and demand-generation platform. Submitting a request does not
          create a membership, guarantee a provider, or obligate any dental practice.
          Each practice that joins DAP sets its own pricing.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={DIRECTORY_ROUTE}
          className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Back to directory
        </Link>
        <Link
          href="/preview/dap/request"
          className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Submit another request
        </Link>
      </div>
    </>
  )
}
