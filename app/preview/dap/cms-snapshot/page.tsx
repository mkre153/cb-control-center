import type { ReactNode } from 'react'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { runClaimQA } from '@/lib/cb-control-center/dapClaimQA'
import type { QAWarning, QASummary } from '@/lib/cb-control-center/dapClaimQA'
import type { DapCmsSnapshot, DapTreatmentPageCmsRecord } from '@/lib/cb-control-center/dapCmsTypes'

export default function CmsSnapshotPage() {
  const snapshot = exportDapCmsSnapshot()
  const qa       = runClaimQA(snapshot)

  return (
    <div className="space-y-6">

      {/* ── Internal warning banner ─────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 space-y-1">
        <p className="text-sm font-semibold text-amber-800">
          Internal preview data — not patient-facing copy.
        </p>
        <p className="text-xs text-amber-700">
          This page is for reviewer inspection only. It lives inside the /preview namespace and
          must not be exposed as a production route.
        </p>
      </div>

      {/* ── QA status ──────────────────────────────────────────────────── */}
      <QAStatusBanner qa={qa} />

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <StatsGrid qa={qa} />

      {/* ── QA warnings detail ─────────────────────────────────────────── */}
      {qa.warnings.length > 0 && <WarningsDetail warnings={qa.warnings} />}

      {/* ── Grouped records ────────────────────────────────────────────── */}
      <GroupedRecords snapshot={snapshot} />

      {/* ── Raw JSON (full snapshot for deep inspection) ───────────────── */}
      <Section title={`Practices — full records (${snapshot.practices.length})`}>
        <JsonBlock value={snapshot.practices} />
      </Section>

      <Section title={`Cities — full records (${snapshot.cities.length})`}>
        <JsonBlock value={snapshot.cities} />
      </Section>

      <Section title={`Dentist pages — full records (${snapshot.dentistPages.length})`}>
        <JsonBlock value={snapshot.dentistPages} />
      </Section>

      <Section title={`Decision pages — full records (${snapshot.decisionPages.length})`}>
        <JsonBlock value={snapshot.decisionPages} />
      </Section>

      <Section title={`Treatment pages — full records (${snapshot.treatmentPages.length})`}>
        <JsonBlock value={snapshot.treatmentPages} />
      </Section>

    </div>
  )
}

// ─── QA status banner ─────────────────────────────────────────────────────────

