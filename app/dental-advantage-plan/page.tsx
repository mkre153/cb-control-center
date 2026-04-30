import type { Metadata } from 'next'
import { getHomepageHeroModel } from '@/lib/cb-control-center/dapPublicUxRules'
import {
  getDefaultHowItWorksModel,
  getDefaultComparisonModel,
  getDefaultFaqModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'
import { DapHomepageHeroPreview } from '@/components/cb-control-center/dap-public/DapHomepageHeroPreview'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

export const metadata: Metadata = {
  title: 'Dental Advantage Plan | No-Insurance Dental Membership',
  description:
    'Dental Advantage Plan is a membership — not insurance. Find participating dentists or request DAP near you. No claims, no deductibles.',
}

export default function DapHomepage() {
  const baseHero = getHomepageHeroModel()

  // CTA hrefs overridden to existing informational guides — search and request routes not yet live.
  const hero = {
    ...baseHero,
    primaryCta: {
      ...baseHero.primaryCta,
      label: 'How to find a DAP dentist',
      href: '/guides/how-to-find-dentist-who-offers-dap',
    },
    secondaryCta: {
      ...baseHero.secondaryCta,
      label: 'Is DAP worth it for me?',
      href: '/guides/dental-membership-plan-worth-it',
    },
  }

  return (
    <main
      className="space-y-10"
      data-page-kind="homepage"
      data-implies-universal-availability="false"
    >
      <DapHomepageHeroPreview model={hero} showPreviewLabel={false} />
      <hr className="border-gray-100" />
      <DapHowItWorksSection model={getDefaultHowItWorksModel()} />
      <hr className="border-gray-100" />
      <DapComparisonSection model={getDefaultComparisonModel()} />
      <hr className="border-gray-100" />
      <DapFaqSection model={getDefaultFaqModel('homepage')} />
    </main>
  )
}
