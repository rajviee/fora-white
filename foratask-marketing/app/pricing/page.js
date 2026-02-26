'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Minus } from 'lucide-react'

export default function Pricing() {
  const [userCount, setUserCount] = useState(5)
  
  const basePrice = 249
  const perUserPrice = 50
  const baseUsers = 5
  
  const calculatePrice = () => {
    if (userCount <= baseUsers) return basePrice
    return basePrice + ((userCount - baseUsers) * perUserPrice)
  }

  const included = [
    'Unlimited Tasks & Recurring Tasks',
    'Task Assignment, Observers & Viewer Approval',
    'Multi-location & Remote Tasks',
    'Team Chat with File Sharing',
    'Attendance with GPS Geofencing',
    'Analytics & Performance Dashboard',
    'Salary & Leave Management',
    'Real-time Push Notifications',
    'Mobile Apps (iOS & Android)',
    'Email Support',
    '99.9% Uptime SLA'
  ]

  const comingSoon = [
    'White-label Branding',
    'Custom Integrations',
    'Dedicated Account Manager'
  ]

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary">
            Simple, Transparent{' '}
            <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-500 max-w-3xl mx-auto">
            Start with a 90-day free trial. No credit card required. Pay only for the users you need.
          </p>
        </div>
      </section>

      {/* Pricing Calculator */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Calculator */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <i className="fa-solid fa-calculator text-primary"></i>
                <h2 className="text-lg font-semibold text-secondary">Price Calculator</h2>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-500 text-sm mb-2">Team Size</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={userCount}
                    onChange={(e) => setUserCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="w-16 text-center text-2xl font-bold text-secondary">{userCount}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">users</p>
              </div>

              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-gray-100">
                <p className="text-gray-500 text-sm mb-2">Monthly Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-secondary">&#8377;{calculatePrice()}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {userCount <= baseUsers 
                    ? `Base plan includes ${baseUsers} users`
                    : `₹${basePrice} base + ₹${(userCount - baseUsers) * perUserPrice} (${userCount - baseUsers} extra users)`
                  }
                </p>
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs px-4 py-1.5 rounded-bl-xl font-medium">
                90 Days Free
              </div>
              
              <h2 className="text-xl font-bold text-secondary mb-2">Team Plan</h2>
              <p className="text-gray-500 text-sm mb-6">
                Everything you need to manage your team effectively.
              </p>
              
              <div className="space-y-2.5 mb-6">
                {included.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-3 font-medium">Coming Soon:</p>
              <div className="space-y-2 mb-6">
                {comingSoon.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400">
                    <Minus className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/signup"
                className="block w-full py-3.5 text-center bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Info */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-secondary mb-8 text-center">Billing Information</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <h3 className="font-semibold text-secondary text-sm mb-2">Free Trial</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Start with a full-featured 90-day free trial. No credit card required to get started.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <h3 className="font-semibold text-secondary text-sm mb-2">Monthly Billing</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Subscriptions are billed monthly on the anniversary of your signup date.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <h3 className="font-semibold text-secondary text-sm mb-2">No Refunds</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                We do not offer refunds for partial months. Cancel anytime before your next billing date.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-secondary mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: 'What happens after the free trial?', a: 'After 90 days, you\'ll need to subscribe to continue using ForaTask. Your data will be preserved, and admins will have read-only access until you subscribe.' },
              { q: 'Can I add more users later?', a: 'Yes! You can add users anytime. The additional cost (₹50/user/month) will be reflected in your next billing cycle.' },
              { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from your account settings. Your access continues until the end of your current billing period.' },
              { q: 'Is my data secure?', a: 'Absolutely. ForaTask uses enterprise-grade security with complete data isolation between companies. Your data is never shared or accessible to other users.' },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl bg-white border border-gray-100">
                <h3 className="font-semibold text-secondary text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
