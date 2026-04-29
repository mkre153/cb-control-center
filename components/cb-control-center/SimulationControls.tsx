import type { SimulationStateId } from '@/lib/cb-control-center/simulationStates'
import { SIMULATION_STATE_ORDER, SIMULATION_STATES } from '@/lib/cb-control-center/simulationStates'

interface SimulationControlsProps {
  currentState: SimulationStateId
  onStateChange: (id: SimulationStateId) => void
}

export function SimulationControls({ currentState, onStateChange }: SimulationControlsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Simulation Controls</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Mock-only controls for testing stage unlock behavior. No data is saved.
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 shrink-0 ml-3">
          Mock Only
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SIMULATION_STATE_ORDER.map((id, index) => {
          const snap = SIMULATION_STATES[id]
          const isActive = id === currentState
          const isReset = id === 'current_blocked'

          return (
            <button
              key={id}
              onClick={() => onStateChange(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : isReset
                  ? 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {isReset ? `↺ ${snap.label}` : `${index}. ${snap.label}`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
