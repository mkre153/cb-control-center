'use client'

import { useState } from 'react'
import type { StageAiReview, StageAiChecklistResult } from '@/lib/cb-control-center/dapStageReviewer'

interface Props {
  stageSlug: string
  stageTitle: string
}

const RECOMMENDATION_STYLE: Record<StageAiReview['recommendation'], string> = {
  approve:          'bg-green-100 text-green-800 ring-1 ring-green-300',
  disapprove:       'bg-red-100 text-red-800 ring-1 ring-red-300',
  request_revision: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
}

const RECOMMENDATION_LABEL: Record<StageAiReview['recommendation'], string> = {
  approve:          'Recommend: Approve',
  disapprove:       'Recommend: Disapprove',
  request_revision: 'Recommend: Request Revision',
}

const CONFIDENCE_LABEL: Record<StageAiReview['confidence'], string> = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
}

export function StageAiReviewPanel({ stageSlug, stageTitle }: Props) {
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<StageAiReview | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runReview() {
    setLoading(true)
    setError(null)
    setReview(null)
    try {
      const res = await fetch('/api/businesses/dental-advantage-plan/stages/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageSlug }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(`${res.status}: ${msg}`)
      }
      const data = await res.json() as StageAiReview
      setReview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-ai-review-panel className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Opus 4.7 Stage Review</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            AI-assisted review for {stageTitle} — advisory only
          </p>
        </div>
        <button
          onClick={runReview}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Reviewing…' : review ? 'Re-run Review' : 'Get Opus 4.7 Review'}
        </button>
      </div>

      {error && (
        <div className="px-5 py-4 text-xs text-red-600 bg-red-50">
          Review failed: {error}
        </div>
      )}

      {!review && !loading && !error && (
        <div className="px-5 py-4 text-xs text-gray-400">
          Click the button to have Opus 4.7 review this stage artifact and evidence.
        </div>
      )}

      {loading && (
        <div className="px-5 py-4 text-xs text-gray-500 animate-pulse">
          Opus 4.7 is reviewing stage artifacts…
        </div>
      )}

      {review && (
        <div className="px-5 py-4 space-y-4">
          {/* Recommendation badge */}
          <div className="flex items-center gap-3">
            <span
              data-ai-recommendation={review.recommendation}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RECOMMENDATION_STYLE[review.recommendation]}`}
            >
              {RECOMMENDATION_LABEL[review.recommendation]}
            </span>
            <span className="text-[10px] text-gray-400">{CONFIDENCE_LABEL[review.confidence]}</span>
          </div>

          {/* Reasoning */}
          <div data-ai-reasoning className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reasoning</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{review.reasoning}</p>
          </div>

          {/* Checklist */}
          {review.checklistResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Checklist</p>
              <ul className="space-y-1">
                {review.checklistResults.map((item: StageAiChecklistResult, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 mt-0.5 font-bold ${item.passed ? 'text-green-500' : 'text-red-400'}`}>
                      {item.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-700">
                      {item.criterion}
                      {item.note && <span className="text-gray-400 ml-1">— {item.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advisory disclaimer */}
          <div className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2 leading-relaxed">
            <span className="font-semibold text-gray-500">Advisory only.</span>{' '}
            This recommendation does not approve the stage. Only the owner approves by editing{' '}
            <code className="font-mono">dapStageGates.ts</code> and committing.
          </div>
        </div>
      )}
    </div>
  )
}
