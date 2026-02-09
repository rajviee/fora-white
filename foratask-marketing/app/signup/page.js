'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function SignUp() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyEmail: '',
    companyContactNumber: ''
  })
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleCompanyChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value })
  }

  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...companyData,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Success - show step 3
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-400'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-dark-700'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Company Information</h1>
                  <p className="text-dark-400">Step 1 of 2</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={handleCompanyChange}
                    required
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      type="email"
                      name="companyEmail"
                      value={companyData.companyEmail}
                      onChange={handleCompanyChange}
                      required
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="companyContactNumber"
                      value={companyData.companyContactNumber}
                      onChange={handleCompanyChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-primary-500 hover:to-primary-400 transition-all"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Account</h1>
                  <p className="text-dark-400">Step 2 of 2</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleUserChange}
                      required
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleUserChange}
                      required
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleUserChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      type="password"
                      name="password"
                      value={userData.password}
                      onChange={handleUserChange}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Min 8 chars with uppercase, lowercase, number & special char</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={userData.confirmPassword}
                      onChange={handleUserChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:border-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-dark-700 rounded-xl font-medium flex items-center gap-2 hover:bg-dark-600 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-accent-500" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Account Created!</h1>
              <p className="text-dark-300 mb-8">
                Your company account has been created with a 90-day free trial. 
                Check your email for login instructions.
              </p>
              <a
                href={process.env.NEXT_PUBLIC_APP_URL || '/login'}
                className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-400 transition-all"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-dark-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-primary-400 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  )
}
