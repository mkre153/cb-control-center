export function AntiBypassBanner() {
  return (
    <div
      data-anti-bypass-rule
      className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 leading-relaxed"
    >
      <span className="font-semibold text-gray-700">Anti-bypass rule: </span>
      No implementation phase may begin without a CBCC-issued directive for that stage.
      Each phase stops at evidence submission. Owner must approve before the next directive is issued.
    </div>
  )
}
