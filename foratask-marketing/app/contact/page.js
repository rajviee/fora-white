'use client'
import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // In production, this would send to an API
    setSubmitted(true)
  }

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in{' '}
            <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
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
              <h2 className="text-2xl font-bold mb-6">Contact Info</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-dark-300">hello@foratask.com</p>
                    <p className="text-dark-300">support@foratask.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-dark-300">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Office</h3>
                    <p className="text-dark-300">Bangalore, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="glass rounded-2xl p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-accent-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-dark-300">We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject *</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                        placeholder="How can we help?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message *</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 resize-none"
                        placeholder="Your message..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-primary-500 hover:to-primary-400 transition-all"
                    >
                      <Send className="w-5 h-5" /> Send Message
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
