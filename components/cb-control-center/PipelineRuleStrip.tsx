export function PipelineRuleStrip() {
  return (
    <div className="bg-gray-900 rounded-lg px-4 py-3">
      <p className="text-xs font-mono text-gray-300 tracking-wide">
        <span className="text-green-400 font-semibold">Crawl</span>
        <span className="text-gray-500"> ≠ Truth</span>
        <span className="text-gray-600 mx-2">→</span>
        <span className="text-blue-400 font-semibold">Truth</span>
        <span className="text-gray-500"> enables Strategy</span>
        <span className="text-gray-600 mx-2">→</span>
        <span className="text-purple-400 font-semibold">Strategy</span>
        <span className="text-gray-500"> enables Pages</span>
        <span className="text-gray-600 mx-2">→</span>
        <span className="text-amber-400 font-semibold">QA</span>
        <span className="text-gray-500"> enables Publish</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Raw crawl output is source material. Business Truth JSON is the decision-safe record used by downstream systems.
      </p>
    </div>
  )
}
