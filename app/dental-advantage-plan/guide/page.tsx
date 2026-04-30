import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The 5-Minute Guide to Dental Care Without Insurance | DAP',
  description:
    'No dental insurance? Learn your options — paying cash, buying insurance, in-house membership plans, financing, community clinics, and more.',
}

const OPTIONS = [
  {
    id: 'cash',
    emoji: '💵',
    title: 'Option 1: Pay cash (out of pocket)',
    content: [
      'Paying directly without insurance or a plan is the most flexible option — any dentist, any time. But it is also the most expensive for anything beyond basic cleanings.',
      'Many dentists offer a cash discount if you ask upfront. A cleaning might cost $100–$200. A crown can run $1,000–$2,500 depending on the dentist and location.',
      'Cash works well for one-time or emergency care. For regular preventive care, other options may be more cost-effective.',
    ],
    callout: 'Always ask for a written cost estimate before agreeing to any treatment.',
  },
  {
    id: 'insurance',
    emoji: '📋',
    title: 'Option 2: Buy your own dental insurance',
    content: [
      'Individual dental insurance plans are available through healthcare.gov, private insurers, or dental-specific carriers. Monthly premiums typically range from $20–$60/month.',
      'Insurance usually covers preventive care at 100%, basic work at 70–80% (after a deductible), and major work at 50% — up to an annual maximum, often $1,000–$2,000.',
      'Waiting periods are common for major work (crowns, implants, bridges). If you need significant treatment soon, insurance may not pay out before the waiting period ends.',
    ],
    callout: 'Insurance can be worth it if you anticipate major work — but run the numbers before buying.',
  },
  {
    id: 'membership',
    emoji: '🦷',
    title: 'Option 3: In-house dental membership plans',
    content: [
      'Many dental practices offer their own membership plan — a direct agreement between you and the dentist. You pay an annual fee (typically $200–$400) and in return receive preventive care (cleanings, exams, X-rays) and discounts on other services.',
      'There are no claims to file, no insurance company involved, and no annual benefit cap from a third party. The plan is exactly what the practice offers.',
      'This option works well if you want predictable preventive care costs and there is a participating dentist near you.',
    ],
    callout: 'Dental Advantage Plan helps you find dental practices that offer these membership plans. DAP does not own or guarantee any plan — each practice sets their own terms.',
    isDap: true,
  },
  {
    id: 'financing',
    emoji: '💳',
    title: 'Option 4: Dental financing',
    content: [
      'Financing options like CareCredit or Lending Club Patient Solutions allow you to spread dental costs over time. Many dentists accept these.',
      'Some plans offer 0% interest for a promotional period (6–24 months). After that, interest rates can be high (typically 26–29% APR).',
      'Financing is useful when you need expensive treatment now and can pay it off before the promotional period ends. It is not a substitute for a long-term plan.',
    ],
    callout: 'Read the fine print on any financing offer. Deferred interest products can be costly if not paid off in time.',
  },
  {
    id: 'community',
    emoji: '🏥',
    title: 'Option 5: Community health clinics',
    content: [
      'Federally Qualified Health Centers (FQHCs) and community health clinics offer dental care on a sliding-scale fee basis — you pay based on your income.',
      'Services vary by clinic, but most offer exams, cleanings, fillings, and extractions. Wait times can be longer than private practices.',
      'Find clinics near you at findahealthcenter.hrsa.gov (the HRSA database). This is a free government resource.',
    ],
    callout: 'Community clinics are often the most affordable option for low-income patients. They may not offer cosmetic or complex procedures.',
  },
  {
    id: 'dental-schools',
    emoji: '🎓',
    title: 'Option 6: Dental schools',
    content: [
      'Dental school clinics offer services at significantly reduced rates — sometimes 40–70% below private practice pricing. Work is performed by supervised dental students.',
      'Quality is generally high because students are closely supervised by licensed faculty. Appointments may take longer.',
      'This option works well for patients who can schedule ahead and have time for longer appointments.',
    ],
    callout: 'Search for accredited dental schools at ada.org (American Dental Association).',
  },
]

export default function GuidePage() {
  return (
    <div
      data-page-kind="guide"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
    >
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">5-minute read</p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            The 5-minute guide to dental care without insurance
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            No dental insurance? You are not out of options. This guide covers six practical
            approaches — plainly explained, without the insurance jargon.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>The bottom line:</strong> dental care without insurance is manageable if you
            know your options. Preventive care is cheapest when you stay ahead of it. Emergency
            care is expensive. The goal is to find a consistent, affordable way to stay on top of
            routine cleanings and catch small problems before they become large ones.
          </p>
        </div>
      </section>

      {/* Options */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
          {OPTIONS.map(option => (
            <article key={option.id} className="space-y-4" id={option.id}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" aria-hidden="true">{option.emoji}</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{option.title}</h2>
              </div>
              {option.content.map((para, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  {para}
                </p>
              ))}
              <div
                className={`border-l-4 pl-4 py-1 ${
                  option.isDap
                    ? 'border-blue-400 bg-blue-50 rounded-r-lg pr-4'
                    : 'border-gray-200'
                }`}
              >
                <p className={`text-xs leading-relaxed ${option.isDap ? 'text-blue-800' : 'text-gray-500'}`}>
                  {option.callout}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Which option is right for me */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Which option is right for me?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            There is no single answer. The right choice depends on your situation:
          </p>
          <ul className="space-y-3 text-sm text-gray-700">
            {[
              'If you need one-time care and have the cash: pay directly and ask for a cash discount.',
              'If you anticipate ongoing or major dental work and can find a good plan: individual insurance may be worth it.',
              'If you want predictable preventive care costs and a simple plan: look for a practice offering a membership plan (DAP can help).',
              'If you need treatment now but can\'t pay upfront: ask about financing at the dental office.',
              'If cost is a significant barrier: community health clinics and dental schools are your most affordable options.',
            ].map(item => (
              <li key={item} className="flex gap-2 items-start">
                <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DAP next step */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">How to get started with DAP</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            If a dental membership plan sounds like a fit, here is how to use Dental Advantage Plan
            to find a participating practice:
          </p>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-gray-400 shrink-0">1.</span>
              Search the DAP directory for participating practices near you.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-gray-400 shrink-0">2.</span>
              Review the membership plan terms at the practice — ask about what is included, the
              annual fee, and any discounts.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-gray-400 shrink-0">3.</span>
              If the plan fits, enroll directly with the practice. DAP does not handle enrollment
              or payments.
            </li>
          </ol>
          <div className="pt-2 flex flex-wrap gap-3">
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
              Compare all options
            </a>
          </div>
        </div>
      </section>

      {/* Footer disclaimer */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-gray-400 leading-relaxed">
            This guide is for informational purposes only. Plan details vary by participating
            practice. DAP does not guarantee savings, availability, or clinical eligibility.
            External resources (HRSA, ADA) are referenced for patient convenience — DAP is not
            affiliated with these organizations.
          </p>
        </div>
      </section>
    </div>
  )
}
