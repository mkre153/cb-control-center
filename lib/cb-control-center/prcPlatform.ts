import { getPrcSupabaseClient } from './prcSupabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// Data layer for the Channel Intelligence Platform (PRC tables). Read views +
// the one control action (activate a gated recipe draft). All functions are
// server-only; they read/write the PremiumRoast Supabase project via the
// service-role client. The platform itself (study → classify → enqueue →
// worker → draft) lives in the premiumroast.coffee repo; this is the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformChannel = {
  id: number
  handle: string
  name: string | null
  topic: string | null
  status: string | null
  last_studied_at: string | null
  notes: string | null
}

export type ChannelSummary = PlatformChannel & {
  videoCount: number
  pickedCount: number
  studyCount: number
}

export type ChannelStudy = {
  id: number
  channel_id: number
  studied_at: string | null
  video_count: number | null
  newly_classified: number | null
  counts: Record<string, number> | null
  model: string | null
  classifier_version: string | null
}

export type ChannelVideo = {
  id: number
  channel_id: number
  video_id: string
  title: string | null
  category: string | null
  name: string | null
  picked: boolean | null
}

export type PlatformJob = {
  id: number
  type: string
  channel_id: number | null
  status: string
  error: string | null
  created_at: string | null
  claimed_at: string | null
  finished_at: string | null
  channelHandle: string | null
}

export type RecipeDraft = {
  slug: string
  title: string | null
  drink_category: string | null
  published_at: string | null
  videoCount: number
}

export type ChannelDossier = {
  channel: PlatformChannel
  studies: ChannelStudy[]
  categoryBreakdown: { category: string; count: number; picked: number }[]
  pickedSample: ChannelVideo[]
  jobs: PlatformJob[]
  videoCount: number
  pickedCount: number
}

// Categories whose picked videos feed the recipe generator (coffee supply).
const SUPPLY_CATEGORIES = new Set(['recipe', 'brew'])

export function isSupplyCategory(category: string | null): boolean {
  return category != null && SUPPLY_CATEGORIES.has(category)
}

/** All registered channels, each with video/picked/study counts. */
export async function listChannels(): Promise<ChannelSummary[]> {
  const sb = getPrcSupabaseClient()
  const [channelsRes, videosRes, studiesRes] = await Promise.all([
    sb
      .from('content_channels')
      .select('id, handle, name, topic, status, last_studied_at, notes')
      .order('id', { ascending: true }),
    sb.from('channel_videos').select('channel_id, picked'),
    sb.from('channel_studies').select('channel_id'),
  ])

  const channels = (channelsRes.data ?? []) as PlatformChannel[]
  const videoCounts = new Map<number, { total: number; picked: number }>()
  for (const v of videosRes.data ?? []) {
    const entry = videoCounts.get(v.channel_id) ?? { total: 0, picked: 0 }
    entry.total += 1
    if (v.picked) entry.picked += 1
    videoCounts.set(v.channel_id, entry)
  }
  const studyCounts = new Map<number, number>()
  for (const s of studiesRes.data ?? []) {
    studyCounts.set(s.channel_id, (studyCounts.get(s.channel_id) ?? 0) + 1)
  }

  return channels.map((c) => {
    const vc = videoCounts.get(c.id) ?? { total: 0, picked: 0 }
    return {
      ...c,
      videoCount: vc.total,
      pickedCount: vc.picked,
      studyCount: studyCounts.get(c.id) ?? 0,
    }
  })
}

