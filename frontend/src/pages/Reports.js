import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/tasks-summary?isSelfTask=false')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const total = stats?.allTimeTotalTasks || 0;
  const completed = stats?.allTimeCompletedTasks || 0;
  const overdue = stats?.allTimeOverdueTasks || 0;
  const pending = total - completed - overdue;

  const pieData = [
    { name: 'Completed', value: completed || 1, color: '#10B981' },
    { name: 'In Progress', value: pending || 1, color: '#1360C6' },
    { name: 'Overdue', value: overdue || 1, color: '#EF4444' },
  ];

  const barData = [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: pending },
    { name: 'Overdue', value: overdue },
  ];

  return (
    <div className="animate-fade-in" data-testid="reports-page">
      <h1 className="text-xl sm:text-2xl font-bold text-secondary mb-4 sm:mb-6">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary mb-4">Task Distribution</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-gray-500">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary mb-4">Task Summary</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1360C6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{total}</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pending}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
