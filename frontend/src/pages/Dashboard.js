import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, getPriorityColor, formatDate } from '../utils';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isSelf, setIsSelf] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => { loadData(); }, [isSelf]);

  const loadData = async () => {
    try {
      const [statsRes, todayRes, allRes, graphRes] = await Promise.all([
        api.get(`/stats/tasks-summary?isSelfTask=${isSelf}`).catch(() => ({ data: null })),
        api.get(`/stats/todaysTasks?isSelfTask=${isSelf}`).catch(() => ({ data: { tasks: [] } })),
        api.get(`/task/getTaskList?isSelfTask=${isSelf}&perPage=10&page=0`).catch(() => ({ data: { tasks: [] } })),
        api.get(`/stats/statisticsGraph?isSelfTask=${isSelf}`).catch(() => ({ data: null })),
      ]);
      const s = statsRes.data;
      const total = s?.allTimeTotalTasks || 0;
      const completed = s?.allTimeCompletedTasks || 0;
      const overdue = s?.allTimeOverdueTasks || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({ total, completed, overdue, progress, inProgress: total - completed - overdue });
      setTodayTasks(todayRes.data?.tasks || todayRes.data || []);
      setAllTasks(allRes.data?.tasks || []);

      // Build graph data
      const gd = graphRes.data;
      if (gd?.completedByMonth || gd?.incompleteByMonth) {
        setGraphData(MONTHS.map((m, i) => ({
          name: m,
          Completed: gd.completedByMonth?.[i] || 0,
          Incomplete: gd.incompleteByMonth?.[i] || 0,
        })));
      } else {
        setGraphData(MONTHS.map(m => ({ name: m, Completed: 0, Incomplete: 0 })));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const donutData = [
    { name: 'High', value: stats?.overdue || 1, color: '#103362' },
    { name: 'Medium', value: stats?.inProgress || 1, color: '#1360C6' },
    { name: 'Low', value: stats?.completed || 1, color: 'rgba(19,96,198,0.50)' },
    { name: 'Due', value: stats?.overdue || 1, color: 'rgba(19,96,198,0.25)' },
  ];

  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  return (
    <div className="animate-fade-in space-y-4" data-testid="dashboard-page">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary">Dashboard</h1>
        <Link to="/tasks/create" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center" data-testid="create-task-btn">
          <i className="fa-solid fa-plus mr-2" />New Task
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4" data-testid="stat-progress">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FFF3CD] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-star text-[#FFB800] text-lg" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-secondary">{stats?.progress || 0}%</p>
            <p className="text-xs sm:text-sm text-gray-500">Task Progress</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4" data-testid="stat-total">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-clipboard-list text-primary text-lg" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-secondary">{stats?.total || 0}</p>
            <p className="text-xs sm:text-sm text-gray-500">Total Task</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 col-span-2 lg:col-span-1" data-testid="stat-overdue">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-calendar-xmark text-red-500 text-lg" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-secondary">{String(stats?.overdue || 0).padStart(2, '0')}</p>
            <p className="text-xs sm:text-sm text-gray-500">Over Due</p>
          </div>
        </div>
      </div>

      {/* Main grid: Tasks table + Right sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Today's Task */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="today-tasks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-secondary">Today's Task</h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setIsSelf(true)} className={`px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-colors ${isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`} data-testid="toggle-self">Self</button>
                <button onClick={() => setIsSelf(false)} className={`px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-colors ${!isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`} data-testid="toggle-team">Team</button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pl-4 sm:pl-5 pb-3 w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="pb-3 font-medium">Task Name</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Dead Line</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 pr-4 sm:pr-5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {(todayTasks.length > 0 ? todayTasks : allTasks).slice(0, 7).map((task, i) => (
                    <tr key={task._id || i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="pl-4 sm:pl-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="py-3">
                        <Link to={`/tasks/${task._id}`} className="text-sm text-secondary hover:text-primary truncate block max-w-[200px] sm:max-w-[300px]" data-testid={`today-task-${task._id}`}>
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                          task.priority === 'High' ? 'bg-primary text-white' :
                          task.priority === 'Medium' ? 'bg-primary-50 text-primary' :
                          'bg-gray-100 text-gray-600'
                        }`}>{task.priority}</span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">
                        <i className="fa-regular fa-clock mr-1" />{formatDate(task.dueDateTime)}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                      </td>
                      <td className="pr-4 sm:pr-5 py-3">
                        <button className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-ellipsis-vertical text-sm" /></button>
                      </td>
                    </tr>
                  ))}
                  {todayTasks.length === 0 && allTasks.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No tasks for today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistics Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="statistics-chart">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-secondary">Statistics</h2>
              <select className="text-xs sm:text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" data-testid="stats-filter">
                <option>My Task</option>
                <option>Team Task</option>
              </select>
            </div>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Completed" stroke="#1360C6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Incomplete" stroke="#F87171" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity + Notes row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="recent-activity">
              <h2 className="text-base font-semibold text-secondary mb-3">Recent Activity</h2>
              {allTasks.slice(0, 3).map((task, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {task.assignees?.[0]?.firstName?.[0] || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-secondary truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Assigned task</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatDate(task.createdAt)}</span>
                </div>
              ))}
              {allTasks.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="notes-section">
              <h2 className="text-base font-semibold text-secondary mb-3">Notes</h2>
              {allTasks.slice(0, 3).map((task, i) => (
                <div key={i} className="py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-secondary">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description || 'No description'}</p>
                </div>
              ))}
              {allTasks.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No notes</p>}
            </div>
          </div>

          {/* Task Overview */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="task-overview">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-secondary">Task Overview</h2>
              <button className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-gray-600">
                <i className="fa-solid fa-filter text-[10px]" /> Status
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pl-4 sm:pl-5 pb-3 w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="pb-3 font-medium">Task Name</th>
                    <th className="pb-3 font-medium">Doer</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Dead Line</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 pr-4 sm:pr-5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {allTasks.slice(0, 7).map((task, i) => (
                    <tr key={task._id || i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="pl-4 sm:pl-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="py-3">
                        <Link to={`/tasks/${task._id}`} className="text-sm text-secondary hover:text-primary truncate block max-w-[250px]">
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-semibold text-primary">
                            {task.assignees?.[0]?.firstName?.[0] || '?'}
                          </div>
                          {task.assignees?.length > 1 && (
                            <span className="text-xs text-gray-400">+{task.assignees.length - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                          task.priority === 'High' ? 'bg-primary text-white' :
                          task.priority === 'Medium' ? 'bg-primary-50 text-primary' :
                          'bg-gray-100 text-gray-600'
                        }`}>{task.priority}</span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">
                        <i className="fa-regular fa-clock mr-1" />{formatDate(task.dueDateTime)}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                      </td>
                      <td className="pr-4 sm:pr-5 py-3">
                        <button className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-ellipsis-vertical text-sm" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Task Summary Donut */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="task-summary-chart">
            <h2 className="text-base font-semibold text-secondary mb-3">Today's Task Summary</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-500">{d.name} : {String(d.value).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="calendar-widget">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base font-semibold text-secondary">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white text-xs"><i className="fa-solid fa-chevron-left" /></button>
                <button className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white text-xs"><i className="fa-solid fa-chevron-right" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 text-center text-sm gap-y-1">
              {calDays.map((day, i) => (
                <div key={i} className={`py-1 rounded-full text-xs ${
                  day === currentDate.getDate() ? 'bg-primary text-white font-bold' :
                  day ? 'text-gray-600' : ''
                }`}>
                  {day || ''}
                </div>
              ))}
            </div>
            {/* Upcoming tasks */}
            <div className="mt-3 space-y-2">
              {allTasks.slice(0, 3).map((task, i) => (
                <div key={i} className="p-2.5 bg-primary/5 border-l-3 border-primary rounded-lg" style={{ borderLeftWidth: 3, borderLeftColor: '#1360C6' }}>
                  <p className="text-xs font-medium text-secondary truncate">{task.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{task.description || 'Due ' + formatDate(task.dueDateTime)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Queue */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5" data-testid="priority-queue">
            <h2 className="text-base font-semibold text-secondary mb-3">Priority Queue</h2>
            {allTasks.filter(t => t.priority === 'High').slice(0, 5).map((task, i) => (
              <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-secondary truncate">{task.title}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{task.description || 'No description'}</p>
              </div>
            ))}
            {allTasks.filter(t => t.priority === 'High').length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No high priority tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