/** Full dossier for one channel: studies, live category breakdown, picked sample, jobs. */
export async function getChannelDossier(channelId: number): Promise<ChannelDossier | null> {
  const sb = getPrcSupabaseClient()
  const channelRes = await sb
    .from('content_channels')
    .select('id, handle, name, topic, status, last_studied_at, notes')
    .eq('id', channelId)
    .maybeSingle()

  const channel = channelRes.data as PlatformChannel | null
  if (!channel) return null

  const [studiesRes, videosRes, jobsRes] = await Promise.all([
    sb
      .from('channel_studies')
      .select('id, channel_id, studied_at, video_count, newly_classified, counts, model, classifier_version')
      .eq('channel_id', channelId)
      .order('studied_at', { ascending: false }),
    sb
      .from('channel_videos')
      .select('id, channel_id, video_id, title, category, name, picked')
      .eq('channel_id', channelId),
    sb
      .from('content_jobs')
      .select('id, type, channel_id, status, error, created_at, claimed_at, finished_at')
      .eq('channel_id', channelId)
      .order('id', { ascending: false })
      .limit(20),
  ])

  const videos = (videosRes.data ?? []) as ChannelVideo[]

  // Live category breakdown (computed from channel_videos so it's always accurate,
  // independent of the per-run counts snapshot stored on channel_studies).
  const breakdownMap = new Map<string, { count: number; picked: number }>()
  for (const v of videos) {
    const cat = v.category ?? 'unclassified'
    const entry = breakdownMap.get(cat) ?? { count: 0, picked: 0 }
    entry.count += 1
    if (v.picked) entry.picked += 1
    breakdownMap.set(cat, entry)
  }
  const categoryBreakdown = [...breakdownMap.entries()]
    .map(([category, { count, picked }]) => ({ category, count, picked }))
    .sort((a, b) => b.count - a.count)

  const pickedSample = videos.filter((v) => v.picked).slice(0, 30)
  const pickedCount = videos.filter((v) => v.picked).length

  const jobs: PlatformJob[] = (jobsRes.data ?? []).map((j) => ({
    ...j,
    channelHandle: channel.handle,
  })) as PlatformJob[]

  return {
    channel,
    studies: (studiesRes.data ?? []) as ChannelStudy[],
    categoryBreakdown,
    pickedSample,
    jobs,
    videoCount: videos.length,
    pickedCount,
  }
}

/** Recent jobs across all channels, with channel handles resolved. */
export async function listJobs(limit = 25): Promise<PlatformJob[]> {
  const sb = getPrcSupabaseClient()
  const [jobsRes, channelsRes] = await Promise.all([
    sb
      .from('content_jobs')
      .select('id, type, channel_id, status, error, created_at, claimed_at, finished_at')
      .order('id', { ascending: false })
      .limit(limit),
    sb.from('content_channels').select('id, handle'),
  ])
  const handleById = new Map<number, string>()
  for (const c of channelsRes.data ?? []) handleById.set(c.id, c.handle)
  return (jobsRes.data ?? []).map((j) => ({
    ...j,
    channelHandle: j.channel_id != null ? handleById.get(j.channel_id) ?? null : null,
  })) as PlatformJob[]
}

/** Recipe drafts awaiting review (active = false). The human-in-the-loop gate. */
export async function listRecipeDrafts(): Promise<RecipeDraft[]> {
  const sb = getPrcSupabaseClient()
  const { data } = await sb
    .from('recipes')
    .select('slug, title, drink_category, published_at, videos')
    .eq('active', false)
    .order('slug', { ascending: true })
  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title ?? null,
    drink_category: r.drink_category ?? null,
    published_at: r.published_at ?? null,
    videoCount: Array.isArray(r.videos) ? r.videos.length : 0,
  }))
}

/** Count of live (active) recipes. */
export async function getLiveRecipeCount(): Promise<number> {
  const sb = getPrcSupabaseClient()
  const { count } = await sb
    .from('recipes')
    .select('slug', { count: 'exact', head: true })
    .eq('active', true)
  return count ?? 0
}

/**
 * Activate a gated recipe draft → flips active=true + stamps published_at=now().
 * Live on premiumroast.coffee via ISR (no deploy). Only acts on a draft
 * (active=false) so it can't accidentally re-publish or clobber an active row.
 * Returns the number of rows changed (0 = no matching draft).
 */
