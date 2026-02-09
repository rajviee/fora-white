import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  }

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`} data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={24} />
        <span className="text-xs uppercase tracking-wider opacity-70">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const pieData = [
    { name: 'Trial', value: stats?.subscriptions?.trial || 0, color: '#60a5fa' },
    { name: 'Active', value: stats?.subscriptions?.active || 0, color: '#34d399' },
    { name: 'Expired', value: stats?.subscriptions?.expired || 0, color: '#fbbf24' },
    { name: 'Cancelled', value: stats?.subscriptions?.cancelled || 0, color: '#f87171' },
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Companies"
          value={stats?.totalCompanies || 0}
          icon={Building2}
          color="primary"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="MRR"
          value={`₹${(stats?.mrr || 0).toLocaleString()}`}
          subtitle="Monthly Recurring Revenue"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Failed Payments"
          value={stats?.failedPayments || 0}
          subtitle="Last 30 days"
          icon={AlertTriangle}
          color={stats?.failedPayments > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-dark-100 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No revenue data yet
              </div>
            )}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Subscription Status</h2>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No subscriptions yet
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-300">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-400" size={20} />
            <span className="text-slate-400">Conversion Rate</span>
          </div>
          <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
          <p className="text-sm text-slate-400">Trial to Paid</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-yellow-400" size={20} />
            <span className="text-slate-400">Churn Rate</span>
          </div>
          <p className="text-2xl font-bold">{stats?.churnRate || 0}%</p>
          <p className="text-sm text-slate-400">Last 30 days</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-primary-400" size={20} />
            <span className="text-slate-400">Revenue This Month</span>
          </div>
          <p className="text-2xl font-bold">₹{(stats?.revenueThisMonth || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {stats?.recentSignups?.length > 0 ? (
              stats.recentSignups.map((company) => (
                <div key={company._id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                  <div>
                    <p className="font-medium">{company.companyName}</p>
                    <p className="text-sm text-slate-400">{company.companyEmail}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    company.subscription?.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                    company.subscription?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {company.subscription?.status || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No recent signups</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-dark-100 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {stats?.recentPayments?.length > 0 ? (
              stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.company}</p>
                    <p className="text-sm text-slate-400">{payment.invoiceNumber}</p>
                  </div>
                  <p className="font-semibold text-green-400">₹{payment.amount}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No recent payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
