import type { DapComparisonSectionModel } from '@/lib/dap/site/dapPublicUxTypes'

interface DapComparisonSectionProps {
  model: DapComparisonSectionModel
}

export function DapComparisonSection({ model }: DapComparisonSectionProps) {
  return (
    <section className="space-y-4" data-section="comparison">
      <h2 className="text-lg font-bold text-gray-900">{model.headline}</h2>
      <div className={`grid gap-3 ${model.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {model.columns.map((col, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 space-y-3 ${
              i === 0
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-gray-100 bg-gray-50'
            }`}
            data-comparison-column={col.label}
          >
            <p className={`text-xs font-bold uppercase tracking-wide ${
              i === 0 ? 'text-emerald-700' : 'text-gray-500'
            }`}>
              {col.label}
            </p>
            <ul className="space-y-2">
              {col.points.map((point, j) => (
                <li key={j} className="text-sm text-gray-700 flex gap-2 items-start">
                  <span
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-500'
                    }`}
                    aria-hidden
                  >
                    {i === 0 ? '✓' : '·'}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
