import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { getStatusColor, getPriorityColor, formatDate } from '../utils';

export default function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isSelf = searchParams.get('self') === 'true';
  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '0');

  useEffect(() => { loadTasks(); }, [isSelf, statusFilter, page]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { isSelfTask: isSelf, perPage: 15, page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get('/task/getTaskList', { params });
      setTasks(res.data.tasks || []);
      setTotal(res.data.totalTasks || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['', 'Pending', 'In Progress', 'Completed', 'Overdue', 'For Approval'];

  return (
    <div className="animate-fade-in" data-testid="task-list-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Tasks</h1>
        <Link to="/tasks/create" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="create-task-link">
          <i className="fa-solid fa-plus mr-2" />New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setSearchParams({ self: 'false' })} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${!isSelf ? 'bg-white shadow-sm text-secondary' : 'text-gray-500'}`} data-testid="filter-team">Team</button>
            <button onClick={() => setSearchParams({ self: 'true' })} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${isSelf ? 'bg-white shadow-sm text-secondary' : 'text-gray-500'}`} data-testid="filter-self">Self</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s || 'all'}
                onClick={() => { const p = new URLSearchParams(searchParams); if (s) p.set('status', s); else p.delete('status'); p.delete('page'); setSearchParams(p); }}
                className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}
                data-testid={`filter-status-${(s || 'all').toLowerCase().replace(/ /g, '-')}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTasks()}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                data-testid="task-search"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fa-solid fa-clipboard-list text-4xl mb-3" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map((task) => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors" data-testid={`task-row-${task._id}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-secondary truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(task.dueDateTime)}</p>
                </div>
                <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(task.status)}`}>{task.status}</span>
                <i className="fa-solid fa-chevron-right text-gray-300 text-xs" />
              </Link>
            ))}
          </div>
        )}
        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button disabled={page === 0} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page - 1)); setSearchParams(p); }} className="text-sm text-primary disabled:text-gray-300">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(total / 15)}</span>
            <button disabled={(page + 1) * 15 >= total} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page + 1)); setSearchParams(p); }} className="text-sm text-primary disabled:text-gray-300">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
