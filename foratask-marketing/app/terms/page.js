export const metadata = {
  title: 'Terms of Service - ForaTask',
  description: 'ForaTask terms of service - rules and guidelines for using our platform.',
}

export default function Terms() {
  return (
    <div className="pt-24 pb-16">
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: January 2026</p>

          <div className="space-y-8">
            {[
              { title: '1. Acceptance of Terms', content: 'By accessing or using ForaTask, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.' },
              { title: '2. Description of Service', content: 'ForaTask is a multi-tenant task management platform that enables teams to create, assign, and track tasks. The service includes web and mobile applications, notifications, analytics, and related features.' },
              { title: '3. User Accounts', list: ['You must provide accurate and complete information when creating an account', 'You are responsible for maintaining the security of your account credentials', 'You must notify us immediately of any unauthorized access', 'One company account per organization'] },
              { title: '4. Subscription and Payment', list: ['Free trial period: 90 days with full features', 'Base plan: ₹249/month for up to 5 users', 'Additional users: ₹50/user/month', 'Billing is monthly on your subscription anniversary date', 'All payments are processed securely through Razorpay'] },
              { title: '5. Cancellation', content: 'You may cancel your subscription at any time from your account settings. Upon cancellation, you will retain access until the end of your current billing period. We do not provide refunds for partial billing periods.' },
              { title: '6. Acceptable Use', content: 'You agree not to:', list: ['Violate any applicable laws or regulations', 'Infringe on intellectual property rights', 'Upload malicious code or content', 'Attempt to access other users\' data', 'Use the service for illegal activities', 'Resell or redistribute the service'] },
              { title: '7. Data Ownership', content: 'You retain ownership of all data you upload to ForaTask. We do not claim any ownership rights over your content. You grant us a limited license to process and store your data solely to provide our services.' },
              { title: '8. Service Availability', content: 'We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance with reasonable notice. We are not liable for any damages resulting from service interruptions.' },
              { title: '9. Limitation of Liability', content: 'ForaTask is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.' },
              { title: '10. Changes to Terms', content: 'We may update these terms from time to time. We will notify you of significant changes via email or in-app notification. Continued use of the service constitutes acceptance of updated terms.' },
              { title: '11. Contact', content: 'For questions about these Terms of Service, contact us at: legal@foratask.com' },
            ].map((s, i) => (
              <section key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-secondary mb-3">{s.title}</h2>
                {s.content && <p className="text-gray-500 text-sm leading-relaxed">{s.content}</p>}
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
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
