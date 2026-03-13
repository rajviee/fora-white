import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import api from '../api';
import { getStatusColor, getPriorityColor, formatDate, formatDateTime } from '../utils';

export default function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orgSettings } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters state
  const isSelf = searchParams.get('self') === 'true';
  const statusFilter = searchParams.get('status')?.split(',') || [];
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const page = parseInt(searchParams.get('page') || '0');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { 
    loadTasks(); 
    setSelectedIds([]); // Clear selection when filters change
  }, [isSelf, searchParams.get('status'), fromDate, toDate, page, debouncedSearch]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { isSelfTask: isSelf, perPage: 15, page };
      if (statusFilter.length) params.status = statusFilter.join(',');
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (debouncedSearch) params.search = debouncedSearch;
      
      const res = await api.get('/task/getTaskList', { params });
      setTasks(res.data.tasks || []);
      setTotal(res.data.totalTasks || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleBulkMarkComplete = async () => {
    if (!selectedIds.length) return;
    try {
      await api.patch('/task/markAsCompleted', { taskIds: selectedIds });
      loadTasks();
      setSelectedIds([]);
    } catch (e) { console.error(e); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.filter(t => t.status !== 'Completed').length && tasks.length > 0) {
      setSelectedIds([]);
    } else {
      const selectable = tasks.filter(t => t.status !== 'Completed').map(t => t._id);
      setSelectedIds(selectable);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleStatusToggle = (s) => {
    const p = new URLSearchParams(searchParams);
    let current = p.get('status')?.split(',').filter(x => x) || [];
    if (current.includes(s)) current = current.filter(x => x !== s);
    else current.push(s);
    
    if (current.length) p.set('status', current.join(','));
    else p.delete('status');
    p.delete('page');
    setSearchParams(p);
  };

  const handleDateChange = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val);
    else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const statuses = ['Pending', 'In Progress', 'Overdue', 'For Approval'];

  return (
    <div className="animate-fade-in" data-testid="task-list-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Tasks</h1>
        <Link to="/tasks/create" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center" data-testid="create-task-link">
          <i className="fa-solid fa-plus mr-2" />New Task
        </Link>
      </div>

      {/* Unified Container for Filters and Table */}
      <div className="bg-white rounded-xl border border-black/50 overflow-hidden shadow-sm">
        {/* Filters Header */}
        <div className="p-3 sm:p-4 border-b border-black/50 bg-gray-50/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Team/Self Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setSearchParams({ self: 'true' })} className={`px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-colors ${isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}>Self</button>
              <button onClick={() => setSearchParams({ self: 'false' })} className={`px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-colors ${!isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}>Team</button>
            </div>

            {/* Status Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 bg-white border border-black/50 rounded-lg text-sm font-medium text-black/55 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <i className="fa-solid fa-filter text-xs text-black/55" />
                Status {statusFilter.length > 0 && <span className="bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{statusFilter.length}</span>}
                <i className="fa-solid fa-chevron-down text-xs text-black/55" />
              </button>
              <div className="absolute top-10 left-0 w-48 bg-white border border-black/50 rounded-xl shadow-xl z-50 hidden group-hover:block p-2">
                <button 
                  onClick={() => { const p = new URLSearchParams(searchParams); p.delete('status'); setSearchParams(p); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg mb-1 font-medium ${statusFilter.length === 0 ? 'bg-primary/5 text-primary' : 'text-black/55 hover:bg-gray-50'}`}
                >All Status</button>
                {statuses.map(s => (
                  <div key={s} onClick={() => handleStatusToggle(s)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={statusFilter.includes(s)} readOnly className="rounded text-primary border-black/50" />
                    <span className={`text-sm font-medium ${statusFilter.includes(s) ? 'text-primary' : 'text-black/55'}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 bg-white border border-black/50 rounded-lg text-sm font-medium text-black/55 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <i className="fa-solid fa-calendar-days text-xs text-black/55" />
                <span>Due Between</span>
                {(fromDate || toDate) && <span className="bg-primary text-white w-2 h-2 rounded-full" />}
                <i className="fa-solid fa-chevron-down text-xs text-black/55" />
              </button>
              <div className="absolute top-10 left-0 w-72 bg-white border border-black/50 rounded-xl shadow-xl z-50 hidden group-hover:block p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-black/55 uppercase tracking-widest">From Date</label>
                    <input 
                      type="date" 
                      value={fromDate} 
                      onChange={e => handleDateChange('from', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-black/50 rounded-lg text-sm font-medium text-black/55 focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-black/55 uppercase tracking-widest">To Date</label>
                    <input 
                      type="date" 
                      value={toDate} 
                      onChange={e => handleDateChange('to', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-black/50 rounded-lg text-sm font-medium text-black/55 focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button 
                      onClick={() => { const p = new URLSearchParams(searchParams); p.delete('from'); p.delete('to'); setSearchParams(p); }}
                      className="text-xs text-primary font-bold hover:underline mt-1 text-left"
                    >Clear Dates</button>
                  )}
                </div>
              </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkMarkComplete}
                  className="shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fa-solid fa-check" />
                  Complete ({selectedIds.length})
                </button>
              )}
              <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-black/55 text-sm" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-black/50 rounded-lg text-sm font-medium text-black/55 placeholder:text-black/80 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div data-testid="task-table">
          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-clipboard-list text-2xl" />
              </div>
              <p className="font-medium text-secondary">No tasks found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query</p>
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
                      <tr key={task._id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''} ${isCompleted ? 'opacity-50' : ''}`} data-testid={`task-row-${task._id}`}>
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
                          <Link to={`/tasks/${task._id}`} className={`text-base text-secondary hover:text-primary font-medium group flex items-center gap-2 ${isCompleted ? 'line-through decoration-gray-400' : ''}`}>
                            <span className="truncate max-w-md">{task.title}</span>
                            {!isCompleted && <i className="fa-solid fa-arrow-right-long opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[10px]" />}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-secondary">
                              {formatDateTime(task.dueDateTime, orgSettings)}
                            </span>
                          </div>
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
          {total > 15 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50">
              <button disabled={page === 0} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page - 1)); setSearchParams(p); }} className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-30 uppercase tracking-widest">
                <i className="fa-solid fa-chevron-left" />Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Page</span>
                <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium shadow-sm">{page + 1}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">of {Math.ceil(total / 15)}</span>
              </div>
              <button disabled={(page + 1) * 15 >= total} onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page + 1)); setSearchParams(p); }} className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-30 uppercase tracking-widest">
                Next<i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
