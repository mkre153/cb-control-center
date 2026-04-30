import { notFound } from 'next/navigation'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { TreatmentPageView } from '@/components/dap-preview/TreatmentPageView'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const { treatmentPages } = exportDapCmsSnapshot()
  return treatmentPages.map(t => ({ slug: t.slug }))
}

export default async function TreatmentPage({ params }: { params: Params }) {
  const { slug } = await params
  const { treatmentPages } = exportDapCmsSnapshot()
  const record = treatmentPages.find(t => t.slug === slug)
  if (!record) notFound()

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <TreatmentPageView record={record} />
    </main>
  )
}
