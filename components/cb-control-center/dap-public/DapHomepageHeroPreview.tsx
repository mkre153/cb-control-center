import type { DapHomepageHeroModel } from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapPublicCta } from './DapPublicCta'

interface DapHomepageHeroPreviewProps {
  model: DapHomepageHeroModel
  showPreviewLabel?: boolean
}

export function DapHomepageHeroPreview({ model, showPreviewLabel = true }: DapHomepageHeroPreviewProps) {
  return (
    <div
      className="relative rounded-2xl bg-gray-900 text-white px-8 py-12 space-y-6 overflow-hidden"
      data-implies-universal-availability={String(model.impliesUniversalAvailability)}
      data-homepage-hero
    >
      {/* Background texture — subtle grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        aria-hidden
      />

      <div className="relative space-y-5 max-w-lg">
        <h1
          className="text-3xl font-bold leading-tight tracking-tight"
          data-homepage-headline
        >
          {model.headline}
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed" data-homepage-subheadline>
          {model.subheadline}
        </p>
      </div>

      {/* Search shell — preview only, non-interactive */}
      <div className="relative rounded-xl bg-white/10 border border-white/20 px-4 py-3 flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="City, ZIP, or dentist name"
          disabled
          aria-label="Search (preview — not active)"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none cursor-not-allowed"
        />
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="text-xs font-semibold text-gray-300 px-3 py-1.5 rounded-lg bg-white/10 cursor-not-allowed whitespace-nowrap"
        >
          Search
        </button>
      </div>

      {/* Primary CTAs */}
      <div className="relative flex flex-wrap gap-3">
        <DapPublicCta cta={model.primaryCta} />
        <DapPublicCta
          cta={model.secondaryCta}
          className="border border-white/30 text-white bg-white/10 hover:bg-white/20"
        />
      </div>

      {/* Preview indicator — shown in preview contexts only */}
      {showPreviewLabel && (
        <div className="relative pt-2 border-t border-white/10">
          <span className="text-xs text-gray-400" data-preview-label>
            Design preview — not a public route
          </span>
        </div>
      )}
    </div>
  )
}
