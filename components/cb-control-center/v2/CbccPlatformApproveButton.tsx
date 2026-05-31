'use client'

import { useState, useTransition } from 'react'
import { activateRecipeAction } from '@/lib/cb-control-center/prcPlatformActions'

export function CbccPlatformApproveButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  if (done) {
    return <span className="text-xs font-medium text-emerald-400">✓ Activated — live via ISR</span>
  }

  function activate() {
    setError(null)
    startTransition(async () => {
      const res = await activateRecipeAction(slug)
      if (res.ok) {
        setDone(true)
      } else {
        setError(res.message)
        setConfirming(false)
      }
    })
  }

  if (!confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md border border-emerald-700 bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-800/40"
        >
          Approve &amp; activate
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Publish live?</span>
      <button
        type="button"
        disabled={pending}
        onClick={activate}
        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? 'Activating…' : 'Confirm'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  )
}
