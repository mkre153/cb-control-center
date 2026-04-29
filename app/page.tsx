import { MockModeBanner } from '@/components/cb-control-center/MockModeBanner'
import { ControlCenterHeader } from '@/components/cb-control-center/ControlCenterHeader'
import { BusinessSummaryCard } from '@/components/cb-control-center/BusinessSummaryCard'
import { CurrentCommandCard } from '@/components/cb-control-center/CurrentCommandCard'
import { PipelineStageGrid } from '@/components/cb-control-center/PipelineStageGrid'
import { ControlCenterTabs } from '@/components/cb-control-center/ControlCenterTabs'
import {
  MOCK_BUSINESS,
  MOCK_CURRENT_COMMAND,
  MOCK_PIPELINE_STAGES,
  MOCK_CRAWL_OUTPUT,
  MOCK_BUSINESS_TRUTH,
  MOCK_BLOCKERS,
  MOCK_STRATEGY,
  MOCK_PAGES,
  MOCK_ACTIVITY,
} from '@/lib/cb-control-center/mockData'

export default function CBControlCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <MockModeBanner />
        <ControlCenterHeader />
        <BusinessSummaryCard business={MOCK_BUSINESS} />
        <CurrentCommandCard command={MOCK_CURRENT_COMMAND} />
        <PipelineStageGrid stages={MOCK_PIPELINE_STAGES} />
        <ControlCenterTabs
          crawlOutput={MOCK_CRAWL_OUTPUT}
          businessTruth={MOCK_BUSINESS_TRUTH}
          blockers={MOCK_BLOCKERS}
          strategy={MOCK_STRATEGY}
          pages={MOCK_PAGES}
          activity={MOCK_ACTIVITY}
        />
      </div>
    </div>
  )
}
