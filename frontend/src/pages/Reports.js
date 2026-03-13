import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, getPriorityColor, formatDateTime } from '../utils';

export default function Reports() {
  const { user } = useAuth();
  const { orgSettings } = useOutletContext();
  const isAdmin = user?.role === 'admin';
  
  const [reportType, setReportType] = useState(isAdmin ? 'admin' : 'self');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(0);
  const perPage = 15;
  const [selectedIds, setSelectedIds] = useState([]);

  // Default to last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(now.toISOString().split('T')[0]);

  useEffect(() => {
    fetchStats();
    setPage(0);
  }, [reportType, fromDate, toDate]);

  useEffect(() => {
    fetchTasks();
  }, [reportType, fromDate, toDate, page]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const endpoint = reportType === 'admin' ? '/reports/admin-report-summary' : '/reports/self-report-summary';
      const response = await api.get(endpoint, {
        params: { fromDate, toDate }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const isSelfTask = reportType === 'self';
      const response = await api.get('/task/getTaskList', {
        params: { 
          isSelfTask, 
          fromDate, 
          toDate, 
          page, 
          perPage 
        }
      });
      setTasks(response.data.tasks || []);
      setTotalTasks(response.data.totalTasks || 0);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error fetching report tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleBulkMarkComplete = async () => {
    if (!selectedIds.length) return;
    try {
      await api.patch('/task/markAsCompleted', { taskIds: selectedIds });
      fetchTasks();
      fetchStats();
      setSelectedIds([]);
    } catch (e) { console.error(e); }
  };

  const toggleSelectAll = () => {
    const selectable = tasks.filter(t => t.status !== 'Completed').map(t => t._id);
    if (selectedIds.length === selectable.length && selectable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading && !stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const total = stats?.totalTasks || 0;
  const completed = stats?.completedTasks || 0;
  const inProgress = stats?.inProgressTasks || 0;
  const pending = stats?.pendingTasks || 0;
  const overdue = stats?.overdueTasks || 0;
  const forApproval = stats?.forApprovalTasks || 0;

  const pieData = [
    { name: 'Completed', value: completed, color: '#10B981' },
    { name: 'In Progress', value: inProgress, color: '#1360C6' },
    { name: 'Pending', value: pending, color: '#F59E0B' },
    { name: 'Overdue', value: overdue, color: '#EF4444' },
    { name: 'For Approval', value: forApproval, color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const displayPieData = pieData.length > 0 ? pieData : [{ name: 'No Tasks', value: 1, color: '#F1F5F9' }];

  const barData = [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'Pending', value: pending },
    { name: 'Overdue', value: overdue },
    { name: 'For Approval', value: forApproval },
  ];

  return (
    <div className="animate-fade-in space-y-6" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary">Reports</h1>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button 
                onClick={() => setReportType('admin')} 
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${reportType === 'admin' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Team Report
              </button>
              <button 
                onClick={() => setReportType('self')} 
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${reportType === 'self' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                My Report
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary mb-4">Task Distribution</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={displayPieData} 
                  innerRadius={60} 
                  outerRadius={90} 
                  dataKey="value" 
                  startAngle={90} 
                  endAngle={-270}
                  paddingAngle={displayPieData.length > 1 ? 2 : 0}
                >
                  {displayPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-gray-500">{d.name}: {d.value}</span>
              </div>
            ))}
            {pieData.length === 0 && <span className="text-xs text-gray-400 italic">No data for selected period</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary mb-4">Task Summary</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="value" fill="#1360C6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{total}</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-violet-500">{forApproval}</p>
            <p className="text-xs text-gray-500">For Approval</p>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl border border-black/50 overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b border-black/50 bg-gray-50/30 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">Tasks List</h2>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkMarkComplete}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-check" />
              Mark Completed ({selectedIds.length})
            </button>
          )}
        </div>

        {tasksLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-medium text-secondary">No tasks found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-4 px-5 text-left w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === tasks.filter(t => t.status !== 'Completed').length && tasks.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-white/30 bg-white/10" 
                    />
                  </th>
                  <th className="py-4 px-4 text-left text-sm font-semibold">Task Name</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold w-32">Priority</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold w-48">Deadline</th>
                  <th className="py-4 px-5 text-center text-sm font-semibold w-36">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const isCompleted = task.status === 'Completed';
                  return (
                    <tr key={task._id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''} ${isCompleted ? 'opacity-50' : ''}`}>
                      <td className="py-4 px-5">
                        <input 
                          type="checkbox" 
                          disabled={isCompleted}
                          checked={selectedIds.includes(task._id)}
                          onChange={() => toggleSelect(task._id)}
                          className="rounded border-primary text-primary focus:ring-primary/20 disabled:opacity-30" 
                        />
                      </td>
                      <td className="py-4 px-4">
                        <Link to={`/tasks/${task._id}`} className={`text-base text-secondary hover:text-primary font-medium flex items-center gap-2 ${isCompleted ? 'line-through decoration-gray-400' : ''}`}>
                          <span className="truncate max-w-md">{task.title}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-secondary">
                          {formatDateTime(task.dueDateTime, orgSettings)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={getStatusColor(task.status)}>{task.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalTasks > perPage && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50">
            <button 
              disabled={page === 0} 
              onClick={() => setPage(page - 1)} 
              className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-30 uppercase tracking-widest"
            >
              <i className="fa-solid fa-chevron-left" />Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Page</span>
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium shadow-sm">{page + 1}</span>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">of {Math.ceil(totalTasks / perPage)}</span>
            </div>
            <button 
              disabled={(page + 1) * perPage >= totalTasks} 
              onClick={() => setPage(page + 1)} 
              className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-30 uppercase tracking-widest"
            >
              Next<i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
