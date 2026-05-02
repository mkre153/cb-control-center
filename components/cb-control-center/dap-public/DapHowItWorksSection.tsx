import type { DapHowItWorksSectionModel } from '@/lib/dap/site/dapPublicUxTypes'

interface DapHowItWorksSectionProps {
  model: DapHowItWorksSectionModel
}

export function DapHowItWorksSection({ model }: DapHowItWorksSectionProps) {
  return (
    <section className="space-y-5" data-section="how-it-works">
      <h2 className="text-lg font-bold text-gray-900">How Dental Advantage Plan works</h2>
      <ol className="space-y-0">
        {model.steps.map((s, idx) => (
          <li key={s.step} className="flex gap-4" data-step={s.step}>
            {/* Step number + connector line */}
            <div className="flex flex-col items-center">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                {s.step}
              </span>
              {idx < model.steps.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 my-1.5" aria-hidden />
              )}
            </div>
            {/* Content */}
            <div className={`space-y-0.5 ${idx < model.steps.length - 1 ? 'pb-5' : ''}`}>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
