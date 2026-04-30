import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare: Dental Advantage Plan vs. Insurance vs. Cash | DAP',
  description:
    'Compare dental membership plans, traditional dental insurance, and paying cash out of pocket. Understand the tradeoffs before choosing.',
}

type RowValue = { text: string; highlight?: boolean }

interface CompareRow {
  label: string
  dap: RowValue
  insurance: RowValue
  cash: RowValue
}

const ROWS: CompareRow[] = [
  {
    label: 'Monthly cost',
    dap: { text: 'Annual fee paid to the practice', highlight: true },
    insurance: { text: 'Monthly premium (whether you use it or not)' },
    cash: { text: 'None' },
  },
  {
    label: 'Claims to file',
    dap: { text: 'None', highlight: true },
    insurance: { text: 'Yes — required for benefits' },
    cash: { text: 'None' },
  },
  {
    label: 'Annual benefit cap',
    dap: { text: 'Per practice plan terms', highlight: true },
    insurance: { text: 'Typically $1,000–$2,000/year' },
    cash: { text: 'N/A — you pay full price' },
  },
  {
    label: 'Waiting periods',
    dap: { text: 'Per practice plan terms', highlight: true },
    insurance: { text: 'Common for major work' },
    cash: { text: 'None' },
  },
  {
    label: 'Preventive care',
    dap: { text: 'Included in most membership plans', highlight: true },
    insurance: { text: 'Usually covered after deductible' },
    cash: { text: 'Full price each visit' },
  },
  {
    label: 'Works with any dentist',
    dap: { text: 'Participating dentists only', highlight: false },
    insurance: { text: 'In-network dentists only' },
    cash: { text: 'Yes — any dentist' },
  },
  {
    label: 'Insurance company involved',
    dap: { text: 'No', highlight: true },
    insurance: { text: 'Yes' },
    cash: { text: 'No' },
  },
]

const NOTES = [
  'DAP does not set pricing, determine savings, or guarantee outcomes. All membership terms are set by the participating dental practice.',
  'Insurance benefits vary by plan. Always review your specific plan documents.',
  'Cash pricing varies by dentist and procedure. Ask for a written estimate before any treatment.',
]

export default function ComparePage() {
  return (
    <div
      data-page-kind="compare"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
      data-implies-universal-availability="false"
    >
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Compare your options
          </p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            DAP vs. dental insurance vs. paying cash
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            There is no single right answer for everyone. This comparison is meant to help you
            understand the tradeoffs — not to recommend one option as universally better.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-4 w-1/4" />
                  <th className="text-left pb-4 w-1/4">
                    <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                      Dental Advantage Plan
                    </span>
                  </th>
                  <th className="text-left pb-4 w-1/4">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      Traditional Insurance
                    </span>
                  </th>
                  <th className="text-left pb-4 w-1/4">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      Paying Cash
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 pr-4 text-xs font-medium text-gray-500 align-top">
                      {row.label}
                    </td>
                    <td className={`py-3 pr-4 text-xs align-top ${row.dap.highlight ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                      {row.dap.text}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-600 align-top">
                      {row.insurance.text}
                    </td>
                    <td className="py-3 text-xs text-gray-600 align-top">
                      {row.cash.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Honest positioning */}
      <section className="bg-blue-50 border-t border-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Which option is right for you?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-blue-700 text-xs uppercase tracking-wide">DAP may work well if...</p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li>· You don't have dental insurance</li>
                <li>· You want predictable preventive care costs</li>
                <li>· There is a participating dentist near you</li>
                <li>· You prefer no monthly insurance premiums</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Traditional insurance may work better if...</p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li>· Your employer subsidizes the premium</li>
                <li>· You anticipate significant dental work</li>
                <li>· You want broad network flexibility</li>
                <li>· You need major work covered quickly</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Cash may make sense if...</p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li>· You only need one-time or emergency care</li>
                <li>· You can negotiate cash pricing directly</li>
                <li>· No participating practice is nearby</li>
                <li>· You prefer maximum dentist flexibility</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {NOTES.map(note => (
            <p key={note} className="text-xs text-gray-400 leading-relaxed">
              {note}
            </p>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-wrap gap-3">
          <a
            href="/dental-advantage-plan/find-a-dentist"
            className="inline-block px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Find a participating dentist
          </a>
          <a
            href="/dental-advantage-plan/how-it-works"
            className="inline-block px-5 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            How DAP works
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