function QAStatusBanner({ qa }: { qa: QASummary }) {
  if (qa.totalWarnings === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-green-600 text-lg">✓</span>
        <div>
          <p className="text-sm font-semibold text-green-800">QA — All clear</p>
          <p className="text-xs text-green-700">
            No unsafe claim leakage detected across {qa.totalPractices} practices,{' '}
            {qa.totalCities} cities, {qa.totalDentistPages} dentist pages,{' '}
            and {qa.totalDecisionPages} decision pages.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 space-y-1">
      <p className="text-sm font-semibold text-red-800">
        QA — {qa.totalWarnings} warning{qa.totalWarnings !== 1 ? 's' : ''} found
      </p>
      <p className="text-xs text-red-700">
        Review the warnings below before publishing any of these pages.
      </p>
    </div>
  )
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

function StatsGrid({ qa }: { qa: QASummary }) {
  const stats = [
    { label: 'Practices (public)',      value: qa.totalPractices },
    { label: 'Confirmed providers',     value: qa.confirmedProviders },
    { label: 'Non-confirmed',           value: qa.nonConfirmedPractices },
    { label: 'With pricing visible',    value: qa.practicesWithPricing },
    { label: 'With Join CTA',           value: qa.practicesWithJoinCta },
    { label: 'City pages',              value: qa.totalCities },
    { label: 'Dentist pages',           value: qa.totalDentistPages },
    { label: 'Confirmed dentist pages', value: qa.confirmedDentistPages },
    { label: 'Non-confirmed dentist',   value: qa.nonConfirmedDentistPages },
    { label: 'Decision pages',          value: qa.totalDecisionPages },
    { label: 'Treatment pages',             value: qa.totalTreatmentPages },
    { label: 'Forbidden claims tracked (internal)', value: qa.decisionPagesWithForbiddenClaims + qa.treatmentPagesWithForbiddenClaims },
    { label: 'QA warnings',             value: qa.totalWarnings, highlight: qa.totalWarnings > 0 },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, highlight }) => (
        <div
          key={label}
          className={`rounded-lg border px-4 py-3 text-center ${
            highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
          }`}
        >
          <p className={`text-2xl font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>
            {value}
          </p>
          <p className={`text-xs mt-0.5 ${highlight ? 'text-red-600' : 'text-gray-500'}`}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Warnings detail ──────────────────────────────────────────────────────────

function WarningsDetail({ warnings }: { warnings: QAWarning[] }) {
  const CATEGORY_LABELS: Record<string, string> = {
    confirmed_provider_claim:     'Confirmed-provider claim',
    pricing_claim:                'Pricing claim',
    enrollment_claim:             'Enrollment claim',
    universal_availability_claim: 'Universal availability claim',
  }

  return (
    <Section title={`QA Warnings (${warnings.length})`}>
      <div className="space-y-3">
        {warnings.map((w, i) => (
          <div key={i} className="border border-red-100 rounded-lg px-4 py-3 bg-red-50 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                {CATEGORY_LABELS[w.category] ?? w.category}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{w.recordType}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-mono text-gray-600">{w.recordId}</span>
            </div>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Field:</span> {w.field}
            </p>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Phrase:</span>{' '}
              <span className="font-mono text-red-600">&ldquo;{w.phrase}&rdquo;</span>
            </p>
            <p className="text-xs text-gray-500">{w.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Grouped records ──────────────────────────────────────────────────────────

function TreatmentPageRows({ pages }: { pages: DapTreatmentPageCmsRecord[] }) {
  return (
    <Section title={`Treatment pages (${pages.length})`}>
      <div className="space-y-2">
        {pages.map(t => (
          <div key={t.slug} className="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
            <span className="font-mono text-gray-700">{t.slug}</span>
            <div className="flex gap-3 text-gray-500">
              <span className="capitalize">{t.treatment}</span>
              <span className="capitalize">{t.publicClaimLevel}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function GroupedRecords({ snapshot }: { snapshot: DapCmsSnapshot }) {
  const confirmed = snapshot.dentistPages.filter(d => d.publicState === 'confirmed_provider')
  const nonConfirmed = snapshot.dentistPages.filter(d => d.publicState !== 'confirmed_provider')

  return (
    <div className="space-y-4">

      <Section title={`Confirmed dentist pages (${confirmed.length})`}>
        <div className="space-y-2">
          {confirmed.map(d => (
            <div key={d.slug} className="flex items-center justify-between text-xs px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
              <span className="font-mono text-green-800">{d.slug}</span>
              <div className="flex gap-3 text-green-700">
                <span>{d.offerSummary ? '✓ pricing' : '— pricing pending'}</span>
                <span>{d.primaryCta.href.includes('/enroll') ? '✓ Join CTA' : '— Join CTA'}</span>
              </div>
            </div>
          ))}
          {confirmed.length === 0 && (
            <p className="text-xs text-gray-400 italic">No confirmed dentist pages in snapshot.</p>
          )}
        </div>
      </Section>

      <Section title={`Non-confirmed dentist pages (${nonConfirmed.length})`}>
        <div className="space-y-2">
          {nonConfirmed.map(d => (
            <div key={d.slug} className="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="font-mono text-gray-700">{d.slug}</span>
              <span className="text-gray-500 capitalize">{d.publicState}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`City pages (${snapshot.cities.length})`}>
        <div className="space-y-2">
          {snapshot.cities.map(c => (
            <div key={c.slug} className="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="font-mono text-gray-700">{c.slug}</span>
              <div className="flex gap-3 text-gray-500">
                <span className="capitalize">{c.publicClaimLevel}</span>
                <span>{c.visiblePracticeSlugs.length} visible</span>
                <span>{c.hiddenPracticeIds.length} hidden</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Decision pages (${snapshot.decisionPages.length})`}>
        <div className="space-y-2">
          {snapshot.decisionPages.map(d => (
            <div key={d.slug} className="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="font-mono text-gray-700">{d.slug}</span>
              <div className="flex gap-3 text-gray-500">
                <span className="capitalize">{d.publicClaimLevel}</span>
                <span>{d.forbiddenClaims.length} internal claims</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <TreatmentPageRows pages={snapshot.treatmentPages} />

    </div>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 py-4 max-h-96 overflow-auto">
        {children}
      </div>
    </div>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
