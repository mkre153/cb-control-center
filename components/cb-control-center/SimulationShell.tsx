'use client'

import { useState } from 'react'
import { BusinessSummaryCard } from './BusinessSummaryCard'
import { PipelineRuleStrip } from './PipelineRuleStrip'
import { CurrentCommandCard } from './CurrentCommandCard'
import { SimulationControls } from './SimulationControls'
import { PipelineStageGrid } from './PipelineStageGrid'
import { ControlCenterTabs } from './ControlCenterTabs'
import {
  SIMULATION_STATES,
  type SimulationStateId,
} from '@/lib/cb-control-center/simulationStates'
import {
  MOCK_BUSINESS,
  MOCK_CRAWL_OUTPUT,
  MOCK_STRATEGY,
  MOCK_PAGES,
  MOCK_ACTIVITY,
} from '@/lib/cb-control-center/mockData'

export function SimulationShell() {
  const [stateId, setStateId] = useState<SimulationStateId>('current_blocked')
  const snap = SIMULATION_STATES[stateId]

  return (
    <>
      <BusinessSummaryCard
        business={{ ...MOCK_BUSINESS, overallReadiness: snap.readiness }}
      />
      <PipelineRuleStrip />
      <CurrentCommandCard command={snap.command} />
      <SimulationControls currentState={stateId} onStateChange={setStateId} />
      <PipelineStageGrid
        stages={snap.stages}
        currentStageName={snap.command.stage}
      />
      <ControlCenterTabs
        crawlOutput={MOCK_CRAWL_OUTPUT}
        businessTruthSchema={snap.schema}
        blockers={snap.blockers}
        strategy={MOCK_STRATEGY}
        pages={MOCK_PAGES}
        activity={MOCK_ACTIVITY}
      />
    </>
  )
}
