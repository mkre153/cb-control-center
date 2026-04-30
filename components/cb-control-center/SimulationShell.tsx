'use client'

import { useState, useMemo } from 'react'
import { CommandHeader } from './CommandHeader'
import { PipelineBar } from './PipelineBar'
import { CurrentStagePanel } from './CurrentStagePanel'
import { BlockerTaskList } from './BlockerTaskList'
import { LaunchReadinessPanel } from './LaunchReadinessPanel'
import { BusinessSummaryCard } from './BusinessSummaryCard'
import { InitialInputCard } from './InitialInputCard'
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
  MOCK_INITIAL_INPUT,
  MOCK_STRATEGY,
  MOCK_PAGES,
  MOCK_ACTIVITY,
  BLOCKER_RESOLUTION_PATCHES,
} from '@/lib/cb-control-center/mockData'
import { getLaunchReadiness } from '@/lib/cb-control-center/launchReadiness'
import type { EnrichedBlocker } from '@/lib/cb-control-center/types'

type ResolutionType = 'confirm' | 'defer'
type ViewMode = 'operator' | 'developer'

function CollapsiblePipelineNote() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-gray-300">{open ? '▼' : '▶'}</span>
        How this pipeline works
      </button>
      {open && <div className="mt-2"><PipelineRuleStrip /></div>}
    </div>
  )
}

export function SimulationShell() {
  const [stateId, setStateId] = useState<SimulationStateId>('no_provider_no_data')
  const [localResolutions, setLocalResolutions] = useState<Record<string, ResolutionType>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('operator')

  const snap = SIMULATION_STATES[stateId]

  function handleStateChange(id: SimulationStateId) {
    setStateId(id)
    setLocalResolutions({})
  }

  function handleResolveBlocker(id: string, type: ResolutionType) {
    setLocalResolutions(prev => ({ ...prev, [id]: type }))
  }

  const effectiveSchema = useMemo(() => {
    return Object.entries(localResolutions).reduce((schema, [blockerId, resolutionType]) => {
      const patches = BLOCKER_RESOLUTION_PATCHES[blockerId]?.[resolutionType]
      if (!patches) return schema
      return patchSchema(schema, patches)
    }, snap.schema)
  }, [snap.schema, localResolutions])

  const effectiveBlockers: EnrichedBlocker[] = useMemo(() => {
    return snap.blockers.map(b =>
      localResolutions[b.id] !== undefined
        ? { ...b, resolutionStatus: 'resolved' as const }
        : b
    )
  }, [snap.blockers, localResolutions])

  const effectiveReadiness = schemaReadiness(effectiveSchema)

  const allCurrentBlockersResolved =
    effectiveBlockers.filter(b => b.resolutionStatus === 'open').length === 0 &&
    Object.keys(localResolutions).length > 0

  const currentIndex = SIMULATION_STATE_ORDER.indexOf(stateId)
  const nextStateId = currentIndex < SIMULATION_STATE_ORDER.length - 1
    ? SIMULATION_STATE_ORDER[currentIndex + 1]
    : null

  const tabsKey = `${viewMode}-${stateId}`

  return (
    <div className="space-y-5">
      {/* Command Header — always visible */}
      <CommandHeader
        businessName={MOCK_BUSINESS.name}
        category={MOCK_BUSINESS.category}
        stage={snap.command.stage}
        status={snap.command.status}
        readiness={effectiveReadiness}
        primaryBlocker={snap.command.primaryBlocker}
        correctNextAction={snap.command.correctNextAction}
        allBlockersResolved={allCurrentBlockersResolved}
        nextStateLabel={nextStateId ? SIMULATION_STATES[nextStateId].label : undefined}
        onAdvance={nextStateId ? () => handleStateChange(nextStateId) : undefined}
        showMockMode
      />

      {/* Sticky pipeline bar — always visible */}
      <PipelineBar stages={snap.stages} currentStageName={snap.command.stage} />

      {/* View toggle */}
      <div className="flex items-center border-b border-gray-200">
        {(['operator', 'developer'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              viewMode === mode
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode === 'operator' ? 'Operator View' : 'Developer View'}
          </button>
        ))}
      </div>

      {/* ── OPERATOR VIEW ── */}
      {viewMode === 'operator' && (
        <>
          {/* 2-col workspace */}
          <div id="blockers-workspace" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CurrentStagePanel command={snap.command} />
            <BlockerTaskList
              blockers={effectiveBlockers}
              onResolveBlocker={handleResolveBlocker}
            />
          </div>

          {/* Launch readiness */}
          <LaunchReadinessPanel capabilities={getLaunchReadiness(effectiveBlockers)} />

          {/* Advance banner when all blockers resolved */}
          {allCurrentBlockersResolved && nextStateId && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-800">All blockers resolved — mock mode</p>
                <p className="text-xs text-green-700 mt-0.5">
                  In production, this would unlock {SIMULATION_STATES[nextStateId].label}. Click to advance the simulation.
                </p>
              </div>
              <button
                onClick={() => handleStateChange(nextStateId)}
                className="shrink-0 px-4 py-2 text-sm font-semibold bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
              >
                Advance → {SIMULATION_STATES[nextStateId].label}
              </button>
            </div>
          )}

          {/* Tabs — default to blockers in operator view */}
          <ControlCenterTabs
            key={tabsKey}
            defaultTab="blockers"
            crawlOutput={MOCK_CRAWL_OUTPUT}
            businessTruthSchema={effectiveSchema}
            blockers={effectiveBlockers}
            strategy={MOCK_STRATEGY}
            pages={MOCK_PAGES}
            activity={MOCK_ACTIVITY}
            onResolveBlocker={handleResolveBlocker}
          />

          <CollapsiblePipelineNote />
        </>
      )}

      {/* ── DEVELOPER VIEW ── */}
      {viewMode === 'developer' && (
        <>
          <InitialInputCard input={MOCK_INITIAL_INPUT} />
          <BusinessSummaryCard
            business={{ ...MOCK_BUSINESS, overallReadiness: effectiveReadiness }}
          />
          <CurrentCommandCard
            command={snap.command}
            allBlockersResolved={allCurrentBlockersResolved}
            nextStateLabel={nextStateId ? SIMULATION_STATES[nextStateId].label : undefined}
            onAdvance={nextStateId ? () => handleStateChange(nextStateId) : undefined}
          />
          <SimulationControls currentState={stateId} onStateChange={handleStateChange} />
          <PipelineStageGrid stages={snap.stages} currentStageName={snap.command.stage} />
          <PipelineRuleStrip />
          <ControlCenterTabs
            key={tabsKey}
            defaultTab="crawl-output"
            crawlOutput={MOCK_CRAWL_OUTPUT}
            businessTruthSchema={effectiveSchema}
            blockers={effectiveBlockers}
            strategy={MOCK_STRATEGY}
            pages={MOCK_PAGES}
            activity={MOCK_ACTIVITY}
            onResolveBlocker={handleResolveBlocker}
          />
        </>
      )}
    </div>
  )
}
