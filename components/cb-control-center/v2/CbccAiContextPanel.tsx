import { DAP_BUSINESS_DEFINITION } from '@/lib/cb-control-center/dapBusinessDefinition'
import { DAP_STAGE_GATES, type DapStageGate, type DapStageStatus } from '@/lib/cb-control-center/dapStageGates'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import { getDapStageApprovalStore } from '@/lib/cb-control-center/dapStageApprovalStore'

// ─── Suggested prompts per next stage ─────────────────────────────────────────

const STAGE_PROMPTS: Record<number, string[]> = {
  1: [
    'What does Stage 1 need before approval?',
    'What claims should be forbidden for this project?',
    "Why can't we start copywriting yet?",
    'Show me the Stage 1 directive.',
  ],
  2: [
    'What does Stage 2 need to cover?',
    'Which existing DAP pages are likely to violate truth rules?',
    'What makes a CTA forbidden in Stage 2?',
    'Show me the Stage 2 directive.',
  ],
  3: [
    'What are the 7 DAP truth rules?',
    'What critical violations must Stage 3 acknowledge?',
    "What's the difference between forbidden claims and truth rules?",
    'Show me the Stage 3 directive.',
  ],
  4: [
    'What does a DAP BrandScript look like?',
    'How does StoryBrand positioning work within truth schema constraints?',
    'What does Stage 4 need before approval?',
    'Show me the Stage 4 directive.',
  ],
  5: [
    "What's the difference between SEO and AEO?",
    'What goes in a Core30 keyword set?',
    'How does content cluster architecture work for DAP?',
    'Show me the Stage 5 directive.',
  ],
  6: [
    'What page types does DAP need?',
    'What makes a good content brief?',
    'How does page architecture inherit from the truth schema?',
    'Show me the Stage 6 directive.',
  ],
  7: [
    'What does Stage 7 QA check against?',
    "What's the launch checklist for DAP?",
    'How is Stage 7 acceptance tested?',
    'Show me the Stage 7 directive.',
  ],
}

