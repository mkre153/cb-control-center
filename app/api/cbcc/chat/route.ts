import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { DAP_STAGE_GATES, type DapStageStatus } from '@/lib/cb-control-center/dapStageGates'
import { getDapStageApprovalStore } from '@/lib/cb-control-center/dapStageApprovalStore'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'

const anthropic = new Anthropic()

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

async function buildDapSystemPrompt(): Promise<string> {
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

  return `You are the AI advisor for the Dental Advantage Plan (DAP) build pipeline inside CB Control Center.

DAP is a dental membership marketplace — NOT dental insurance. It connects patients with participating practices that offer a membership plan giving members discounted rates on dental procedures.

Your role:
- Answer questions about this project's stages, requirements, directives, and what to do next
- Explain approval criteria and what evidence is needed to advance
- Reference the current stage directive when advising on implementation
- NEVER approve stages yourself — approval requires an owner git commit to dapStageGates.ts

## Build Pipeline
${pipelineSummary}
${activeSection}`
}

async function buildProjectSystemPrompt(slug: string): Promise<string> {
  const project = await getProjectBySlug(slug).catch(() => null)
  if (!project) {
    return `You are the CB Control Center AI assistant. The project "${slug}" could not be loaded.`
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

  return `You are the AI advisor for the "${project.name}" build pipeline inside CB Control Center.

Business type: ${project.businessType ?? 'Not specified'}
Primary goal: ${project.primaryGoal ?? 'Not specified'}
Target customer: ${project.targetCustomer ?? 'Not specified'}
${charterSection}
## Build Pipeline
${pipelineSummary}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.projectSlug !== 'string' || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const { projectSlug, messages } = body as { projectSlug: string; messages: Message[] }

  const systemPrompt = isEngineBackedSlug(projectSlug)
    ? await buildDapSystemPrompt()
    : await buildProjectSystemPrompt(projectSlug)

  const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  })

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
    cancel() {
      stream.abort()
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
