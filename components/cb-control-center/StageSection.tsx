import type React from 'react'

export type StageSectionAccent = 'amber' | 'green' | 'red'

export function StageSection({
  title,
  children,
  accent,
}: {
  title: string
  children: React.ReactNode
  accent?: StageSectionAccent
}) {
  const border = accent === 'amber'
    ? 'border-amber-200'
    : accent === 'green'
    ? 'border-green-200'
    : accent === 'red'
    ? 'border-red-200'
    : 'border-gray-200'

  return (
    <section className={`border ${border} rounded-lg bg-white overflow-hidden`}>
      <div className={`px-5 py-3 border-b ${border} bg-gray-50`}>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