export async function activateRecipe(slug: string): Promise<number> {
  const sb = getPrcSupabaseClient()
  const { data, error } = await sb
    .from('recipes')
    .update({ active: true, published_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('active', false)
    .select('slug')
  if (error) throw new Error(error.message)
  return data?.length ?? 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent registry + run health (prc_agents + agent_runs). The roster that answers
// "how many agents, what does each fulfill, is each healthy/scheduled". Degrades
// gracefully (returns [] ) until the agent-registry migration is applied.
// ─────────────────────────────────────────────────────────────────────────────

export type AgentRunStatus = 'ok' | 'error' | 'running' | 'never'

export type PrcAgent = {
  id: string
  name: string
  kind: string
  domain: string
  writesTable: string
  script: string
  llm: boolean
  runsOn: string
  trigger: string
  cadence: string
  gated: boolean
  notes: string | null
  // derived from latest agent_runs row
  lastRunAt: string | null
  lastStatus: AgentRunStatus
  lastItems: number | null
}

export type AgentRun = {
  id: number
  agentId: string
  startedAt: string | null
  finishedAt: string | null
  status: string
  items: number
  trigger: string | null
  error: string | null
}

/** All registered agents (from prc_agents) joined with their latest run. */
export async function listPrcAgents(): Promise<PrcAgent[]> {
  const sb = getPrcSupabaseClient()
  const [agentsRes, runsRes] = await Promise.all([
    sb.from('prc_agents').select('*').order('domain', { ascending: true }),
    sb.from('agent_runs').select('agent_id, started_at, status, items').order('started_at', { ascending: false }),
  ])
  if (agentsRes.error) return []
  const latest = new Map<string, { started_at: string; status: string; items: number }>()
  for (const r of runsRes.data ?? []) {
    if (!latest.has(r.agent_id)) latest.set(r.agent_id, r)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (agentsRes.data ?? []).map((a: any) => {
    const run = latest.get(a.id)
    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      domain: a.domain,
      writesTable: a.writes_table,
      script: a.script,
      llm: a.llm,
      runsOn: a.runs_on,
      trigger: a.trigger,
      cadence: a.cadence,
      gated: a.gated,
      notes: a.notes ?? null,
      lastRunAt: run?.started_at ?? null,
      lastStatus: (run ? (run.status as AgentRunStatus) : 'never'),
      lastItems: run?.items ?? null,
    }
  })
}

/** Recent runs for one agent (detail page). */
export async function getAgentRuns(agentId: string, limit = 25): Promise<AgentRun[]> {
  const sb = getPrcSupabaseClient()
  const { data } = await sb
    .from('agent_runs')
    .select('id, agent_id, started_at, finished_at, status, items, trigger, error')
    .eq('agent_id', agentId)
    .order('started_at', { ascending: false })
    .limit(limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    agentId: r.agent_id,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    status: r.status,
    items: r.items ?? 0,
    trigger: r.trigger,
    error: r.error,
  }))
}

export type DomainHealth = {
  domain: string
  live: number
  drafts: number
  note: string
}

/** Per-domain content freshness — recipes / learn_guides / featured / best_of / channels. */
export async function getDomainHealth(): Promise<DomainHealth[]> {
  const sb = getPrcSupabaseClient()
  const head = { count: 'exact' as const, head: true }
  const safe = async (p: PromiseLike<{ count: number | null }>): Promise<number> => {
    try {
      const { count } = await p
      return count ?? 0
    } catch {
      return 0
    }
  }
  const [recipesLive, recipesDraft, guidesLive, guidesDraft, featuredLive, bestOf, studies] = await Promise.all([
    safe(sb.from('recipes').select('slug', head).eq('active', true)),
    safe(sb.from('recipes').select('slug', head).eq('active', false)),
    safe(sb.from('learn_guides').select('slug', head).eq('active', true)),
    safe(sb.from('learn_guides').select('slug', head).eq('active', false)),
    safe(sb.from('featured_items').select('id', head).eq('active', true)),
    safe(sb.from('best_of_lists').select('id', head).not('published_at', 'is', null)),
    safe(sb.from('channel_studies').select('id', head)),
  ])
  return [
    { domain: 'recipes', live: recipesLive, drafts: recipesDraft, note: '/recipes' },
    { domain: 'learn_guides', live: guidesLive, drafts: guidesDraft, note: '/learn study guides' },
    { domain: 'featured', live: featuredLive, drafts: 0, note: 'homepage rotation (active items)' },
    { domain: 'best_of', live: bestOf, drafts: 0, note: '/best published lists' },
    { domain: 'channels', live: studies, drafts: 0, note: 'channel study runs' },
  ]
}
