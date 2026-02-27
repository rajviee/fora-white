import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { CreditCard, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [totals, setTotals] = useState({ totalRevenue: 0, totalPayments: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, total: 0 })

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', pagination.page)
      params.append('limit', 20)
      if (statusFilter) params.append('status', statusFilter)

      const response = await api.get(`/master-admin/payments?${params}`)
      setPayments(response.data.payments)
      setTotals(response.data.totals)
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        total: response.data.pagination.total
      }))
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [pagination.page, statusFilter])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={14} />
      case 'failed': return <XCircle className="text-red-500" size={14} />
      default: return <Clock className="text-amber-500" size={14} />
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-600'
      case 'failed': return 'bg-red-50 text-red-600'
      case 'refunded': return 'bg-purple-50 text-purple-600'
      default: return 'bg-amber-50 text-amber-600'
    }
  }

  return (
    <div className="animate-fade-in space-y-6" data-testid="payments-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-secondary">Payments</h1>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPagination(prev => ({ ...prev, page: 0 }))
          }}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
          data-testid="payment-status-filter"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CreditCard className="text-green-600" size={20} />
            </div>
            <span className="text-gray-500 text-sm">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-secondary">₹{totals.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <CheckCircle className="text-primary" size={20} />
            </div>
            <span className="text-gray-500 text-sm">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{totals.totalPayments}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">No payments found</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-secondary">{payment.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-secondary text-sm">{payment.company?.companyName || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{payment.company?.companyEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-secondary">₹{payment.amount}</span>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm text-gray-500">
                      {payment.paymentMethod || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {payment.paymentDate 
                        ? new Date(payment.paymentDate).toLocaleDateString() 
                        : new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Showing {payments.length} of {pagination.total} payments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 0}
                className="p-2 rounded-lg bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page + 1} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="p-2 rounded-lg bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
