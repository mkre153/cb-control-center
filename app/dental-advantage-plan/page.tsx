import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dental Advantage Plan | Find Participating Dentists Near You',
  description:
    'Discover dentists near you that offer in-house membership plans for preventive care and member savings. No insurance claims. No annual maximums from DAP.',
}

const SAVINGS_CARDS = [
  {
    icon: '🦷',
    title: 'Preventive care',
    detail: 'Cleanings, exams, and X-rays',
    message:
      'Many in-house membership plans are designed to make routine preventive care easier to keep up with.',
  },
  {
    icon: '🔧',
    title: 'Small dental work',
    detail: 'Fillings or simple treatment',
    message:
      'Member pricing may reduce out-of-pocket costs depending on the participating practice\'s plan.',
  },
  {
    icon: '⭐',
    title: 'Larger treatment',
    detail: 'Crowns, implants, bridges, or more',
    message:
      'Membership discounts may be especially helpful when treatment costs are higher.',
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    n: '1',
    title: 'Find a participating dentist',
    desc: 'Browse our directory to find dental practices near you that offer in-house membership plans.',
  },
  {
    n: '2',
    title: 'Review the practice\'s membership plan',
    desc: 'Each practice sets their own plan terms, fees, and included services. Review directly with the dentist.',
  },
  {
    n: '3',
    title: 'Join directly through the practice',
    desc: 'Enroll at the practice — not through DAP. We connect you; the practice manages your membership.',
  },
  {
    n: '4',
    title: 'Use member benefits at that practice',
    desc: 'Visit for covered care and apply member pricing at your participating dentist. Plan details vary.',
  },
]

const CARE_OPTIONS = [
  'Cleaning / checkup',
  'Filling',
  'Crown',
  'Implant consultation',
  'Not sure yet',
]

export default function DapHomepage() {
  return (
    <div
      data-page-kind="homepage"
      data-implies-universal-availability="false"
      data-implies-guaranteed-savings="false"
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: headline + CTAs */}
          <div className="space-y-6">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
              No insurance? Start here.
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Find out how much you can save on dental care — before you go.
            </h1>
            <p className="text-sm text-blue-100 leading-relaxed max-w-lg">
              Dental Advantage Plan helps you discover participating dentists near you that offer
              in-house membership plans for preventive care and member-only savings. No insurance
              claims. No annual maximums from DAP. No waiting for insurance approval.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/dental-advantage-plan/find-a-dentist"
                className="inline-block px-5 py-3 text-sm font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Find participating dentists
              </a>
              <a
                href="/dental-advantage-plan/guide"
                className="inline-block px-5 py-3 text-sm font-semibold border border-white/40 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Read the 5-minute guide
              </a>
            </div>
          </div>

          {/* Right: search card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-gray-900">Find a participating dentist</p>
            <form
              action="/dental-advantage-plan/find-a-dentist"
              method="GET"
              className="space-y-3"
            >
              <input
                type="text"
                name="zip"
                placeholder="ZIP code"
                maxLength={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                name="need"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">What do you need?</option>
                {CARE_OPTIONS.map(opt => (
                  <option key={opt} value={opt.toLowerCase().replace(/\s+/g, '-')}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search dentists
              </button>
            </form>
            <p className="text-xs text-gray-400">
              Not all dentists participate. Results show practices that offer membership plans.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white" data-section="how-it-works">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-xl mb-10">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              How Dental Advantage Plan works
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              DAP connects patients to participating practices — we do not process claims, set
              prices, or own any dental plan.
            </p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map(step => (
              <li key={step.n} className="space-y-3">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {step.n}
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <a
              href="/dental-advantage-plan/how-it-works"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Learn more about how DAP works →
            </a>
          </div>
        </div>
      </section>

      {/* ── Savings scenarios ────────────────────────────────────────────── */}
      <section className="bg-gray-50" data-section="savings-scenarios">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-xl mb-10">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              Where membership plans may help
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Savings depend on the participating practice's plan. These scenarios illustrate common
              situations — not guaranteed outcomes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {SAVINGS_CARDS.map(card => (
              <div
                key={card.title}
                data-savings-card
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:border-blue-200 transition-colors"
              >
                <span className="text-2xl" aria-hidden="true">{card.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.detail}</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{card.message}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Plan details vary by practice. Savings are not guaranteed and depend on each
            participating practice's membership plan terms.
          </p>
        </div>
      </section>

      {/* ── Compare teaser ───────────────────────────────────────────────── */}
      <section className="bg-white" data-section="compare-teaser">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                Not sure how DAP compares to dental insurance?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dental Advantage Plan is not insurance — it is a directory of practices that offer
                direct membership arrangements with their patients. No claims, no monthly premiums
                to an insurance company, and no annual benefit caps from DAP.
              </p>
              <a
                href="/dental-advantage-plan/compare"
                className="inline-block px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Compare DAP, insurance, and cash
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Monthly premiums', dap: 'None from DAP', insurance: 'Required' },
                { label: 'Claims to file', dap: 'None', insurance: 'Yes' },
                { label: 'Annual benefit cap', dap: 'Per practice plan', insurance: 'Typically $1K–$2K' },
                { label: 'Waiting periods', dap: 'Per practice plan', insurance: 'Common' },
              ].map(row => (
                <div key={row.label} className="grid grid-cols-3 gap-2 text-xs">
                  <span className="text-gray-500 font-medium">{row.label}</span>
                  <span className="text-blue-700 font-semibold bg-blue-50 rounded px-2 py-1 text-center">{row.dap}</span>
                  <span className="text-gray-500 bg-gray-50 rounded px-2 py-1 text-center">{row.insurance}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                DAP column reflects typical membership arrangements — actual terms set by each practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── For practices ────────────────────────────────────────────────── */}
      <section className="bg-blue-50 border-t border-blue-100" data-section="for-practices-teaser">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                For dental practices
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                Help patients find your in-house membership plan.
              </h2>
              <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
                DAP helps uninsured patients discover practices that offer direct membership plans.
                You set your own terms and pricing — we help patients find you.
              </p>
            </div>
            <a
              href="/dental-advantage-plan/for-practices"
              className="shrink-0 inline-block px-5 py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Learn more for practices →
            </a>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="bg-blue-600" data-section="bottom-cta">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Ready to find a participating dentist?
          </h2>
          <p className="text-sm text-blue-100 max-w-md mx-auto leading-relaxed">
            Browse practices near you that offer in-house dental membership plans. Availability
            varies by location.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/dental-advantage-plan/find-a-dentist"
              className="inline-block px-6 py-3 text-sm font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Find participating dentists
            </a>
            <a
              href="/dental-advantage-plan/guide"
              className="inline-block px-6 py-3 text-sm font-semibold border border-white/40 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Read the guide
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
