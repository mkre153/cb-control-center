import type { DapStageGate, DapStageStatus } from '@/lib/cb-control-center/dapStageGates'
import { getNextDapStageGate } from '@/lib/cb-control-center/dapStageGates'
import type { CbccEvidenceRequirement } from '@/lib/cbcc/types'
import { StageArtifactPanel } from './StageArtifactPanel'
import { StageEvidencePanel } from './StageEvidencePanel'
import { StageApprovalChecklist } from './StageApprovalChecklist'
import { StageDirectivePanel } from './StageDirectivePanel'
import { StageAiReviewPanel } from './StageAiReviewPanel'
import { StageMissingEvidencePanel } from './StageMissingEvidencePanel'
import { StageSection } from './StageSection'
import { AntiBypassBanner } from './AntiBypassBanner'

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

// ─── Stage detail page ────────────────────────────────────────────────────────

export function StageDetailPage({
  stage,
  breadcrumbBase = '/businesses/dental-advantage-plan/build',
  breadcrumbTrail,
  nextStageHref,
  projectSlug,
  missingEvidence,
}: {
  stage: DapStageGate
  breadcrumbBase?: string
  breadcrumbTrail?: ReadonlyArray<{ label: string; href?: string }>
  nextStageHref?: (nextStage: DapStageGate) => string
  // Project slug for the AI review API. When omitted (legacy v1 caller),
  // the panel posts without a projectSlug and the route treats it as DAP.
  projectSlug?: string
  // Required evidence items the engine reports as missing for this stage.
  // Supplied by engine-backed callers (v2 route); legacy v1 caller omits.
  // The panel only renders when the array is non-empty.
  missingEvidence?: ReadonlyArray<CbccEvidenceRequirement>
}) {
  const isApproved = stage.status === 'approved'
  const isAwaiting = stage.status === 'awaiting_owner_approval'
  const isNotStarted = stage.status === 'not_started'
  const nextStage = getNextDapStageGate(stage)

  const BUILD_BASE = breadcrumbBase

  const trail: ReadonlyArray<{ label: string; href?: string }> = breadcrumbTrail ?? [
    { label: 'CB Control Center', href: '/' },
    { label: 'Dental Advantage Plan', href: '/businesses/dental-advantage-plan' },
    { label: 'Build Pipeline', href: BUILD_BASE },
  ]

  return (
    <div data-stage-detail-page data-stage-id={stage.stageId} className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Breadcrumb */}
        <nav
          data-breadcrumb
          className="flex items-center gap-2 text-sm text-gray-500 flex-wrap"
          aria-label="Breadcrumb"
        >
          {trail.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-2">
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-800 transition-colors">{crumb.label}</a>
              ) : (
                <span>{crumb.label}</span>
              )}
              <span className="text-gray-300">/</span>
            </span>
          ))}
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
              <h1 className="text-xl font-bold text-gray-900">{stage.title}</h1>
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

          <AntiBypassBanner />
        </div>

        {/* Missing required evidence — rendered above the owner approval
            surface so the operator sees what blocks approval before any
            approval CTA. Only present when the engine reports items missing
            (i.e. the stage is unlocked but requirements are unmet). */}
        {missingEvidence && missingEvidence.length > 0 && (
          <StageMissingEvidencePanel items={missingEvidence} />
        )}

        {/* Awaiting approval — show checklist prominently */}
        {isAwaiting && (
          <StageSection title="Owner Approval Required" accent="amber">
            <StageApprovalChecklist stage={stage} />
          </StageSection>
        )}

        {/* Purpose */}
        <StageSection title="Purpose">
          <div className="space-y-3">
            <p className="text-sm text-gray-800 leading-relaxed">{stage.description}</p>
            <div className="border-l-2 border-gray-200 pl-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Why this stage matters</p>
              <p className="text-sm text-gray-600 leading-relaxed italic">{stage.whyItMatters}</p>
            </div>
          </div>
        </StageSection>

        {/* Reviewable artifact */}
        {stage.artifact ? (
          <StageSection title="Reviewable Artifact" accent={isAwaiting ? 'amber' : isApproved ? 'green' : undefined}>
            <StageArtifactPanel artifact={stage.artifact} />
          </StageSection>
        ) : isNotStarted ? (
          <StageSection title="Reviewable Artifact">
            <p className="text-sm text-gray-400 italic">
              Not generated yet. This stage requires prior stage approval before a directive is issued.
            </p>
          </StageSection>
        ) : null}

        {/* Approval checklist for approved stages */}
        {isApproved && (
          <StageSection title="Approval Record" accent="green">
            <StageApprovalChecklist stage={stage} />
          </StageSection>
        )}

        {/* Evidence trail */}
        <StageSection title="Evidence Trail">
          <StageEvidencePanel evidence={stage.implementationEvidence} />
        </StageSection>

        {/* Claude directive — locked stages keep the directive visible for
            transparency but mark it as "Directive Preview — Locked" to prevent
            social bypass. The locked signal is `blockers.length > 0`, which the
            engine and v1 registry both populate when a predecessor is not yet
            owner-approved. Unlocked / approved / awaiting-approval stages keep
            the original copy. */}
        {stage.directive.trim() && (
          stage.blockers.length > 0 ? (
            <StageSection title="Directive Preview — Locked" accent="red">
              <div
                data-locked-directive-warning
                className="mb-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed"
              >
                This directive is visible for planning only. It is not authorized
                for execution until all blockers are cleared and the prior stage
                is owner-approved.
              </div>
              <StageDirectivePanel directive={stage.directive} stageId={stage.stageId} locked />
            </StageSection>
          ) : (
            <StageSection title="Claude Directive">
              <StageDirectivePanel directive={stage.directive} stageId={stage.stageId} />
            </StageSection>
          )
        )}

        {/* Blockers */}
        {(stage.blockers.length > 0 || stage.implementationEvidence.unresolvedIssues?.length) ? (
          <StageSection title="Blockers / Dependencies" accent="red">
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
          </StageSection>
        ) : (
          <StageSection title="Blockers / Dependencies">
            <p className="text-sm text-gray-400">No blockers.</p>
          </StageSection>
        )}

        {/* Unlock rule */}
        <StageSection title="Next-Stage Unlock Rule">
          {isApproved && stage.nextStageUnlocked ? (
            <div className="space-y-2">
              <p className="text-sm text-green-700 font-semibold">
                ✓ Stage {stage.stageNumber} is approved. Stage {stage.stageNumber + 1} is unlocked.
              </p>
              {nextStage && (
                <a
                  href={nextStageHref ? nextStageHref(nextStage) : `${BUILD_BASE}/stages/${nextStage.slug}`}
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
        </StageSection>

        {/* Opus 4.7 AI Review */}
        <StageAiReviewPanel
          stageSlug={stage.slug}
          stageNumber={stage.stageNumber}
          stageTitle={stage.title}
          projectSlug={projectSlug}
        />

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
