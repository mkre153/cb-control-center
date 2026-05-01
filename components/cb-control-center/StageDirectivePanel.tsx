export function StageDirectivePanel({ directive, stageId }: { directive: string; stageId: string }) {
  if (!directive.trim()) return null

  return (
    <div data-stage-directive-panel data-stage-id={stageId}>
      <div
        className="bg-gray-900 text-gray-100 rounded-lg px-4 py-4 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto"
      >
        {directive}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Copy the directive above into Claude Code to issue or continue this stage.
      </p>
    </div>
  )
}
