import type { Metadata } from 'next'
import {
  getDefaultSavingsEducationModel,
  getDefaultFaqModel,
} from '@/lib/dap/site/dapPublicSectionModels'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

export const metadata: Metadata = {
  title: 'What Can a Dental Membership Plan Help With? | DAP',
  description:
    'Learn what common dental needs a membership plan may help with — preventive care, fillings, and more. Actual benefits vary by participating practice.',
}

export default function SavingsPage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="savings"
      data-implies-guaranteed-savings="false"
      data-implies-insurance="false"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          What Can a Dental Membership Plan Help With?
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Membership plans at participating practices typically cover preventive care and may offer reduced fees for common procedures. Plan details vary by practice and are not guaranteed.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        These are illustrative examples only. Actual plan inclusions, fees, and any reduced rates are set by each participating practice and may differ. DAP does not guarantee specific savings.
      </div>

      <DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />
      <hr className="border-gray-100" />
      <DapFaqSection model={getDefaultFaqModel('homepage')} />
    </main>
  )
}
