import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Find a Participating DAP Dentist Near You',
  description:
    'Search for dental practices offering direct membership plans near you. Not all dentists participate — see what is available in your area.',
}

export default function FindADentistPage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="find_dentist"
      data-implies-universal-availability="false"
      data-search-live="false"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Find a Participating Dentist
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Not every dentist offers a membership plan. Use this directory to find participating practices near you — or request that your dentist consider offering one.
        </p>
      </div>

      {/* Search shell — not yet wired */}
      <div className="border border-gray-200 rounded-lg bg-gray-50 px-5 py-6 space-y-4">
        <p className="text-sm font-medium text-gray-700">Enter your ZIP code to search nearby practices</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="ZIP code"
            disabled
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-500 cursor-not-allowed"
          />
          <button
            disabled
            className="px-4 py-2 text-sm font-semibold bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
          >
            Search
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Live search is not yet available. See the guide below to find DAP dentists today.
        </p>
      </div>

      {/* Interim guidance */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">How to find a DAP dentist right now</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 shrink-0">1.</span>
            <span>Read our guide on <Link href="/guides/how-to-find-dentist-who-offers-dap" className="text-blue-600 hover:underline">how to find a dentist who offers DAP</Link>.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 shrink-0">2.</span>
            <span>Ask your current dentist directly if they offer a membership plan.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400 shrink-0">3.</span>
            <span>If no DAP dentist is nearby, learn <Link href="/guides/what-happens-if-no-dentist-offers-dap-near-me" className="text-blue-600 hover:underline">what to do when no DAP dentist is available near you</Link>.</span>
          </li>
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          DAP does not guarantee provider availability in any location. Plan details, fees, and participation vary by practice.
        </p>
      </div>
    </main>
  )
}
