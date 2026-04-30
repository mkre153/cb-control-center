import { PreviewBanner } from '@/components/dap-preview/PreviewBanner'

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PreviewBanner />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {children}
      </div>
    </div>
  )
}
