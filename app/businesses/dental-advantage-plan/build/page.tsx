import { SimulationShell } from '@/components/cb-control-center/SimulationShell'

export default function DapBuildPipelinePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-6">
        <nav
          data-breadcrumb
          className="flex items-center gap-2 text-sm text-gray-500"
          aria-label="Breadcrumb"
        >
          <a href="/" className="hover:text-gray-800 transition-colors">
            CB Control Center
          </a>
          <span className="text-gray-300" aria-hidden="true">/</span>
          <a
            href="/businesses/dental-advantage-plan"
            className="hover:text-gray-800 transition-colors"
          >
            Dental Advantage Plan
          </a>
          <span className="text-gray-300" aria-hidden="true">/</span>
          <span className="text-gray-800 font-medium" aria-current="page">
            Build Pipeline
          </span>
        </nav>
        <SimulationShell />
      </div>
    </div>
  )
}
