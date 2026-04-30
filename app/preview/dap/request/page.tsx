import Link from 'next/link'
import { DIRECTORY_ROUTE } from '@/lib/cb-control-center/dapDisplayRules'
import { DapRequestFlowPreview } from '@/components/cb-control-center/dap-public/DapRequestFlowPreview'
import { getRequestFlowModel } from '@/lib/cb-control-center/dapPublicUxRules'

export default function RequestDentistPage() {
  const model = getRequestFlowModel('city_availability')

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href={DIRECTORY_ROUTE}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to directory
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Request a DAP dentist near you</h1>
        <p className="text-sm text-gray-500">
          No DAP provider nearby? Submit a request and we&apos;ll identify demand in your area.
        </p>
      </div>

      {/* Canonical wired request form — live submission to POST /api/dap/requests */}
      <DapRequestFlowPreview
        model={model}
        wired={true}
        sourcePath="/preview/dap/request"
      />

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">About this form</p>
        <p>
          Dental Advantage Plan is a directory and demand-generation platform.
          Submitting this form does not create a membership, guarantee a provider, or obligate any practice.
          Each practice that joins DAP sets its own membership pricing.
        </p>
      </div>
    </>
  )
}
