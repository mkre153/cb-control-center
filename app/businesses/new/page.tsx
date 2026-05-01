import Link from 'next/link'
import { MockModeBanner } from '@/components/cb-control-center/MockModeBanner'

export default function NewBusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MockModeBanner />
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <nav
            data-breadcrumb
            className="flex items-center gap-2 text-sm text-gray-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-gray-800 transition-colors">
              CB Control Center
            </Link>
            <span className="text-gray-300" aria-hidden="true">/</span>
            <span className="text-gray-800 font-medium" aria-current="page">
              Start New Business
            </span>
          </nav>
          <span
            data-workspace-mode-badge
            className="text-xs font-mono font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5"
          >
            Workspace Mock Mode
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Start New Business</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Create a new market, site, directory, content brand, SaaS workflow, or client system.
            </p>
          </div>

          <form data-new-business-form className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Business Name
              </label>
              <input
                data-field="business-name"
                type="text"
                disabled
                placeholder="e.g. Dental Advantage Plan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Business Type
              </label>
              <select
                data-field="business-type"
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>Dental Practice</option>
                <option>Medical</option>
                <option>Retail</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Primary Market / City
              </label>
              <input
                data-field="market"
                type="text"
                disabled
                placeholder="e.g. San Diego, CA"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Primary Goal
              </label>
              <select
                data-field="primary-goal"
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>Patient Acquisition</option>
                <option>Brand Awareness</option>
                <option>SEO</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Timeline
              </label>
              <select
                data-field="timeline"
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>ASAP</option>
                <option>1–3 months</option>
                <option>3–6 months</option>
                <option>6+ months</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Business Description
              </label>
              <textarea
                data-field="description"
                disabled
                placeholder="Brief description of the business..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Target Domain (optional)
              </label>
              <input
                data-field="domain"
                type="text"
                disabled
                placeholder="e.g. dentaladvantageplan.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                data-submit-button
                type="submit"
                disabled
                className="text-sm font-semibold bg-gray-200 text-gray-400 rounded-lg px-6 py-2.5 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>
          </form>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to CB Control Center
        </Link>
      </div>
    </div>
  )
}
