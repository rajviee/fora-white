import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function StatCard({ title, value, subtitle, icon: Icon, variant = 'blue' }) {
  const styles = {
    blue: 'bg-primary-light text-primary',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${styles[variant]}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-bold text-secondary">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/master-admin/dashboard'),
          api.get('/master-admin/analytics/revenue?months=6')
        ])
        setStats(statsRes.data.stats)
        setAnalytics(analyticsRes.data.analytics)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const pieData = [
    { name: 'Trial', value: stats?.subscriptions?.trial || 0, color: '#1360C6' },
    { name: 'Active', value: stats?.subscriptions?.active || 0, color: '#16a34a' },
    { name: 'Expired', value: stats?.subscriptions?.expired || 0, color: '#f59e0b' },
    { name: 'Cancelled', value: stats?.subscriptions?.cancelled || 0, color: '#ef4444' },
  ].filter(item => item.value > 0)

  return (
    <div className="animate-fade-in space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <span className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Companies" value={stats?.totalCompanies || 0} icon={Building2} variant="blue" />
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} variant="green" />
        <StatCard title="MRR" value={`₹${(stats?.mrr || 0).toLocaleString()}`} subtitle="Monthly Recurring Revenue" icon={TrendingUp} variant="blue" />
        <StatCard title="Failed Payments" value={stats?.failedPayments || 0} subtitle="Last 30 days" icon={AlertTriangle} variant={stats?.failedPayments > 0 ? 'red' : 'green'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-lg font-semibold text-secondary mb-4">Revenue Trend</h2>
          <div className="h-64">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#1360C6" strokeWidth={2} dot={{ fill: '#1360C6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No revenue data yet</div>
            )}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-lg font-semibold text-secondary mb-4">Subscription Status</h2>
          <div className="h-52">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No subscriptions yet</div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-500" size={20} />
            <span className="text-gray-500 text-sm">Conversion Rate</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{stats?.conversionRate || 0}%</p>
          <p className="text-sm text-gray-400">Trial to Paid</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <span className="text-gray-500 text-sm">Churn Rate</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{stats?.churnRate || 0}%</p>
          <p className="text-sm text-gray-400">Last 30 days</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-primary" size={20} />
            <span className="text-gray-500 text-sm">Revenue This Month</span>
          </div>
          <p className="text-2xl font-bold text-secondary">₹{(stats?.revenueThisMonth || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-lg font-semibold text-secondary mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {stats?.recentSignups?.length > 0 ? (
              stats.recentSignups.map((company) => (
                <div key={company._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary">{company.companyName}</p>
                    <p className="text-sm text-gray-400">{company.companyEmail}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    company.subscription?.status === 'trial' ? 'bg-primary-light text-primary' :
                    company.subscription?.status === 'active' ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {company.subscription?.status || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent signups</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-lg font-semibold text-secondary mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {stats?.recentPayments?.length > 0 ? (
              stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary">{payment.company}</p>
                    <p className="text-sm text-gray-400">{payment.invoiceNumber}</p>
                  </div>
                  <p className="font-semibold text-green-600">₹{payment.amount}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
