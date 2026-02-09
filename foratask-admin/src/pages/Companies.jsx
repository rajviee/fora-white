import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../context/AuthContext'
import { Search, ChevronLeft, ChevronRight, Building2, Users, Calendar, ExternalLink } from 'lucide-react'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1 })

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', pagination.page)
      params.append('limit', 10)
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await api.get(`/master-admin/companies?${params}`)
      setCompanies(response.data.companies)
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        total: response.data.pagination.total
      }))
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [pagination.page, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 }))
      fetchCompanies()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const getStatusBadge = (status) => {
    const styles = {
      trial: 'bg-blue-500/20 text-blue-400',
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
    }
    return styles[status] || 'bg-slate-500/20 text-slate-400'
  }

  return (
    <div className="space-y-6" data-testid="companies-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Companies</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="pl-10 pr-4 py-2 bg-dark-100 border border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 text-white w-full sm:w-64"
              data-testid="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-100 border border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 text-white"
            data-testid="status-filter"
          >
            <option value="">All Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-dark-100 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Company</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Users</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Bill</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Expiry</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-dark-200/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Building2 className="text-primary-400" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{company.companyName}</p>
                          <p className="text-sm text-slate-400">{company.companyEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(company.subscription?.status)}`}>
                        {company.subscription?.status || 'N/A'}
                        {company.subscription?.isManuallyRestricted && ' (Restricted)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span>{company.subscription?.currentUserCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        ₹{company.subscription?.totalAmount || 0}
                      </span>
                      <span className="text-slate-400 text-sm">/mo</span>
                    </td>
                    <td className="px-6 py-4">
                      {company.subscription?.trialEndDate || company.subscription?.currentPeriodEnd ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          <span className="text-sm">
                            {new Date(company.subscription?.trialEndDate || company.subscription?.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/companies/${company.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors text-sm"
                        data-testid={`view-company-${company.id}`}
                      >
                        View <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {companies.length} of {pagination.total} companies
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 0}
                className="p-2 rounded-lg bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                Page {pagination.page + 1} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="p-2 rounded-lg bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
