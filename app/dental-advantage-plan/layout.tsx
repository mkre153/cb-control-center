import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: 'index, follow',
}

export default function DapHomepageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {children}
      </div>
    </div>
  )
}
