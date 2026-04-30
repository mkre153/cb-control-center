'use client'

import { useState } from 'react'

export function ZipSearchForm() {
  const [zip, setZip] = useState('')

  return (
    <div id="search" className="bg-white border border-gray-200 rounded-xl px-6 py-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Find a DAP dentist near you
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={zip}
          onChange={e => setZip(e.target.value)}
          placeholder="Enter ZIP code"
          maxLength={10}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="button"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          onClick={() => {/* preview: results shown below */}}
        >
          Search
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Results show confirmed DAP providers first. If none are nearby, you can request DAP at your preferred dentist.
      </p>
    </div>
  )
}
