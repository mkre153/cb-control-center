import type { ActivityEvent } from '@/lib/cb-control-center/types'

export function ActivityTab({ activity }: { activity: ActivityEvent[] }) {
  return (
    <div className="space-y-1">
      {activity.map((event, i) => (
        <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-300 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{event.timestamp}</p>
            <p className="text-sm text-gray-700">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
