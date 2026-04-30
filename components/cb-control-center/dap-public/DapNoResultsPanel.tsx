import type { DapNoResultsModel } from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapPublicCta } from './DapPublicCta'

interface DapNoResultsPanelProps {
  model: DapNoResultsModel
}

export function DapNoResultsPanel({ model }: DapNoResultsPanelProps) {
  return (
    <div
      className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-6 space-y-5"
      data-is-dead-end={String(model.isDeadEnd)}
      data-no-results-panel
    >
      {/* Icon + headline */}
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold"
          aria-hidden
        >
          ?
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold text-blue-900" data-no-results-headline>
            {model.headline}
          </p>
          <p className="text-sm text-blue-700 leading-relaxed">{model.body}</p>
        </div>
      </div>

      {/* Request CTAs — primary action */}
      <div className="flex flex-col gap-2">
        <DapPublicCta cta={model.primaryCta} />
        {model.secondaryCta && (
          <DapPublicCta cta={model.secondaryCta} />
        )}
      </div>

      {/* Consent / expectation caveat */}
      <p className="text-xs text-blue-600/70 border-t border-blue-200 pt-3" data-request-caveat>
        Submitting a request does not guarantee DAP availability. It helps DAP understand where
        patients want coverage.
      </p>
    </div>
  )
}