export async function getCbccSuggestedPrompts(slug: string): Promise<string[]> {
  if (!isEngineBackedSlug(slug)) {
    return [
      'What does the next stage require?',
      'What claims should be forbidden for this project?',
      'What evidence is needed for the next approval?',
    ]
  }
  const persistedApprovals = await getDapStageApprovalStore().list().catch(() => [])
  const persistedByNumber = new Map(persistedApprovals.map(p => [p.stageNumber, p]))
  const next = DAP_STAGE_GATES.find(g => !(persistedByNumber.get(g.stageNumber)?.approved ?? g.approvedByOwner))
  if (!next) return ['How do I verify the full build is complete?', 'What comes after Stage 7?']
  return STAGE_PROMPTS[next.stageNumber] ?? []
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

function SectionHeader({ label, dot }: { label: string; dot: 'green' | 'blue' | 'amber' | 'gray' }) {
  const dots = { green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500', gray: 'bg-gray-600' }
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[dot]}`} />
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs leading-relaxed">
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-300">{value}</span>
    </p>
  )
}

function Bullet({ text }: { text: string }) {
  return (
    <li className="flex gap-2 text-xs text-gray-400">
      <span className="text-gray-600 shrink-0 mt-px">—</span>
      <span className="leading-relaxed">{text}</span>
    </li>
  )
}

function Check({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="mt-0.5 w-3.5 h-3.5 rounded-sm border border-gray-700 shrink-0" />
      <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-800/60 pt-5" />
}

function statusLabel(s: DapStageStatus): string {
  const m: Record<DapStageStatus, string> = {
    not_started: 'Not started',
    ready_for_directive: 'Ready for directive',
    directive_issued: 'Directive issued',
    in_progress: 'In progress',
    evidence_submitted: 'Evidence submitted',
    validation_passed: 'Validation passed',
    awaiting_owner_approval: 'Awaiting owner approval',
    approved: 'Approved',
    revision_requested: 'Revision requested',
    blocked: 'Blocked',
  }
  return m[s] ?? s
}

// ─── DAP sections ──────────────────────────────────────────────────────────────

function DapLastApprovedStage({ stage }: { stage: DapStageGate }) {
  const short = stage.title.replace(/Stage \d+ — /, '')
  return (
    <div>
      <SectionHeader label="Last Approved Stage" dot="green" />
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">Stage {stage.stageNumber} — {short}</p>
        <span className="text-xs text-green-400 shrink-0">Approved{stage.approvedAt ? ` ${stage.approvedAt}` : ''}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{stage.description}</p>
    </div>
  )
}

function DapCharterDigest({ lastApproved }: { lastApproved: DapStageGate | null }) {
  const d = DAP_BUSINESS_DEFINITION
  return (
    <div>
      <SectionHeader label="Charter Digest" dot="green" />
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-white">{d.businessName}</p>
          <span className="text-xs text-green-400 shrink-0">
            Charter approved{lastApproved?.approvedAt ? ` ${lastApproved.approvedAt}` : ''}.
          </span>
        </div>
        <FieldRow label="Project" value={d.businessName} />
        <div>
          <p className="text-xs text-gray-500 mb-1">What this project is:</p>
          <p className="text-xs text-gray-300 leading-relaxed">{d.summary}</p>
        </div>
        <FieldRow label="Primary user" value={d.primaryCustomer} />
        <FieldRow label="Primary business goal" value={d.primaryConversionGoal} />
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Truth constraints:</p>
          <ul className="space-y-1">
            {d.truthRules.slice(0, 5).map((rule, i) => <Bullet key={i} text={rule} />)}
          </ul>
        </div>
      </div>
    </div>
  )
}

function DapStageBriefing({ stage }: { stage: DapStageGate }) {
  const short = stage.title.replace(/Stage \d+ — /, '')
  return (
    <div>
      <SectionHeader label="Next Stage Briefing" dot="blue" />
      <div className="space-y-2.5">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Next stage:</p>
          <p className="text-sm font-semibold text-white">Stage {stage.stageNumber} — {short}</p>
          <p className="text-xs text-gray-500 mt-0.5">{statusLabel(stage.status)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Purpose:</p>
          <p className="text-xs text-gray-300 leading-relaxed">{stage.description}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1.5">What Stage {stage.stageNumber} must produce:</p>
          <ul className="space-y-1">
            {stage.requirements.map((r, i) => <Bullet key={i} text={r} />)}
          </ul>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Why this matters:</p>
          <p className="text-xs text-gray-400 leading-relaxed italic">{stage.whyItMatters}</p>
        </div>
      </div>
    </div>
  )
}

function DapEvidenceChecklist({ stage }: { stage: DapStageGate }) {
  return (
    <div>
      <SectionHeader label="Required Evidence" dot="gray" />
      <p className="text-xs text-gray-500 mb-2">Required before Stage {stage.stageNumber} approval:</p>
      <div className="space-y-1.5">
        {stage.requirements.map((r, i) => <Check key={i} text={r} />)}
      </div>
    </div>
  )
}

function DapRecommendation({ stage }: { stage: DapStageGate }) {
  const short = stage.title.replace(/Stage \d+ — /, '')
  const futureStages = DAP_STAGE_GATES
    .filter(g => g.stageNumber > stage.stageNumber)
    .slice(0, 2)
    .map(g => `Stage ${g.stageNumber}`)
    .join(', ')

  return (
    <div>
      <SectionHeader label="Recommended Next Action" dot="amber" />
      <div className="rounded-md bg-amber-950/30 border border-amber-800/30 px-3 py-3 space-y-2">
        <p className="text-xs text-amber-300 font-medium">
          Open Stage {stage.stageNumber} and begin the {short}.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          {stage.externalTool
            ? `This stage uses ${stage.externalTool.name}. ${stage.externalTool.role}`
            : `Issue the Stage ${stage.stageNumber} directive and submit evidence before requesting owner approval.`}
        </p>
        {futureStages && (
          <p className="text-xs text-gray-500">
            Do not begin {futureStages} until Stage {stage.stageNumber} is approved.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main export (async server component) ─────────────────────────────────────

export async function CbccAiContextPanel({ slug }: { slug: string }) {
  // ── DAP engine-backed ──────────────────────────────────────────────────────
  if (isEngineBackedSlug(slug)) {
    const persistedApprovals = await getDapStageApprovalStore().list().catch(() => [])
    const persistedByNumber = new Map(persistedApprovals.map(p => [p.stageNumber, p]))

    const effectiveGates = DAP_STAGE_GATES.map(g => ({
      ...g,
      approvedByOwner: persistedByNumber.get(g.stageNumber)?.approved ?? g.approvedByOwner,
      approvedAt: persistedByNumber.get(g.stageNumber)?.approvedAt ?? g.approvedAt,
    }))

    const approvedGates = effectiveGates.filter(g => g.approvedByOwner).sort((a, b) => b.stageNumber - a.stageNumber)
    const lastApproved = approvedGates[0] ?? null
    const nextStage = effectiveGates.find(g => !g.approvedByOwner) ?? null

    return (
      <div className="px-4 py-5 space-y-5">
        <DapCharterDigest lastApproved={lastApproved} />
        {lastApproved && (
          <>
            <Divider />
            <DapLastApprovedStage stage={lastApproved} />
          </>
        )}
        {nextStage ? (
          <>
            <Divider />
            <DapStageBriefing stage={nextStage} />
            <Divider />
            <DapEvidenceChecklist stage={nextStage} />
            <Divider />
            <DapRecommendation stage={nextStage} />
          </>
        ) : (
          <>
            <Divider />
            <div>
              <SectionHeader label="Pipeline Complete" dot="green" />
              <p className="text-xs text-gray-300">All 7 stages are approved. The DAP build pipeline is complete.</p>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Supabase-backed project ────────────────────────────────────────────────
  const project = await getProjectBySlug(slug).catch(() => null)
  if (!project) {
    return (
      <div className="px-4 py-5">
        <p className="text-xs text-gray-500">Project context unavailable.</p>
      </div>
    )
  }

  const stages = await getProjectStages(project.id).catch(() => [])
  const nextStage = stages.find(s => !s.approved)

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Charter Digest */}
      <div>
        <SectionHeader label="Charter Digest" dot={project.charterApproved ? 'green' : 'gray'} />
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white">{project.name}</p>
            <span className={`text-xs shrink-0 ${project.charterApproved ? 'text-green-400' : 'text-gray-500'}`}>
              {project.charterApproved ? 'Charter approved.' : 'Charter pending.'}
            </span>
          </div>
          {project.charterJson ? (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">What this project is:</p>
                <p className="text-xs text-gray-300 leading-relaxed">{project.charterJson.whatThisIs}</p>
              </div>
              <FieldRow label="Primary user" value={project.charterJson.whoItServes} />
              {project.charterJson.forbiddenClaims.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Forbidden claims:</p>
                  <ul className="space-y-1">
                    {project.charterJson.forbiddenClaims.slice(0, 5).map((c, i) => <Bullet key={i} text={c} />)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">Charter not yet generated.</p>
          )}
        </div>
      </div>

      {/* Next stage */}
      {nextStage && (
        <>
          <Divider />
          <div>
            <SectionHeader label="Next Stage Briefing" dot="blue" />
            <p className="text-sm font-semibold text-white mb-1">
              Stage {nextStage.stageNumber} — {nextStage.stageTitle}
            </p>
            <p className="text-xs text-gray-500">{nextStage.stageStatus}</p>
          </div>
          <Divider />
          <div>
            <SectionHeader label="Recommended Next Action" dot="amber" />
            <div className="rounded-md bg-amber-950/30 border border-amber-800/30 px-3 py-3">
              <p className="text-xs text-amber-300 font-medium">
                Open Stage {nextStage.stageNumber} and begin {nextStage.stageTitle}.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
