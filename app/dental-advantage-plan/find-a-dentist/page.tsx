import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find a Participating DAP Dentist Near You',
  description:
    'Search for dental practices offering in-house membership plans near you. Not all dentists participate — see what is available in your area.',
}

const CARE_OPTIONS = [
  { value: 'cleaning-checkup', label: 'Cleaning / checkup' },
  { value: 'filling', label: 'Filling' },
  { value: 'crown', label: 'Crown' },
  { value: 'implant-consultation', label: 'Implant consultation' },
  { value: 'not-sure', label: 'Not sure yet' },
]

const STEPS_WHILE_WAITING = [
  {
    n: '1',
    text: 'Ask your current dentist if they offer an in-house membership plan — even outside of DAP.',
  },
  {
    n: '2',
    text: 'Read our guide on dental care without insurance to understand all your options.',
    href: '/dental-advantage-plan/guide',
    linkText: 'Read the guide',
  },
  {
    n: '3',
    text: 'Compare membership plans, dental insurance, and paying cash to find the best fit.',
    href: '/dental-advantage-plan/compare',
    linkText: 'Compare options',
  },
]

export default function FindADentistPage() {
  return (
    <div
      data-page-kind="find_dentist"
      data-implies-universal-availability="false"
      data-search-live="false"
    >
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Find a dentist
          </p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Find a participating dentist
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            Not every dentist offers a membership plan. Browse confirmed participating practices
            near you — or request that your dentist consider joining DAP.
          </p>
        </div>
      </section>

      {/* Search form */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <form
            action="/dental-advantage-plan/find-a-dentist"
            method="GET"
            className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4"
          >
            <p className="text-sm font-semibold text-gray-800">Search by ZIP code</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                name="zip"
                placeholder="ZIP code"
                maxLength={10}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <select
                name="need"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">What do you need?</option>
                {CARE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search dentists
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Limited availability notice */}
      <section className="bg-amber-50 border-t border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex gap-4 items-start">
          <span className="text-xl mt-0.5" aria-hidden="true">ℹ️</span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">
              Dentist directory coming soon in your area
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              We are actively enrolling participating dentists. Coverage varies by location. If no
              results appear near you, check back soon — or use the steps below to get started today.
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder results — empty state */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div
            data-search-results-placeholder
            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <span className="text-gray-400 text-xl" aria-hidden="true">🔍</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">No results yet in this area</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Enter your ZIP code above to check for participating dentists. Directory availability
              is limited while we grow our network.
            </p>
            <p className="text-xs text-gray-400">
              DAP does not guarantee provider availability in any location.
            </p>
          </div>
        </div>
      </section>

      {/* What to do while directory expands */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              How to find a DAP dentist right now
            </h2>
            <p className="text-sm text-gray-500">
              While we expand the directory, here are practical steps you can take today.
            </p>
          </div>
          <ol className="space-y-4">
            {STEPS_WHILE_WAITING.map(step => (
              <li key={step.n} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.n}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {step.text}{' '}
                  {step.href && (
                    <a
                      href={step.href}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {step.linkText}
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-gray-400 leading-relaxed">
            DAP does not guarantee provider availability in any location. Plan details, fees, and
            participation vary by practice. Live search results are not yet available in all areas.
          </p>
        </div>
      </section>
    </div>
  )
}
