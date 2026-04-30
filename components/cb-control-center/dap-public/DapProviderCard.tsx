import type { DapProviderCardModel, DapAvailabilityState } from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapPublicCta } from './DapPublicCta'
import { DapStatusBadge } from './DapStatusBadge'

interface DapProviderCardProps {
  model: DapProviderCardModel
  previewMode?: boolean
}

// Top accent bar color per availability state
const STATE_ACCENT_BG: Record<DapAvailabilityState, string> = {
  confirmed:                 'bg-emerald-400',
  not_confirmed:             'bg-gray-200',
  requested:                 'bg-blue-300',
  requestable:               'bg-blue-200',
  unavailable_internal_only: 'bg-gray-100',
}

export function DapProviderCard({ model, previewMode = false }: DapProviderCardProps) {
  if (!model.isPublic && !previewMode) return null

  const isInternal = model.availabilityState === 'unavailable_internal_only'
  const accentClass = STATE_ACCENT_BG[model.availabilityState]

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm ${
        isInternal
          ? 'border-dashed border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-100 bg-white'
      }`}
      data-practice-id={model.practiceId}
      data-availability-state={model.availabilityState}
      data-is-public={model.isPublic}
    >
      {/* State accent bar */}
      {!isInternal && (
        <div className={`h-1 w-full ${accentClass}`} aria-hidden />
      )}

      <div className="px-4 py-4 space-y-3">
        {/* Header: name + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-base font-semibold text-gray-900 leading-tight truncate">
              {model.practiceName}
            </p>
            <p className="text-xs text-gray-400">{model.city}, {model.state}</p>
          </div>
          <DapStatusBadge badge={model.statusBadge} showInternalWarning={previewMode} />
        </div>

        {/* Internal-only warning (preview only) */}
        {isInternal && previewMode && (
          <p className="text-xs text-red-500 italic" data-internal-only-warning>
            Internal only — this practice does not appear to patients.
          </p>
        )}

        {/* Allowed claim */}
        {!isInternal && model.allowedClaims.length > 0 && (
          <p className="text-xs text-gray-500 leading-relaxed" data-safe-description>
            {model.allowedClaims[0]}
          </p>
        )}

        {/* CTAs */}
        {!isInternal && (
          <div className="flex flex-wrap gap-2 pt-1">
            <DapPublicCta cta={model.primaryCta} />
            {model.secondaryCta && (
              <DapPublicCta
                cta={model.secondaryCta}
                className="text-sm font-normal border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
