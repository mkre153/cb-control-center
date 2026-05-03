'use client'

import { useState } from 'react'
import { REQUEST_EXPECTATION_COPY, DIRECTORY_ROUTE } from '@/lib/dap/registry/dapDisplayRules'
import Link from 'next/link'

export function RequestDentistForm() {
  const [zip, setZip]       = useState('')
  const [practice, setPractice] = useState('')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <span className="text-green-600 text-lg font-bold">✓</span>
        </div>
        <p className="text-base font-semibold text-gray-800">Request received</p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          We&apos;ll use your request to identify patient demand and reach out to dental practices in your area.
          We&apos;ll notify you if a practice near you joins DAP.
        </p>
        <Link
          href={DIRECTORY_ROUTE}
          className="inline-block mt-3 text-sm font-medium text-green-700 underline hover:text-green-800"
        >
          ← Back to directory
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Request DAP Availability
        </p>
        <p className="text-sm text-gray-700">
          Don&apos;t see a DAP dentist near you? Tell us where you are or who you want us to contact.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Your ZIP code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={zip}
            onChange={e => setZip(e.target.value)}
            placeholder="e.g. 92103"
            maxLength={10}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Preferred dentist or practice name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={practice}
            onChange={e => setPractice(e.target.value)}
            placeholder="e.g. Hillcrest Family Dental"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            We will contact this practice on your behalf. This does not guarantee they will participate.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            We&apos;ll notify you if a DAP provider joins near your area. No spam.
          </p>
        </div>

        {/* Required expectation copy */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-600 leading-relaxed">{REQUEST_EXPECTATION_COPY}</p>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <label htmlFor="consent" className="text-xs text-gray-600 cursor-pointer">
            I understand DAP may contact the practice I name here, and that DAP will notify me
            if options become available in my area. I have not been promised any specific outcome.
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={!zip || !consent}
        onClick={() => setSubmitted(true)}
        className="w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        Submit request
      </button>

      <p className="text-xs text-gray-400 text-center">
        Not a DAP membership signup · This is a demand signal only
      </p>
    </div>
  )
}
