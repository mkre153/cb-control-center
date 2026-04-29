import { MockModeBanner } from '@/components/cb-control-center/MockModeBanner'
import { ControlCenterHeader } from '@/components/cb-control-center/ControlCenterHeader'
import { InitialInputCard } from '@/components/cb-control-center/InitialInputCard'
import { SimulationShell } from '@/components/cb-control-center/SimulationShell'
import { MOCK_INITIAL_INPUT } from '@/lib/cb-control-center/mockData'

export default function CBControlCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <MockModeBanner />
        <ControlCenterHeader />
        <InitialInputCard input={MOCK_INITIAL_INPUT} />
        <SimulationShell />
      </div>
    </div>
  )
}
