import { notFound } from 'next/navigation'
import { DecisionPageView } from '@/components/dap-preview/DecisionPageView'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'

export async function generateStaticParams() {
  const { decisionPages } = exportDapCmsSnapshot()
  return decisionPages.map(d => ({ slug: d.slug }))
}

type Params = Promise<{ slug: string }>

export default async function DecisionPage({ params }: { params: Params }) {
  const { slug } = await params
  const { decisionPages } = exportDapCmsSnapshot()

  const record = decisionPages.find(d => d.slug === slug)
  if (!record) notFound()

  return <DecisionPageView record={record} />
}
