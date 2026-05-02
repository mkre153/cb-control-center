import type { DapFaqSectionModel } from '@/lib/dap/site/dapPublicUxTypes'

interface DapFaqSectionProps {
  model: DapFaqSectionModel
}

export function DapFaqSection({ model }: DapFaqSectionProps) {
  return (
    <section className="space-y-4" data-section="faq">
      <h2 className="text-lg font-bold text-gray-900">Frequently asked questions</h2>
      <dl className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {model.items.map((item, i) => (
          <div key={i} className="px-5 py-4 bg-white space-y-1.5" data-faq-item>
            <dt className="text-sm font-semibold text-gray-900">{item.question}</dt>
            <dd className="text-sm text-gray-600 leading-relaxed">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
