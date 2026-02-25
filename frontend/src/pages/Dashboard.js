import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, formatDate } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/stats/tasks-summary?isSelfTask=false').catch(() => ({ data: null })),
        api.get('/task/getTaskList?isSelfTask=false&perPage=5&page=0').catch(() => ({ data: { tasks: [] } })),
      ]);
      const s = statsRes.data;
      setStats({
        totalTasks: s?.allTimeTotalTasks || 0,
        inProgress: (s?.allTimeTotalTasks || 0) - (s?.allTimeCompletedTasks || 0) - (s?.allTimeOverdueTasks || 0),
        completed: s?.allTimeCompletedTasks || 0,
        overdue: s?.allTimeOverdueTasks || 0,
      });
      setRecentTasks(tasksRes.data?.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const cards = [
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: 'fa-solid fa-list-check', color: 'bg-primary/10 text-primary' },
    { label: 'In Progress', value: stats?.inProgress || 0, icon: 'fa-solid fa-spinner', color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: stats?.completed || 0, icon: 'fa-solid fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: 'fa-solid fa-triangle-exclamation', color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="animate-fade-in" data-testid="dashboard-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's your overview.</p>
        </div>
        <Link to="/tasks/create" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="create-task-btn">
          <i className="fa-solid fa-plus mr-2" />New Task
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5" data-testid={`stat-${c.label.toLowerCase().replace(/ /g, '-')}`}>
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <i className={c.icon} />
            </div>
            <p className="text-2xl font-bold text-secondary">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-primary font-medium hover:underline">View all</Link>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-50" data-testid={`task-item-${task._id}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-secondary truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(task.dueDateTime)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
