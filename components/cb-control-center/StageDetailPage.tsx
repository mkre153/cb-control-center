import type { DapStageGate, DapStageStatus } from '@/lib/cb-control-center/dapStageGates'
import { getNextDapStageGate } from '@/lib/cb-control-center/dapStageGates'
import { StageArtifactPanel } from './StageArtifactPanel'
import { StageEvidencePanel } from './StageEvidencePanel'
import { StageApprovalChecklist } from './StageApprovalChecklist'
import { StageDirectivePanel } from './StageDirectivePanel'

// ─── Status display ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DapStageStatus, string> = {
  not_started:             'Not Started',
  ready_for_directive:     'Ready for Directive',
  directive_issued:        'Directive Issued',
  in_progress:             'In Progress',
  evidence_submitted:      'Evidence Submitted',
  validation_passed:       'Validation Passed',
  awaiting_owner_approval: 'Awaiting Owner Approval',
  approved:                'Approved',
  revision_requested:      'Revision Requested',
  blocked:                 'Blocked',
}

const STATUS_BADGE: Record<DapStageStatus, string> = {
  not_started:             'bg-gray-100 text-gray-500',
  ready_for_directive:     'bg-blue-50 text-blue-600',
  directive_issued:        'bg-indigo-100 text-indigo-700',
  in_progress:             'bg-blue-100 text-blue-700',
  evidence_submitted:      'bg-cyan-100 text-cyan-700',
  validation_passed:       'bg-teal-100 text-teal-700',
  awaiting_owner_approval: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
  approved:                'bg-green-100 text-green-700',
  revision_requested:      'bg-orange-100 text-orange-700',
  blocked:                 'bg-red-100 text-red-700',
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  accent,
}: {
  title: string
  children: React.ReactNode
  accent?: 'amber' | 'green' | 'red'
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

// ─── Anti-bypass rule ─────────────────────────────────────────────────────────

function AntiBypassRule() {
  return (
    <div
      data-anti-bypass-rule
      className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 leading-relaxed"
    >
      <span className="font-semibold text-gray-700">Anti-bypass rule: </span>
      No DAP implementation phase may begin without a CBCC-issued directive for that stage.
      Each phase stops at evidence submission. Owner must approve before the next directive is issued.
    </div>
  )
}

// ─── Stage detail page ────────────────────────────────────────────────────────

export function StageDetailPage({ stage }: { stage: DapStageGate }) {
  const isApproved = stage.status === 'approved'
  const isAwaiting = stage.status === 'awaiting_owner_approval'
  const isNotStarted = stage.status === 'not_started'
  const nextStage = getNextDapStageGate(stage)

  const BUILD_BASE = '/businesses/dental-advantage-plan/build'

  return (
    <div data-stage-detail-page data-stage-id={stage.stageId} className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Breadcrumb */}
        <nav
          data-breadcrumb
          className="flex items-center gap-2 text-sm text-gray-500 flex-wrap"
          aria-label="Breadcrumb"
        >
          <a href="/" className="hover:text-gray-800 transition-colors">CB Control Center</a>
          <span className="text-gray-300">/</span>
          <a href="/businesses/dental-advantage-plan" className="hover:text-gray-800 transition-colors">
            Dental Advantage Plan
          </a>
          <span className="text-gray-300">/</span>
          <a href={BUILD_BASE} className="hover:text-gray-800 transition-colors">Build Pipeline</a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-medium" aria-current="page">{stage.title}</span>
        </nav>

        {/* Stage header */}
        <div data-stage-header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              isApproved ? 'bg-green-500 text-white' :
              isAwaiting ? 'bg-amber-400 text-white' :
              isNotStarted ? 'bg-gray-200 text-gray-500' :
              'bg-blue-400 text-white'
            }`}>
              {stage.stageNumber}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Stage {stage.stageNumber}: {stage.title}</h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{stage.stageId}</p>
            </div>
            <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[stage.status]}`}>
              {STATUS_LABEL[stage.status]}
            </span>
          </div>

          {isApproved && stage.approvedAt && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span className="font-semibold">✓ Approved by Owner</span>
              <span className="text-green-400">·</span>
              <span>{stage.approvedAt}</span>
              {stage.nextStageUnlocked && (
                <>
                  <span className="text-green-400">·</span>
                  <span>Next stage unlocked</span>
                </>
              )}
            </div>
          )}

          <AntiBypassRule />
        </div>

        {/* Awaiting approval — show checklist prominently */}
        {isAwaiting && (
          <Section title="Owner Approval Required" accent="amber">
            <StageApprovalChecklist stage={stage} />
          </Section>
        )}

        {/* Purpose */}
        <Section title="Purpose">
          <div className="space-y-3">
            <p className="text-sm text-gray-800 leading-relaxed">{stage.description}</p>
            <div className="border-l-2 border-gray-200 pl-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Why this stage matters</p>
              <p className="text-sm text-gray-600 leading-relaxed italic">{stage.whyItMatters}</p>
            </div>
          </div>
        </Section>

        {/* Reviewable artifact */}
        {stage.artifact ? (
          <Section title="Reviewable Artifact" accent={isAwaiting ? 'amber' : isApproved ? 'green' : undefined}>
            <StageArtifactPanel artifact={stage.artifact} />
          </Section>
        ) : isNotStarted ? (
          <Section title="Reviewable Artifact">
            <p className="text-sm text-gray-400 italic">
              Not generated yet. This stage requires prior stage approval before a directive is issued.
            </p>
          </Section>
        ) : null}

        {/* Approval checklist for approved stages */}
        {isApproved && (
          <Section title="Approval Record" accent="green">
            <StageApprovalChecklist stage={stage} />
          </Section>
        )}

        {/* Evidence trail */}
        <Section title="Evidence Trail">
          <StageEvidencePanel evidence={stage.implementationEvidence} />
        </Section>

        {/* Claude directive */}
        {stage.directive.trim() && (
          <Section title="Claude Directive">
            <StageDirectivePanel directive={stage.directive} stageId={stage.stageId} />
          </Section>
        )}

        {/* Blockers */}
        {(stage.blockers.length > 0 || stage.implementationEvidence.unresolvedIssues?.length) ? (
          <Section title="Blockers / Dependencies" accent="red">
            <ul className="space-y-2">
              {stage.blockers.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="shrink-0 mt-0.5">⊘</span>
                  {b}
                </li>
              ))}
              {stage.implementationEvidence.unresolvedIssues?.map(i => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="shrink-0 mt-0.5">⊘</span>
                  {i}
                </li>
              ))}
            </ul>
          </Section>
        ) : (
          <Section title="Blockers / Dependencies">
            <p className="text-sm text-gray-400">No blockers.</p>
          </Section>
        )}

        {/* Unlock rule */}
        <Section title="Next-Stage Unlock Rule">
          {isApproved && stage.nextStageUnlocked ? (
            <div className="space-y-2">
              <p className="text-sm text-green-700 font-semibold">
                ✓ Stage {stage.stageNumber} is approved. Stage {stage.stageNumber + 1} is unlocked.
              </p>
              {nextStage && (
                <a
                  href={`${BUILD_BASE}/stages/${nextStage.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Open Stage {nextStage.stageNumber}: {nextStage.title} →
                </a>
              )}
            </div>
          ) : isAwaiting ? (
            <p className="text-sm text-amber-700">
              Owner approval required before Stage {stage.stageNumber + 1} can begin.
              Approve this stage in <code className="font-mono bg-amber-50 px-0.5 rounded">dapStageGates.ts</code>.
            </p>
          ) : isNotStarted ? (
            <p className="text-sm text-gray-500">
              Stage {stage.stageNumber - 1} must be owner-approved before this stage&apos;s directive is issued.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              This stage must be approved before Stage {stage.stageNumber + 1} can begin.
            </p>
          )}
        </Section>

        {/* Back to overview */}
        <div className="pt-2">
          <a
            href={BUILD_BASE}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back to Build Pipeline
          </a>
        </div>

      </div>
    </div>
  )
}
