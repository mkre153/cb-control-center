import type { DapSavingsEducationModel } from '@/lib/cb-control-center/dapPublicUxTypes'

interface DapSavingsEducationSectionProps {
  model: DapSavingsEducationModel
}

export function DapSavingsEducationSection({ model }: DapSavingsEducationSectionProps) {
  return (
    <section
      className="rounded-xl border border-gray-200 bg-white px-5 py-5 space-y-2"
      data-section="savings-education"
      data-implies-guaranteed-pricing={String(model.impliesGuaranteedPricing)}
    >
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0" aria-hidden>
          i
        </span>
        <h2 className="text-sm font-bold text-gray-900">{model.headline}</h2>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed pl-7">{model.body}</p>
    </section>
  )
}
