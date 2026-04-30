import { notFound } from 'next/navigation'
import { DentistDetailFromCms } from '@/components/dap-preview/DentistDetailFromCms'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'

export async function generateStaticParams() {
  const { dentistPages } = exportDapCmsSnapshot()
  return dentistPages.map(d => ({ slug: d.slug }))
}

type Params = Promise<{ slug: string }>

export default async function DentistDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const { dentistPages } = exportDapCmsSnapshot()

  const record = dentistPages.find(d => d.slug === slug)
  if (!record) notFound()

  return <DentistDetailFromCms record={record} />
}
