import type { TruthSection, FieldStatus } from '@/lib/cb-control-center/types'

const fieldStatusConfig: Record<FieldStatus, { label: string; className: string }> = {
  confirmed:           { label: 'Confirmed',           className: 'bg-green-100 text-green-700' },
  needs_confirmation:  { label: 'Needs Confirmation',  className: 'bg-amber-100 text-amber-700' },
  missing:             { label: 'Missing',             className: 'bg-red-100 text-red-700' },
  blocked:             { label: 'Blocked',             className: 'bg-gray-200 text-gray-500' },
}

export function BusinessTruthTab({ schema }: { schema: TruthSection[] }) {
  const totalFields = schema.reduce((n, s) => n + s.fields.length, 0)
  const confirmedFields = schema.reduce((n, s) => n + s.fields.filter(f => f.status === 'confirmed').length, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div>
          <span className="text-xs font-semibold text-blue-700">Truth Schema — 7 sections</span>
          <p className="text-xs text-blue-600 mt-0.5">
            Canonical record gating all downstream publishing decisions. Page Eligibility Rules
            are derived from the other six sections. Resolve blockers to unlock page types.
          </p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="text-xs font-semibold text-blue-800">{confirmedFields}/{totalFields}</p>
          <p className="text-xs text-blue-600">confirmed</p>
        </div>
      </div>

      {schema.map((section) => {
        const sectionConfirmed = section.fields.filter(f => f.status === 'confirmed').length
        const hasBlockedOrMissing = section.fields.some(f => f.status === 'blocked' || f.status === 'missing')

        return (
          <div
            key={section.id}
            className={`border rounded-lg overflow-hidden ${hasBlockedOrMissing ? 'border-red-200' : 'border-gray-100'}`}
          >
            <div className={`px-4 py-2.5 flex items-center justify-between ${hasBlockedOrMissing ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{section.name}</p>
              <span className="text-xs text-gray-400">{sectionConfirmed}/{section.fields.length} confirmed</span>
            </div>
            <div className="divide-y divide-gray-50">
              {section.fields.map((field) => {
                const cfg = fieldStatusConfig[field.status]
                return (
                  <div key={field.id} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-0.5">{field.label}</p>
                      {field.value ? (
                        <p className="text-sm text-gray-800 leading-relaxed">{field.value}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No value yet</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="border border-gray-100 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Finalization Gate</p>
        <p className="text-xs text-gray-500">
          Truth Schema cannot be finalized until <span className="font-medium text-gray-700">Provider Participation Truth</span>, <span className="font-medium text-gray-700">Offer Truth</span>, and <span className="font-medium text-gray-700">Patient Demand Truth</span> blockers are resolved or explicitly deferred.{' '}
          <span className="font-medium text-gray-700">Page Eligibility Rules</span> and <span className="font-medium text-gray-700">Publishing Claim Safety</span> are derived automatically from the resolved sections. Resolve blockers in the Blockers tab.
        </p>
      </div>
    </div>
  )
}
