import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../context/AuthContext'
import { ArrowLeft, Building2, Users, Calendar, CreditCard, Lock, Unlock, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function CompanyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [taskStats, setTaskStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [extendDays, setExtendDays] = useState(7)
  const [restrictReason, setRestrictReason] = useState('')
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showRestrictModal, setShowRestrictModal] = useState(false)

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get(`/master-admin/companies/${id}`)
      setCompany(response.data.company)
      setSubscription(response.data.subscription)
      setPayments(response.data.payments)
      setTaskStats(response.data.taskStats)
    } catch (error) {
      console.error('Failed to fetch company details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanyDetails() }, [id])

  const handleExtendTrial = async () => {
    setActionLoading(true)
    try {
      await api.post(`/master-admin/companies/${id}/extend-trial`, { days: extendDays })
      setShowExtendModal(false)
      fetchCompanyDetails()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to extend trial')
    } finally { setActionLoading(false) }
  }

  const handleRestrict = async () => {
    setActionLoading(true)
    try {
      await api.post(`/master-admin/companies/${id}/restrict`, { reason: restrictReason })
      setShowRestrictModal(false)
      setRestrictReason('')
      fetchCompanyDetails()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to restrict company')
    } finally { setActionLoading(false) }
  }

  const handleUnrestrict = async () => {
    setActionLoading(true)
    try {
      await api.post(`/master-admin/companies/${id}/unrestrict`)
      fetchCompanyDetails()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to unrestrict company')
    } finally { setActionLoading(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Company not found</p>
        <button onClick={() => navigate('/companies')} className="mt-4 text-primary hover:underline text-sm">
          Back to Companies
        </button>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      trial: 'bg-primary-light text-primary',
      active: 'bg-green-50 text-green-600',
      expired: 'bg-amber-50 text-amber-600',
      cancelled: 'bg-red-50 text-red-600',
    }
    return styles[status] || 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="animate-fade-in space-y-6" data-testid="company-details-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/companies')} className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary">{company.companyName}</h1>
          <p className="text-gray-400 text-sm">{company.companyEmail}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {(subscription?.status === 'trial' || subscription?.status === 'expired') && (
          <button
            onClick={() => setShowExtendModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            data-testid="extend-trial-btn"
          >
            <Clock size={16} /> Extend Trial
          </button>
        )}
        {subscription?.isManuallyRestricted ? (
          <button
            onClick={handleUnrestrict}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            data-testid="unrestrict-btn"
          >
            <Unlock size={16} /> Unrestrict
          </button>
        ) : (
          <button
            onClick={() => setShowRestrictModal(true)}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
            data-testid="restrict-btn"
          >
            <Lock size={16} /> Restrict
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> Company Info
          </h2>
          <div className="space-y-3">
            <div><p className="text-xs text-gray-400">Contact</p><p className="text-sm text-secondary">{company.companyContactNumber || 'N/A'}</p></div>
            <div><p className="text-xs text-gray-400">Address</p><p className="text-sm text-secondary">{company.companyAddress || 'N/A'}</p></div>
            <div><p className="text-xs text-gray-400">GST Number</p><p className="text-sm text-secondary">{company.companyGSTNumber || 'N/A'}</p></div>
            <div><p className="text-xs text-gray-400">Created</p><p className="text-sm text-secondary">{new Date(company.createdAt).toLocaleDateString()}</p></div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-primary" /> Subscription
          </h2>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(subscription.status)}`}>{subscription.status}</span>
                {subscription.isManuallyRestricted && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600">Restricted</span>
                )}
              </div>
              <div><p className="text-xs text-gray-400">Plan</p><p className="text-sm text-secondary capitalize">{subscription.planType?.replace('_', ' ')}</p></div>
              <div><p className="text-xs text-gray-400">Users</p><p className="text-sm text-secondary">{subscription.currentUserCount}</p></div>
              <div><p className="text-xs text-gray-400">Monthly Bill</p><p className="text-xl font-bold text-primary">₹{subscription.totalAmount}</p></div>
              <div>
                <p className="text-xs text-gray-400">{subscription.status === 'trial' ? 'Trial Ends' : 'Current Period Ends'}</p>
                <p className="text-sm text-secondary">{new Date(subscription.trialEndDate || subscription.currentPeriodEnd).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No subscription</p>
          )}
        </div>

        {/* Task Stats */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-primary" /> Task Statistics
          </h2>
          {taskStats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-secondary">{taskStats.total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">{taskStats.completed}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-xl font-bold text-amber-600">{taskStats.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">{taskStats.overdue}</p>
                <p className="text-xs text-gray-400">Overdue</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No task data</p>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
          <Users size={18} className="text-primary" /> Team Members ({company.employeeCount})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {company.owners?.map((owner) => (
            <div key={owner._id} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">{owner.firstName?.[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-secondary text-sm truncate">{owner.firstName} {owner.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{owner.email}</p>
                <span className="text-xs text-primary font-medium">Admin</span>
              </div>
            </div>
          ))}
          {company.employees?.slice(0, 5).map((emp) => (
            <div key={emp._id} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 font-semibold text-sm">{emp.firstName?.[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-secondary text-sm truncate">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                <span className="text-xs text-gray-400 capitalize">{emp.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-primary" /> Payment History
        </h2>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-secondary font-mono">{payment.invoiceNumber}</td>
                    <td className="py-3 text-sm font-medium text-secondary">₹{payment.amount}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'success' ? 'bg-green-50 text-green-600' :
                        payment.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{payment.status}</span>
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4 text-sm">No payment history</p>
        )}
      </div>

      {/* Extend Trial Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-100 shadow-xl">
            <h3 className="text-lg font-semibold text-secondary mb-4">Extend Trial Period</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-2">Number of Days</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                min="1"
                max="90"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExtendModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleExtendTrial} disabled={actionLoading || extendDays < 1} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium">
                {actionLoading ? 'Extending...' : 'Extend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Modal */}
      {showRestrictModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-100 shadow-xl">
            <h3 className="text-lg font-semibold text-secondary mb-1 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> Restrict Company
            </h3>
            <p className="text-gray-400 text-sm mb-4">This will block all users from accessing the system.</p>
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-2">Reason (optional)</label>
              <textarea
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                placeholder="Enter reason for restriction..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRestrictModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleRestrict} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium">
                {actionLoading ? 'Restricting...' : 'Restrict'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
