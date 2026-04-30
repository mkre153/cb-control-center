import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Dental Advantage Plan Works | In-House Dental Memberships Explained',
  description:
    'Understand how a dental membership plan works — find a participating dentist, review the plan, enroll directly, and use your benefits. No insurance claims.',
}

const STEPS = [
  {
    n: 1,
    title: 'Find a participating dentist',
    body: 'Use the DAP directory to browse dental practices near you that offer an in-house membership plan. Not every dentist participates — confirmed practices are verified before listing.',
    note: null,
  },
  {
    n: 2,
    title: 'Review the practice\'s membership plan',
    body: 'Each practice sets its own plan terms, annual fee, included services, and any additional member discounts. Review those details directly with the dentist or their front desk before enrolling.',
    note: 'DAP does not set pricing, determine included treatments, or make clinical decisions on behalf of any practice.',
  },
  {
    n: 3,
    title: 'Join directly through the practice',
    body: 'Enrollment happens at the practice level, not through DAP. You pay the annual or monthly membership fee directly to the dental office. DAP does not collect membership fees or process payments.',
    note: null,
  },
  {
    n: 4,
    title: 'Use your membership benefits',
    body: 'Once enrolled, visit the practice for your covered care. Discounts and included services apply according to that practice\'s specific plan. Keep your membership details with the office for reference.',
    note: 'Benefits apply at the enrolling practice only. Membership does not transfer to other practices.',
  },
]

const NOT_INVOLVED = [
  'DAP does not process dental insurance claims.',
  'DAP does not make treatment decisions or clinical recommendations.',
  'DAP does not collect protected health information (PHI).',
  'DAP does not own, manage, or guarantee any dental membership plan.',
  'DAP does not handle billing between patients and dental practices.',
]

export default function HowItWorksPage() {
  return (
    <div
      data-page-kind="how_it_works"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
    >
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">How it works</p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            How Dental Advantage Plan works
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            A dental membership plan is a direct agreement between you and a participating dental
            practice — no insurance company, no claims, no deductibles. DAP helps you find those
            practices.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <ol className="space-y-0">
            {STEPS.map((step, idx) => (
              <li key={step.n} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {step.n}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 my-2" aria-hidden="true" />
                  )}
                </div>
                <div className={`space-y-2 ${idx < STEPS.length - 1 ? 'pb-10' : ''}`}>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{step.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  {step.note && (
                    <p className="text-xs text-gray-400 border-l-2 border-gray-200 pl-3 leading-relaxed">
                      {step.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What DAP is NOT involved in */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">What DAP is not involved in</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              DAP is a patient discovery tool — not a care provider, insurer, or payment processor.
            </p>
          </div>
          <ul className="space-y-3">
            {NOT_INVOLVED.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                  ✗
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-wrap gap-3">
          <a
            href="/dental-advantage-plan/find-a-dentist"
            className="inline-block px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Find a participating dentist
          </a>
          <a
            href="/dental-advantage-plan/compare"
            className="inline-block px-5 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Compare DAP vs. insurance
          </a>
          <a
            href="/dental-advantage-plan/guide"
            className="inline-block px-5 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Read the guide
          </a>
        </div>
      </section>
    </div>
  )
}
