import type { CrawlOutput } from '@/lib/cb-control-center/types'

export function CrawlOutputTab({ crawlOutput }: { crawlOutput: CrawlOutput }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <span className="text-xs font-semibold text-amber-700">Raw Extracted Data</span>
        <span className="text-xs text-amber-600">
          — This is unvalidated site content. Do not treat crawl output as approved truth.
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Run ID</p>
          <p className="text-sm font-mono text-gray-700">{crawlOutput.crawlRunId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Status</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            Complete
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pages Found</p>
        <div className="space-y-2">
          {crawlOutput.pagesFound.map((page, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-gray-800">{page.title}</span>
                <span className="text-xs font-mono text-gray-400">{page.url}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {page.signals.map((s, j) => (
                  <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Extracted Signals</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {(
            [
              ['Headlines', crawlOutput.extractedSignals.headlines],
              ['CTAs', crawlOutput.extractedSignals.ctas],
              ['Pricing Mentions', crawlOutput.extractedSignals.pricingMentions],
              ['Trust Signals', crawlOutput.extractedSignals.trustSignals],
              ['FAQs', crawlOutput.extractedSignals.faqs],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
