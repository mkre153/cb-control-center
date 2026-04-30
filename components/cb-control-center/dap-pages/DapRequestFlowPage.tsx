import type { DapRequestFlowModel } from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapRequestFlowPreview } from '@/components/cb-control-center/dap-public/DapRequestFlowPreview'

interface DapRequestFlowPageProps {
  model: DapRequestFlowModel
}

export function DapRequestFlowPage({ model }: DapRequestFlowPageProps) {
  return (
    <div className="space-y-6" data-page-kind="request_flow" data-preview-page>
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Request Dental Advantage Plan</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tell us where you&#39;d like to use DAP. With your consent, we&#39;ll contact dentists in your area
          and notify you when coverage becomes available.
        </p>
      </div>

      {/* Canonical preview surface — DapRequestFlowPreview (Phase 7E) */}
      <DapRequestFlowPreview model={model} />
    </div>
  )
}
