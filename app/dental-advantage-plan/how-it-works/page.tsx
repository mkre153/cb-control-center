import type { Metadata } from 'next'
import {
  getDefaultHowItWorksModel,
  getDefaultComparisonModel,
  getDefaultFaqModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

export const metadata: Metadata = {
  title: 'How Dental Advantage Plan Works | No-Insurance Dental Membership',
  description:
    'Understand how a dental membership plan works — no claims, no deductibles, no insurance company between you and your dentist.',
}

export default function HowItWorksPage() {
  return (
    <main
      className="space-y-8"
      data-page-kind="how_it_works"
      data-implies-insurance="false"
      data-implies-guaranteed-savings="false"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          How Dental Advantage Plan Works
        </h1>
        <p className="text-gray-600 leading-relaxed">
          A dental membership plan is a direct agreement between you and a participating dentist — no insurance company, no claims, no deductibles.
        </p>
      </div>
      <DapHowItWorksSection model={getDefaultHowItWorksModel()} />
      <hr className="border-gray-100" />
      <DapComparisonSection model={getDefaultComparisonModel()} />
      <hr className="border-gray-100" />
      <DapFaqSection model={getDefaultFaqModel('homepage')} />
    </main>
  )
}
