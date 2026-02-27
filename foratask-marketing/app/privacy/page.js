export const metadata = {
  title: 'Privacy Policy - ForaTask',
  description: 'ForaTask privacy policy - how we collect, use, and protect your data.',
}

export default function Privacy() {
  return (
    <div className="pt-24 pb-16">
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: January 2026</p>

          <div className="space-y-8">
            {[
              { title: '1. Information We Collect', content: 'We collect information you provide directly to us, including:', list: ['Account information (name, email, password)', 'Company information (company name, address, GST/PAN numbers)', 'Task and project data you create', 'Payment information (processed securely via Razorpay)', 'Usage data and analytics'] },
              { title: '2. How We Use Your Information', content: 'We use the information we collect to:', list: ['Provide, maintain, and improve our services', 'Process transactions and send related information', 'Send technical notices and support messages', 'Respond to your comments and questions', 'Analyze usage patterns to improve user experience'] },
              { title: '3. Data Security', content: 'ForaTask uses a multi-tenant architecture with complete data isolation between companies. Your data is stored securely and is never accessible to other users or companies. We implement industry-standard security measures including encryption, secure access controls, and regular security audits.' },
              { title: '4. Data Retention', content: 'We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your data within 30 days, except where we are required to retain it by law.' },
              { title: '5. Third-Party Services', content: 'We use third-party services for:', list: ['Payment processing (Razorpay)', 'Push notifications (Expo)', 'Analytics and monitoring'] },
              { title: '6. Your Rights', content: 'You have the right to:', list: ['Access your personal data', 'Correct inaccurate data', 'Request deletion of your data', 'Export your data', 'Opt-out of marketing communications'] },
              { title: '7. Contact Us', content: 'If you have questions about this Privacy Policy, please contact us at: privacy@foratask.com, Bangalore, India' },
            ].map((s, i) => (
              <section key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-secondary mb-3">{s.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{s.content}</p>
                {s.list && (
                  <ul className="mt-3 space-y-1.5">
                    {s.list.map((item, j) => (
                      <li key={j} className="text-gray-500 text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
