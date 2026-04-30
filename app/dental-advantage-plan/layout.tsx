import type { Metadata } from 'next'
import { DapSiteNav } from '@/components/dap/DapSiteNav'
import { DapSiteFooter } from '@/components/dap/DapSiteFooter'

export const metadata: Metadata = {
  robots: 'index, follow',
}

export default function DapPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DapSiteNav />
      <main className="flex-1">{children}</main>
      <DapSiteFooter />
    </div>
  )
}
