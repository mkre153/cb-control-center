import type { DapStatusBadgeModel, DapStatusBadgeVariant } from '@/lib/dap/site/dapPublicUxTypes'

const BADGE_STYLES: Record<DapStatusBadgeVariant, string> = {
  confirmed:     'bg-green-100 text-green-700 border-green-200',
  not_confirmed: 'bg-gray-100 text-gray-600 border-gray-200',
  requested:     'bg-blue-100 text-blue-700 border-blue-200',
  internal:      'bg-red-50 text-red-600 border-red-100',
}

interface DapStatusBadgeProps {
  badge: DapStatusBadgeModel
  showInternalWarning?: boolean
}

export function DapStatusBadge({ badge, showInternalWarning = false }: DapStatusBadgeProps) {
  if (!badge.isPublic && !showInternalWarning) return null

  const styleClass = BADGE_STYLES[badge.variant]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styleClass}`}
      data-badge-variant={badge.variant}
      data-badge-public={badge.isPublic}
    >
      {badge.label}
    </span>
  )
}
