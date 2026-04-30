'use client'

import { useState, useMemo } from 'react'
import { BusinessSummaryCard } from './BusinessSummaryCard'
import { PipelineRuleStrip } from './PipelineRuleStrip'
import { CurrentCommandCard } from './CurrentCommandCard'
import { SimulationControls } from './SimulationControls'
import { PipelineStageGrid } from './PipelineStageGrid'
import { ControlCenterTabs } from './ControlCenterTabs'
import {
  SIMULATION_STATES,
  SIMULATION_STATE_ORDER,
  patchSchema,
  schemaReadiness,
  type SimulationStateId,
} from '@/lib/cb-control-center/simulationStates'
import {
  MOCK_BUSINESS,
  MOCK_CRAWL_OUTPUT,
  MOCK_STRATEGY,
  MOCK_PAGES,
  MOCK_ACTIVITY,
  BLOCKER_RESOLUTION_PATCHES,
} from '@/lib/cb-control-center/mockData'
import type { EnrichedBlocker } from '@/lib/cb-control-center/types'

type ResolutionType = 'confirm' | 'defer'

export function SimulationShell() {
  const [stateId, setStateId] = useState<SimulationStateId>('no_provider_no_data')
  const [localResolutions, setLocalResolutions] = useState<Record<string, ResolutionType>>({})

  const snap = SIMULATION_STATES[stateId]

  // Reset local resolutions when jumping to a simulation state
  function handleStateChange(id: SimulationStateId) {
    setStateId(id)
    setLocalResolutions({})
  }

  // Apply a blocker resolution — patches schema fields and marks blocker resolved
  function handleResolveBlocker(id: string, type: ResolutionType) {
    setLocalResolutions(prev => ({ ...prev, [id]: type }))
  }

  // Layer local resolution patches on top of the simulation snapshot schema
  const effectiveSchema = useMemo(() => {
    return Object.entries(localResolutions).reduce((schema, [blockerId, resolutionType]) => {
      const patches = BLOCKER_RESOLUTION_PATCHES[blockerId]?.[resolutionType]
      if (!patches) return schema
      return patchSchema(schema, patches)
    }, snap.schema)
  }, [snap.schema, localResolutions])

  // Merge local resolutions into the blocker list
  const effectiveBlockers: EnrichedBlocker[] = useMemo(() => {
    return snap.blockers.map(b =>
      localResolutions[b.id] !== undefined
        ? { ...b, resolutionStatus: 'resolved' as const }
        : b
    )
  }, [snap.blockers, localResolutions])

  const effectiveReadiness = schemaReadiness(effectiveSchema)

  // If all current-stage blockers are locally resolved, suggest advancing
  const allCurrentBlockersResolved =
    effectiveBlockers.filter(b => b.resolutionStatus === 'open').length === 0 &&
    Object.keys(localResolutions).length > 0

  // Find the next simulation state for the advance suggestion
  const currentIndex = SIMULATION_STATE_ORDER.indexOf(stateId)
  const nextStateId = currentIndex < SIMULATION_STATE_ORDER.length - 1
    ? SIMULATION_STATE_ORDER[currentIndex + 1]
    : null

  return (
    <>
      <BusinessSummaryCard
        business={{ ...MOCK_BUSINESS, overallReadiness: effectiveReadiness }}
      />
      <PipelineRuleStrip />
      <CurrentCommandCard
        command={snap.command}
        allBlockersResolved={allCurrentBlockersResolved}
        nextStateLabel={nextStateId ? SIMULATION_STATES[nextStateId].label : undefined}
        onAdvance={nextStateId ? () => handleStateChange(nextStateId) : undefined}
      />
      <SimulationControls currentState={stateId} onStateChange={handleStateChange} />
      <PipelineStageGrid
        stages={snap.stages}
        currentStageName={snap.command.stage}
      />
      <ControlCenterTabs
        crawlOutput={MOCK_CRAWL_OUTPUT}
        businessTruthSchema={effectiveSchema}
        blockers={effectiveBlockers}
        strategy={MOCK_STRATEGY}
        pages={MOCK_PAGES}
        activity={MOCK_ACTIVITY}
        onResolveBlocker={handleResolveBlocker}
      />
    </>
  )
}
