import { spawn } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { DAP_STAGE_GATES, type DapStageStatus } from '@/lib/cb-control-center/dapStageGates'
import { getDapStageApprovalStore } from '@/lib/cb-control-center/dapStageApprovalStore'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/Users/mike/.local/bin/claude'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function statusLabel(s: DapStageStatus): string {
  const map: Record<DapStageStatus, string> = {
    not_started: 'Not started',
    ready_for_directive: 'Ready for directive',
    directive_issued: 'Directive issued',
    in_progress: 'In progress',
    evidence_submitted: 'Evidence submitted',
    validation_passed: 'Validation passed',
    awaiting_owner_approval: 'Awaiting owner approval',
    approved: 'Approved ✓',
    revision_requested: 'Revision requested',
    blocked: 'Blocked',
  }
  return map[s] ?? s
}

function formatHistory(messages: Message[]): string {
  return messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n')
}

async function buildDapPrompt(messages: Message[]): Promise<string> {
  const persistedApprovals = await getDapStageApprovalStore().list().catch(() => [])
  const persistedByNumber = new Map(persistedApprovals.map(p => [p.stageNumber, p]))

  const effectiveGates = DAP_STAGE_GATES.map(g => ({
    ...g,
    approvedByOwner: persistedByNumber.get(g.stageNumber)?.approved ?? g.approvedByOwner,
  }))

  const pipelineSummary = effectiveGates.map(g =>
    `  Stage ${g.stageNumber} — ${g.title}: ${g.approvedByOwner ? 'Approved ✓' : statusLabel(g.status)}`
  ).join('\n')

  const activeGate = effectiveGates.find(g => !g.approvedByOwner)

  const activeSection = activeGate
    ? `
## Current Stage: Stage ${activeGate.stageNumber} — ${activeGate.title}
Status: ${statusLabel(activeGate.status)}
Description: ${activeGate.description}
Why it matters: ${activeGate.whyItMatters}

### Stage Directive
${activeGate.directive}

### Requirements
${activeGate.requirements.map(r => `- ${r}`).join('\n')}

### Required Approvals
${activeGate.requiredApprovals.map(r => `- ${r}`).join('\n')}
${activeGate.blockers.length > 0 ? `\n### Blockers\n${activeGate.blockers.map(b => `- ${b}`).join('\n')}` : ''}
`
    : '\nAll stages approved.'

  return `[SYSTEM CONTEXT — CB Control Center AI Assistant]

You are the AI advisor for the Dental Advantage Plan (DAP) build pipeline inside CB Control Center.

DAP is a dental membership marketplace — NOT dental insurance. It connects patients with participating practices that offer a membership plan giving members discounted rates on dental procedures.

Your role:
- Answer questions about this project's stages, requirements, directives, and what to do next
- Explain approval criteria and what evidence is needed to advance
- Reference the current stage directive when advising on implementation
- NEVER approve stages yourself — approval requires an owner git commit to dapStageGates.ts

## Build Pipeline
${pipelineSummary}
${activeSection}
[CONVERSATION]

${formatHistory(messages)}`
}

async function buildProjectPrompt(slug: string, messages: Message[]): Promise<string> {
  const project = await getProjectBySlug(slug).catch(() => null)
  if (!project) {
    return `[SYSTEM CONTEXT]\nYou are the CB Control Center AI assistant. The project "${slug}" could not be loaded.\n\n[CONVERSATION]\n\n${formatHistory(messages)}`
  }

  const stages = await getProjectStages(project.id).catch(() => [])

  const pipelineSummary = stages.length > 0
    ? stages.map(s => `  Stage ${s.stageNumber} — ${s.stageTitle}: ${s.stageStatus}`).join('\n')
    : '  No stages registered yet.'

  const charterSection = project.charterJson
    ? `
## Project Charter
What it is: ${project.charterJson.whatThisIs}
Who it serves: ${project.charterJson.whoItServes}
Allowed claims: ${project.charterJson.allowedClaims.join('; ')}
Forbidden claims: ${project.charterJson.forbiddenClaims.join('; ')}
`
    : ''

  return `[SYSTEM CONTEXT — CB Control Center AI Assistant]

You are the AI advisor for the "${project.name}" build pipeline inside CB Control Center.

Business type: ${project.businessType ?? 'Not specified'}
Primary goal: ${project.primaryGoal ?? 'Not specified'}
Target customer: ${project.targetCustomer ?? 'Not specified'}
${charterSection}
## Build Pipeline
${pipelineSummary}

[CONVERSATION]

${formatHistory(messages)}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.projectSlug !== 'string' || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const { projectSlug, messages } = body as { projectSlug: string; messages: Message[] }

  const prompt = isEngineBackedSlug(projectSlug)
    ? await buildDapPrompt(messages)
    : await buildProjectPrompt(projectSlug, messages)

  const child = spawn(CLAUDE_BIN, ['-p', prompt, '--model', 'claude-sonnet-4-5'], {
    env: { ...process.env, PATH: `/Users/mike/.local/bin:${process.env.PATH ?? ''}` },
  })

  child.stdin.end()

  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      child.stdout.on('data', (chunk: Buffer) => controller.enqueue(chunk))
      child.stdout.on('end', () => controller.close())
      child.stderr.on('data', () => {})
      child.on('error', err => controller.error(err))
    },
    cancel() {
      child.kill()
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
