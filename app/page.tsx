import { CbccProjectRegistry } from '@/components/cb-control-center/v2/CbccProjectRegistry'
import { listProjects } from '@/lib/cb-control-center/cbccProjectRepository'

export default async function CBControlCenterHomePage() {
  const projects = await listProjects().catch(() => [])
  return <CbccProjectRegistry projects={projects} />
}
