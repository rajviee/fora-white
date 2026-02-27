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
      trial: 'bg-primary-light text-primary',
      active: 'bg-green-50 text-green-600',
      expired: 'bg-amber-50 text-amber-600',
      cancelled: 'bg-red-50 text-red-600',
    }
    return styles[status] || 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="animate-fade-in space-y-6" data-testid="companies-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-secondary">Companies</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-full sm:w-64"
              data-testid="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
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
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bill</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">No companies found</td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                          <Building2 className="text-primary" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-secondary">{company.companyName}</p>
                          <p className="text-xs text-gray-400">{company.companyEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(company.subscription?.status)}`}>
                        {company.subscription?.status || 'N/A'}
                        {company.subscription?.isManuallyRestricted && ' (Restricted)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm">{company.subscription?.currentUserCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-secondary">₹{company.subscription?.totalAmount || 0}</span>
                      <span className="text-gray-400 text-xs">/mo</span>
                    </td>
                    <td className="px-6 py-4">
                      {company.subscription?.trialEndDate || company.subscription?.currentPeriodEnd ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(company.subscription?.trialEndDate || company.subscription?.currentPeriodEnd).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/companies/${company.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
                        data-testid={`view-company-${company.id}`}
                      >
                        View <ExternalLink size={12} />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Showing {companies.length} of {pagination.total} companies
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
