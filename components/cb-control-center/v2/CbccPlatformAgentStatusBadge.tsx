import type { AgentRunStatus } from '@/lib/cb-control-center/prcPlatform'

const STYLE: Record<AgentRunStatus, string> = {
  ok: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  error: 'bg-red-900/40 text-red-300 border-red-700',
  running: 'bg-blue-900/40 text-blue-300 border-blue-700',
  never: 'bg-gray-800 text-gray-500 border-gray-700',
}

const LABEL: Record<AgentRunStatus, string> = {
  ok: 'ok',
  error: 'error',
  running: 'running',
  never: 'no runs',
}

export function CbccPlatformAgentStatusBadge({ status }: { status: AgentRunStatus }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {LABEL[status]}
    </span>
  )
}
