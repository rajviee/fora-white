export const metadata = {
  title: 'Refund Policy - ForaTask',
  description: 'ForaTask refund policy - understanding our no partial month refund policy.',
}

export default function Refund() {
  return (
    <div className="pt-24 pb-16">
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary mb-2">Refund Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: January 2026</p>

          <div className="space-y-8">
            {/* Important Notice */}
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <h2 className="text-base font-semibold text-amber-800 mb-1">Important Notice</h2>
              <p className="text-amber-700 text-sm">
                ForaTask does not provide refunds for partial billing periods. Please read this policy carefully before subscribing.
              </p>
            </div>

            {[
              { title: '1. No Partial Month Refunds', content: 'Subscriptions are billed for the full billing cycle, regardless of the signup date or cancellation date. We do not prorate or refund for partial months.\n\nExample: If you pay on February 29 and cancel on March 2, no refund will be issued. You will have access until your next billing date.' },
              { title: '2. Billing Date Anchoring', content: 'Your billing date is anchored to the original purchase date:', list: ['If you subscribe on January 31, your next billing will be February 28 (or 29 in a leap year)', 'If you subscribe on the 15th, you will be billed on the 15th of each month', 'We adjust for months with fewer days automatically'] },
              { title: '3. Free Trial Period', content: 'We offer a generous 90-day free trial with full access to all features. This allows you to thoroughly evaluate ForaTask before committing to a paid subscription. No credit card is required during the trial.' },
              { title: '4. Cancellation', content: 'You can cancel your subscription at any time:', list: ['Go to Settings > Subscription > Cancel Subscription', 'Your access continues until the end of the current billing period', 'No additional charges will be made after cancellation', 'Your data will be preserved for 30 days after expiration'] },
              { title: '5. Exceptional Circumstances', content: 'Refunds may be considered in exceptional circumstances:', list: ['Duplicate charges due to technical errors', 'Extended service outages (>24 hours)', 'Billing errors on our part'], extra: 'To request a review, contact support@foratask.com within 7 days of the charge.' },
              { title: '6. Company Deletion', content: 'When a company account is deleted, all active subscriptions are automatically cancelled. No refund is provided for the remaining billing period.' },
              { title: '7. Contact Us', content: 'If you have questions about our refund policy or believe you qualify for an exception:\n\nEmail: support@foratask.com\nResponse time: Within 24 business hours' },
            ].map((s, i) => (
              <section key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-secondary mb-3">{s.title}</h2>
                {s.content && <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">{s.content}</p>}
                {s.list && (
                  <ul className="mt-2 space-y-1.5">
                    {s.list.map((item, j) => (
                      <li key={j} className="text-gray-500 text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {s.extra && <p className="text-gray-500 text-sm mt-3">{s.extra}</p>}
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
