'use client'
import { useState } from 'react'
import { CheckCircle, Send } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary">
            Get in{' '}<span className="gradient-text">Touch</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-500 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-secondary mb-6">Contact Info</h2>
              <div className="space-y-6">
                {[
                  { icon: 'fa-solid fa-envelope', title: 'Email', lines: ['hello@foratask.com', 'support@foratask.com'] },
                  { icon: 'fa-solid fa-phone', title: 'Phone', lines: ['+91 98765 43210'] },
                  { icon: 'fa-solid fa-location-dot', title: 'Office', lines: ['Bangalore, India'] },
                ].map((info, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                      <i className={`${info.icon} text-primary text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary text-sm mb-1">{info.title}</h3>
                      {info.lines.map((l, j) => <p key={j} className="text-gray-500 text-sm">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary mb-2">Message Sent!</h3>
                    <p className="text-gray-500 text-sm">We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="john@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                      <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="How can we help?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required rows={5}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Your message..." />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
