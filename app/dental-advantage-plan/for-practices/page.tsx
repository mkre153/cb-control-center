import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Dental Practices | Join the DAP Directory',
  description:
    'Help uninsured patients find your in-house membership plan. DAP connects patients searching for affordable dental care to participating practices.',
}

const BENEFITS = [
  {
    title: 'Reach uninsured patients actively looking for care',
    desc: 'Millions of adults avoid dental care because of cost. DAP helps them find practices that offer predictable, membership-based pricing — like yours.',
  },
  {
    title: 'Promote your existing in-house membership plan',
    desc: 'If you already offer a membership plan, DAP helps more patients discover it. No need to change your plan terms or pricing.',
  },
  {
    title: 'Reduce dependence on insurance-driven acquisition',
    desc: 'Membership plans allow you to build direct relationships with patients — without waiting on insurance approvals, claims, or reimbursements.',
  },
  {
    title: 'Make plan pricing easier to explain',
    desc: 'Patients who find you through DAP already understand the membership concept. That means fewer objections and a more informed first conversation.',
  },
  {
    title: 'Create recurring patient relationships',
    desc: 'Annual membership plans encourage patients to return for covered preventive care, building long-term patient relationships.',
  },
]

const WHAT_DAP_DOES_NOT_DO = [
  'DAP does not collect patient payments on your behalf.',
  'DAP does not adjudicate claims or determine clinical eligibility.',
  'DAP does not set your membership pricing, plan terms, or included services.',
  'DAP does not guarantee patient volume or membership sign-ups.',
  'DAP does not provide care, make treatment recommendations, or access patient health records.',
]

export default function ForPracticesPage() {
  return (
    <div
      data-page-kind="for_practices"
      data-implies-payment="false"
      data-implies-insurance="false"
    >
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            For dental practices
          </p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Help patients find your in-house membership plan
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            Dental Advantage Plan is a patient discovery directory. We help uninsured patients find
            practices that offer direct membership plans — you set your own terms, fees, and
            inclusions.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Why practices participate</h2>
          <ul className="space-y-5">
            {BENEFITS.map(benefit => (
              <li key={benefit.title} className="flex gap-4 items-start">
                <span className="mt-1 w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">{benefit.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{benefit.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What DAP is not */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">What participation does not mean</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              DAP is a directory and discovery tool — not a billing layer, claims processor, or
              insurance network.
            </p>
          </div>
          <ul className="space-y-3">
            {WHAT_DAP_DOES_NOT_DO.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                  ✗
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works for practices */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">How practice participation works</h2>
          <ol className="space-y-5">
            {[
              {
                n: '1',
                title: 'Request a listing review',
                desc: 'Submit your practice details for review. Listing is subject to confirmation and approval before appearing publicly.',
              },
              {
                n: '2',
                title: 'Confirm your membership plan details',
                desc: 'We verify your participation and document your plan details — pricing, inclusions, and terms as defined by your practice.',
              },
              {
                n: '3',
                title: 'Appear in the DAP directory',
                desc: 'Once confirmed, patients searching for membership-plan dentists near you can find your practice in the DAP directory.',
              },
              {
                n: '4',
                title: 'Patients contact you directly',
                desc: 'Interested patients reach out to your office. DAP does not handle introductions, referral fees, or ongoing patient communication.',
              },
            ].map(step => (
              <li key={step.n} className="flex gap-4 items-start">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section
        id="enroll"
        className="bg-blue-50 border-t border-blue-100"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Ready to request a listing review?</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
            Practices interested in participating can begin the review process. All listings are
            confirmed before appearing publicly. Enrollment is subject to approval.
          </p>
          <div
            data-enrollment-placeholder
            className="bg-white border border-dashed border-blue-200 rounded-xl px-6 py-8 text-center space-y-3"
          >
            <p className="text-sm font-semibold text-gray-700">Practice enrollment</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Online enrollment is coming soon. To express interest in participating, contact us
              directly and we will walk you through the process.
            </p>
            <a
              href="mailto:practices@dentaladvantageplan.com"
              className="inline-block px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Request practice enrollment review
            </a>
          </div>
          <p className="text-xs text-gray-400">
            All practice listings are reviewed and confirmed before appearing publicly. DAP does not
            guarantee listing eligibility for any practice.
          </p>
        </div>
      </section>
    </div>
  )
}
