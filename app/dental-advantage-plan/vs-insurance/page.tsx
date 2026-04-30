import type { Metadata } from 'next'
import {
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
  getDefaultFaqModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

export const metadata: Metadata = {
  title: 'DAP vs. Dental Insurance — What Is the Difference?',
  description:
    'Dental Advantage Plan is not insurance. Learn how a direct dental membership plan differs from traditional dental insurance.',
}

export default function VsInsurancePage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="comparison"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          DAP vs. Dental Insurance: What Is the Difference?
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Dental Advantage Plan is not insurance. It is a direct membership between patients and participating dental practices — no claims, no deductibles, no waiting periods.
        </p>
      </div>
      <DapComparisonSection model={getDefaultComparisonModel()} />
      <hr className="border-gray-100" />
      <DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />
      <hr className="border-gray-100" />
      <DapFaqSection model={getDefaultFaqModel('homepage')} />
    </main>
  )
}
