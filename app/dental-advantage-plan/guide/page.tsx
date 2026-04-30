import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '5-Minute Guide to Dental Advantage Plan | DAP',
  description:
    'A quick guide to understanding what a dental membership plan is, who it is for, and how to use it — no insurance jargon.',
}

export default function GuidePage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="guide"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">5-Minute Read</p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          A Quick Guide to Dental Advantage Plan
        </h1>
        <p className="text-gray-600 leading-relaxed">
          No insurance jargon. Just a plain explanation of what a dental membership plan is, who it helps, and whether it might be worth looking into.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">What is a dental membership plan?</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          A dental membership plan is a direct agreement between you and a specific dental practice — not an insurance product. You pay the practice an annual or monthly fee. In return, that practice typically covers preventive care (cleanings, exams, X-rays) and may offer reduced fees on other services.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          There are no claims to file, no insurance company involved, and no deductibles. The plan is exactly what the practice says it is.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Who is it for?</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span>People without dental insurance who want predictable preventive care costs.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span>Self-employed individuals or small business owners whose employer does not offer dental coverage.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span>People whose dental insurance does not cover the services they need, or whose plan has low annual maximums.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span>Anyone who prefers paying directly without insurance overhead.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">What DAP is — and is not</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-green-900">DAP is</p>
            <ul className="space-y-1 text-green-800">
              <li>· A patient discovery directory</li>
              <li>· A way to find participating dentists</li>
              <li>· A resource for comparing membership plan options</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-gray-700">DAP is not</p>
            <ul className="space-y-1 text-gray-600">
              <li>· Insurance</li>
              <li>· A payment processor</li>
              <li>· A guarantee of savings or availability</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How to use DAP</h2>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="shrink-0 font-bold text-gray-400">1.</span>
            <span>Find a dentist near you who offers a membership plan through the DAP directory.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-bold text-gray-400">2.</span>
            <span>Review the plan terms directly with that practice — inclusions, fees, and any limitations.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-bold text-gray-400">3.</span>
            <span>If the plan fits, enroll directly with the practice. DAP does not handle enrollment, payments, or membership records.</span>
          </li>
        </ol>
      </section>

      <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-3">
        <Link
          href="/dental-advantage-plan/find-a-dentist"
          className="inline-block px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Find a participating dentist
        </Link>
        <Link
          href="/dental-advantage-plan/how-it-works"
          className="inline-block px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          How it works
        </Link>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          Plan details vary by participating practice. DAP does not guarantee savings, availability, or clinical eligibility. This guide is for informational purposes only.
        </p>
      </div>
    </main>
  )
}
