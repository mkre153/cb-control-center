import { CbccProjectRegistry } from '@/components/cb-control-center/v2/CbccProjectRegistry'
import { listProjects } from '@/lib/cb-control-center/cbccProjectRepository'
import { mergeProjectsWithEngineBacked } from '@/lib/cb-control-center/cbccEngineRegistry'

export default async function CBControlCenterHomePage() {
  const supabaseProjects = await listProjects().catch(() => [])
  const projects = mergeProjectsWithEngineBacked(supabaseProjects)
  return <CbccProjectRegistry projects={projects} />
}
