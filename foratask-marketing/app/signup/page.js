'use client'
import { useState } from 'react'
import { Building2, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [companyData, setCompanyData] = useState({ companyName: '', companyEmail: '', companyContactNumber: '' })
  const [userData, setUserData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })

  const handleCompanyChange = (e) => setCompanyData({ ...companyData, [e.target.name]: e.target.value })
  const handleUserChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (userData.password !== userData.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...companyData, firstName: userData.firstName, lastName: userData.lastName, email: userData.email, password: userData.password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Registration failed')
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
  const inputIconCls = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-10 h-0.5 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-secondary">Company Information</h1>
                  <p className="text-gray-400 text-xs">Step 1 of 2</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
                  <input type="text" name="companyName" value={companyData.companyName} onChange={handleCompanyChange} required className={inputCls} placeholder="Acme Inc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="email" name="companyEmail" value={companyData.companyEmail} onChange={handleCompanyChange} required className={inputIconCls} placeholder="contact@company.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="tel" name="companyContactNumber" value={companyData.companyContactNumber} onChange={handleCompanyChange} required className={inputIconCls} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-secondary">Admin Account</h1>
                  <p className="text-gray-400 text-xs">Step 2 of 2</p>
                </div>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                    <input type="text" name="firstName" value={userData.firstName} onChange={handleUserChange} required className={inputCls} placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                    <input type="text" name="lastName" value={userData.lastName} onChange={handleUserChange} required className={inputCls} placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="email" name="email" value={userData.email} onChange={handleUserChange} required className={inputIconCls} placeholder="john@company.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="password" name="password" value={userData.password} onChange={handleUserChange} required minLength={8} className={inputIconCls} placeholder="Min 8 characters" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Min 8 chars with uppercase, lowercase, number & special char</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="password" name="confirmPassword" value={userData.confirmPassword} onChange={handleUserChange} required className={inputIconCls} placeholder="Re-enter password" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-200 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all disabled:opacity-50">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-xl font-bold text-secondary mb-3">Account Created!</h1>
              <p className="text-gray-500 text-sm mb-8">
                Your company account has been created with a 90-day free trial. Check your email for login instructions.
              </p>
              <a href={process.env.NEXT_PUBLIC_APP_URL || '/login'} className="inline-block px-8 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-all">
                Go to Login
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">Log in</a>
        </p>
      </div>
    </div>
  )
}
