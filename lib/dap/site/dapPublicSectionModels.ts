import type {
  DapPublicPageKind,
  DapHowItWorksSectionModel,
  DapFaqSectionModel,
  DapComparisonSectionModel,
  DapSavingsEducationModel,
} from './dapPublicUxTypes'

export function getDefaultHowItWorksModel(): DapHowItWorksSectionModel {
  return {
    steps: [
      {
        step: 1,
        title: 'Search for a DAP dentist',
        description:
          'Find practices near you that are confirmed to offer Dental Advantage Plan. Search by city, ZIP, or dentist name.',
      },
      {
        step: 2,
        title: 'Check participation status',
        description:
          "Each listing shows whether a practice is confirmed, has been requested by patients, or is not yet participating. Availability varies by location.",
      },
      {
        step: 3,
        title: 'Enroll at the practice',
        description:
          'Once you find a confirmed DAP dentist, enroll directly with them. No insurance application. No waiting period for eligible treatments.',
      },
      {
        step: 4,
        title: 'Use your membership',
        description:
          'Present your membership at any confirmed DAP practice when you come in for treatment. Discounts apply to eligible services at that location.',
      },
    ],
  }
}

const SHARED_FAQ_ITEMS = [
  {
    question: 'What is Dental Advantage Plan?',
    answer:
      'Dental Advantage Plan is a membership program — not dental insurance. You pay an annual fee and receive discounts on eligible dental treatments at confirmed participating practices. There are no claims to file, no deductibles, and no annual benefit maximums. Discounts vary by practice and treatment.',
  },
  {
    question: 'Is DAP available everywhere?',
    answer:
      'No. DAP is available only at practices that have agreed to participate. Each listing shows the current participation status. If your preferred dentist is not yet confirmed, you can submit a request — with your consent, we will contact them about offering DAP.',
  },
  {
    question: 'How do I know a dentist is confirmed?',
    answer:
      'Confirmed practices display a DAP confirmed badge. We contact each practice directly to verify participation before marking them confirmed. Practices without this badge have not confirmed participation.',
  },
] as const

export function getDefaultFaqModel(pageKind: DapPublicPageKind): DapFaqSectionModel {
  if (pageKind === 'dentist_page') {
    return {
      items: [
        ...SHARED_FAQ_ITEMS,
        {
          question: "Can I request DAP at a dentist that isn't confirmed?",
          answer:
            "Yes. Use the request option on any unconfirmed listing. With your consent, we will contact the practice about offering DAP and let you know if their status changes. Requesting does not guarantee the practice will participate.",
        },
      ],
    }
  }

  if (pageKind === 'city_page') {
    return {
      items: [
        ...SHARED_FAQ_ITEMS,
        {
          question: 'What if no dentists in my city are confirmed?',
          answer:
            "You can request DAP availability for your area. With your permission, we will contact local dentists to gauge interest. We will notify you if a practice near you confirms participation. Submitting a request does not guarantee availability.",
        },
      ],
    }
  }

  return { items: [...SHARED_FAQ_ITEMS] }
}

export function getDefaultComparisonModel(): DapComparisonSectionModel {
  return {
    headline: 'How Dental Advantage Plan compares to traditional dental insurance',
    columns: [
      {
        label: 'Dental Advantage Plan',
        points: [
          'Simple annual fee — no monthly premium',
          'Discounts at confirmed participating dentists',
          'No claims to file',
          'No annual benefit cap',
          'No waiting periods for eligible treatments',
        ],
      },
      {
        label: 'Traditional Dental Insurance',
        points: [
          'Monthly premiums due whether you use it or not',
          'Annual deductibles before benefits apply',
          'Claims process for covered procedures',
          'Annual benefit maximums',
          'Waiting periods on many major treatments',
        ],
      },
    ],
  }
}

export function getDefaultSavingsEducationModel(): DapSavingsEducationModel {
  return {
    headline: 'How dental savings memberships work',
    body:
      'Dental Advantage Plan is a membership program — not insurance. You pay an annual fee and receive discounts on eligible dental treatments at confirmed participating practices. There are no claims to file and no annual benefit caps. Actual savings vary by treatment type and by dentist. Any pricing examples shown are illustrative — actual discounts must be confirmed with the participating practice.',
    impliesGuaranteedPricing: false,
  }
}
