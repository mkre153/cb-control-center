import type { DapCtaModel, DapPublicCtaType } from '@/lib/dap/site/dapPublicUxTypes'

const CTA_BASE = 'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition-colors'

const CTA_STYLES: Record<DapPublicCtaType, string> = {
  join_plan:                 'bg-green-600 hover:bg-green-700 text-white',
  view_plan_details:         'bg-gray-800 hover:bg-gray-900 text-white',
  request_plan_details:      'bg-gray-700 hover:bg-gray-800 text-white',
  request_this_dentist:      'bg-gray-700 hover:bg-gray-800 text-white',
  add_your_request:          'bg-blue-600 hover:bg-blue-700 text-white',
  request_city_availability: 'bg-blue-600 hover:bg-blue-700 text-white',
  search_nearby:             'bg-gray-900 hover:bg-gray-800 text-white',
  learn_how_it_works:        'border border-gray-300 text-gray-700 hover:bg-gray-50',
  none:                      'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50',
}

interface DapPublicCtaProps {
  cta: DapCtaModel
  disabled?: boolean
  helperText?: string
  className?: string
}

export function DapPublicCta({ cta, disabled, helperText, className = '' }: DapPublicCtaProps) {
  const isDisabled = disabled || cta.type === 'none'
  const styleClass = `${CTA_BASE} ${CTA_STYLES[cta.type] ?? CTA_STYLES.none} ${className}`

  const inner = cta.href && !isDisabled
    ? (
      <a
        href={cta.href}
        className={styleClass}
        data-cta-type={cta.type}
        aria-label={cta.label}
      >
        {cta.label}
      </a>
    )
    : (
      <button
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`${styleClass} ${isDisabled ? 'cursor-not-allowed' : ''}`}
        data-cta-type={cta.type}
      >
        {cta.label}
      </button>
    )

  if (!helperText) return inner

  return (
    <div className="flex flex-col gap-1">
      {inner}
      <p className="text-xs text-gray-400" data-helper-text>{helperText}</p>
    </div>
  )
}
