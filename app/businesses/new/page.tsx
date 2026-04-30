export default function NewBusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-6">
        <nav
          data-breadcrumb
          className="flex items-center gap-2 text-sm text-gray-500"
          aria-label="Breadcrumb"
        >
          <a href="/" className="hover:text-gray-800 transition-colors">
            CB Control Center
          </a>
          <span className="text-gray-300" aria-hidden="true">/</span>
          <span className="text-gray-800 font-medium" aria-current="page">
            Start New Business
          </span>
        </nav>

        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto">
            <span className="text-gray-400 text-3xl leading-none">+</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Start New Business</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Create a new market, site, directory, content brand, SaaS workflow, or client system.
            </p>
          </div>
          <div
            data-creation-flow-placeholder
            className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-6 py-8 text-sm text-gray-400"
          >
            Business creation flow not yet configured. Return to the dashboard to continue with an
            existing business.
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to CB Control Center
          </a>
        </div>
      </div>
    </div>
  )
}
