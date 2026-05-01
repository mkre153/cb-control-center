export function StageDirectivePanel({
  directive,
  stageId,
  locked = false,
}: {
  directive: string
  stageId: string
  locked?: boolean
}) {
  if (!directive.trim()) return null

  return (
    <div
      data-stage-directive-panel
      data-stage-id={stageId}
      data-stage-directive-locked={locked ? 'true' : 'false'}
    >
      <div
        className="bg-gray-900 text-gray-100 rounded-lg px-4 py-4 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto"
      >
        {directive}
      </div>
      {locked ? (
        <p
          data-stage-directive-helper="locked"
          className="mt-2 text-xs font-semibold text-red-700"
        >
          Do not copy this directive into Claude Code yet.
        </p>
      ) : (
        <p data-stage-directive-helper="unlocked" className="mt-2 text-xs text-gray-400">
          Copy the directive above into Claude Code to issue or continue this stage.
        </p>
      )}
    </div>
  )
}
