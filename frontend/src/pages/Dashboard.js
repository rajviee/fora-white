import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, getPriorityColor, formatDate, formatDateTime, timeAgo, getImageUrl } from '../utils';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const Avatar = ({ user: avatarUser, size = "w-9 h-9" }) => {
  if (!avatarUser) return <div className={`${size} rounded-full bg-gray-200 animate-pulse`} />;
  
  const initials = `${avatarUser.firstName?.[0] || ""}${avatarUser.lastName?.[0] || ""}`.toUpperCase();
  const avatarPath = avatarUser.avatar?.path || avatarUser.avatar; // Handle both populated and string paths
  const imageUrl = typeof avatarPath === 'string' && avatarPath ? getImageUrl(avatarPath) : "";

  return (
    <div className={`${size} rounded-full overflow-hidden bg-[#1360C6] flex items-center justify-center shrink-0`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="User" 
          className="w-full h-full object-cover" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<span class="text-white text-xs font-bold">${initials || "U"}</span>`;
          }}
        />
      ) : (
        <span className="text-white text-xs font-bold">{initials || "U"}</span>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { orgSettings } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isSelf, setIsSelf] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Selection states
  const [selectedTodayIds, setSelectedTodayIds] = useState([]);
  const [selectedOverviewIds, setSelectedOverviewIds] = useState([]);

  const handleBulkMarkComplete = async (type) => {
    const ids = type === 'today' ? selectedTodayIds : selectedOverviewIds;
    if (!ids.length) return;
    try {
      await api.patch('/task/markAsCompleted', { taskIds: ids });
      loadData();
      if (type === 'today') setSelectedTodayIds([]);
      else setSelectedOverviewIds([]);
    } catch (e) { console.error(e); }
  };

  const toggleSelectAll = (taskList, type) => {
    const selectable = taskList.filter(t => t.status !== 'Completed').map(t => t._id);
    const currentSelected = type === 'today' ? selectedTodayIds : selectedOverviewIds;
    const allSelected = selectable.every(id => currentSelected.includes(id)) && selectable.length > 0;
    
    if (allSelected) {
      if (type === 'today') setSelectedTodayIds(prev => prev.filter(id => !selectable.includes(id)));
      else setSelectedOverviewIds(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      if (type === 'today') setSelectedTodayIds(prev => [...new Set([...prev, ...selectable])]);
      else setSelectedOverviewIds(prev => [...new Set([...prev, ...selectable])]);
    }
  };

  const toggleSelect = (id, type) => {
    if (type === 'today') {
      setSelectedTodayIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedOverviewIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  useEffect(() => { loadData(); }, [isSelf]);

  const loadData = async () => {
    try {
      const [statsRes, todayRes, allRes, graphRes, notesRes, activityRes] = await Promise.all([
        api.get(`/stats/tasks-summary?isSelfTask=${isSelf}`).catch(() => ({ data: null })),
        api.get(`/stats/todaysTasks?isSelfTask=${isSelf}`).catch(() => ({ data: { tasks: [] } })),
        api.get(`/task/getTaskList?isSelfTask=${isSelf}&perPage=100&page=0`).catch(() => ({ data: { tasks: [] } })),
        api.get(`/stats/statisticsGraph?isSelfTask=${isSelf}`).catch(() => ({ data: null })),
        api.get('/notes').catch(() => ({ data: [] })),
        api.get('/notifications/getAllNotifications').catch(() => ({ data: [] })),
      ]);
      const s = statsRes.data;
      const total = s?.allTimeTotalTasks || 0;
      const completed = s?.allTimeCompletedTasks || 0;
      const overdue = s?.allTimeOverdueTasks || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({ 
        total, completed, overdue, progress, 
        inProgress: total - completed - overdue,
        todayHigh: s?.todayhighPriority || 0,
        todayMedium: s?.todaymediumPriority || 0,
        todayLow: s?.todaylowPriority || 0,
        todayOverdue: s?.todayoverduePriority || 0
      });
      setTodayTasks(todayRes.data?.tasks || todayRes.data || []);
      setAllTasks(allRes.data?.tasks || []);
      setRecentNotes(Array.isArray(notesRes.data) ? notesRes.data.slice(0, 4) : []);
      setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data.slice(0, 4) : []);
      setSelectedTodayIds([]);
      setSelectedOverviewIds([]);

      // Build graph data
      const gd = graphRes.data;
      if (Array.isArray(gd)) {
        setGraphData(gd.map(item => ({
          name: MONTHS[item.month - 1] || `M${item.month}`,
          Completed: item.completed,
          Incomplete: item.incomplete,
        })));
      } else {
        setGraphData(MONTHS.map(m => ({ name: m, Completed: 0, Incomplete: 0 })));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const donutData = [
    { name: 'High', value: stats?.todayHigh || 0, color: '#103362' },
    { name: 'Medium', value: stats?.todayMedium || 0, color: '#1360C6' },
    { name: 'Low', value: stats?.todayLow || 0, color: 'rgba(19,96,198,0.50)' },
    { name: 'Due', value: stats?.todayOverdue || 0, color: 'rgba(19,96,198,0.25)' },
  ];

  const displayDonutData = donutData.some(d => d.value > 0) ? donutData : [{ name: 'No Tasks', value: 1, color: '#F1F5F9' }];

  const changeMonth = (offset) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  const isSameDate = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const selectedDateTasks = allTasks.filter(task => task.dueDateTime && isSameDate(new Date(task.dueDateTime), selectedDate)).sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

  return (
    <div className="animate-fade-in space-y-4" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary">Dashboard</h1>
        <Link to="/tasks/create" className="hidden sm:inline-flex px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors items-center">
          <i className="fa-solid fa-plus mr-2" />New Task
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1360C6] flex items-center justify-center shrink-0"><i className="fa-solid fa-star text-white text-lg" /></div>
          <div><p className="text-xl sm:text-2xl font-bold text-secondary">{stats?.progress || 0}%</p><p className="text-xs sm:text-sm text-gray-500">Task Progress</p></div>
        </div>
        <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1360C6] flex items-center justify-center shrink-0"><i className="fa-solid fa-clipboard-list text-white text-lg" /></div>
          <div><p className="text-xl sm:text-2xl font-bold text-secondary">{stats?.total || 0}</p><p className="text-xs sm:text-sm text-gray-500">Total Task</p></div>
        </div>
        <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1360C6] flex items-center justify-center shrink-0"><i className="fa-solid fa-calendar-xmark text-white text-lg" /></div>
          <div><p className="text-xl sm:text-2xl font-bold text-secondary">{String(stats?.overdue || 0).padStart(2, '0')}</p><p className="text-xs sm:text-sm text-gray-500">Over Due</p></div>
        </div>
        {/* Mobile-only Add Task Card */}
        <Link to="/tasks/create" className="sm:hidden bg-primary rounded-xl border border-black/50 p-4 flex items-center gap-3 shadow-md shadow-primary/20 active:scale-95 transition-transform">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-plus text-white text-lg" /></div>
          <div><p className="text-lg font-semibold text-white capitalize tracking-wider">Add Task</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Today's Task */}
          <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-secondary">Today's Task</h2>
                {selectedTodayIds.length > 0 && (
                  <button onClick={() => handleBulkMarkComplete('today')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm">
                    <i className="fa-solid fa-check" /> Complete ({selectedTodayIds.length})
                  </button>
                )}
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setIsSelf(true)} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}>Self</button>
                <button onClick={() => setIsSelf(false)} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${!isSelf ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}>Team</button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full min-w-[600px] table-fixed">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-black/50">
                    <th className="pl-4 sm:pl-5 pb-3 w-12">
                      <input type="checkbox" className="rounded border-gray-300" checked={todayTasks.filter(t => t.status !== 'Completed').length > 0 && todayTasks.filter(t => t.status !== 'Completed').every(t => selectedTodayIds.includes(t._id))} onChange={() => toggleSelectAll(todayTasks, 'today')} />
                    </th>
                    <th className="pb-3 pl-4 font-medium">Task Name</th>
                    <th className="pb-3 font-medium text-center w-32">Priority</th>
                    <th className="pb-3 font-medium text-left w-48">Dead Line</th>
                    <th className="pb-3 font-medium text-center w-40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTasks.slice(0, 7).map((task, i) => {
                    const isCompleted = task.status === 'Completed';
                    return (
                      <tr key={task._id || i} className={`border-b border-black/10 last:border-0 hover:bg-gray-50/50 transition-colors ${isCompleted ? 'opacity-50' : ''}`}>
                        <td className="pl-4 sm:pl-5 py-3">
                          <input type="checkbox" className="rounded border-gray-300" disabled={isCompleted} checked={selectedTodayIds.includes(task._id)} onChange={() => toggleSelect(task._id, 'today')} />
                        </td>
                        <td className="py-3 pl-4">
                          <Link to={`/tasks/${task._id}`} className={`text-sm text-secondary hover:text-primary truncate block ${isCompleted ? 'line-through' : ''}`}>{task.title}</Link>
                        </td>
                        <td className="py-3 text-center"><span className={getPriorityColor(task.priority)}>{task.priority}</span></td>
                        <td className="py-3 text-sm text-gray-500"><i className="fa-regular fa-clock mr-1" />{formatDateTime(task.dueDateTime, orgSettings)}</td>
                        <td className="py-3 text-center"><span className={getStatusColor(task.status)}>{task.status}</span></td>
                      </tr>
                    );
                  })}
                  {todayTasks.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No tasks for today</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-secondary truncate">Statistics</h2>
              <select className="text-xs sm:text-sm border border-black/50 rounded-lg pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white shrink-0 appearance-none" value={isSelf ? 'Self' : 'Team'} onChange={(e) => setIsSelf(e.target.value === 'Self')}>
                <option value="Self">Self Task</option><option value="Team">Team Task</option>
              </select>
            </div>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* Recent Activity & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-secondary">Recent Activity</h2>
                <button className="text-gray-400 hover:text-secondary"><i className="fa-solid fa-ellipsis" /></button>
              </div>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400 italic">No recent activity</p>
                ) : (
                  recentActivity.map((act, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Avatar user={act.senderId} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-secondary truncate">
                            {act.senderId?.firstName} {act.senderId?.lastName}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(act.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{act.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-secondary">Notes</h2>
                <button className="text-gray-400 hover:text-secondary"><i className="fa-solid fa-ellipsis" /></button>
              </div>
              <div className="space-y-4">
                {recentNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 italic">No notes found</p>
                    <Link to="/notes" className="text-xs text-primary hover:underline mt-2 inline-block font-medium">Create your first note</Link>
                  </div>
                ) : (
                  recentNotes.map((note, i) => (
                    <Link 
                      key={note._id || i} 
                      to={`/notes/${note._id}`}
                      className="block p-3 rounded-xl border border-black/10 bg-gray-50/30 hover:bg-gray-100/50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-secondary truncate mb-1">{note.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                    </Link>
                  ))
                )}              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-secondary mb-3">Today's Task Summary</h2>
            <div className="h-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={displayDonutData} innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>{displayDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie></PieChart></ResponsiveContainer></div>
            <div className="grid grid-cols-2 gap-2 mt-2">{donutData.map((d, i) => (<div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs text-gray-500">{d.name} : {String(d.value).padStart(2, '0')}</span></div>))}</div>
          </div>

          <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-base font-semibold text-secondary">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p><p className="text-xs text-gray-400">Selected: {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
              <div className="flex gap-1"><button onClick={() => changeMonth(-1)} className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white text-xs hover:bg-primary/90"><i className="fa-solid fa-chevron-left" /></button><button onClick={() => changeMonth(1)} className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white text-xs hover:bg-primary/90"><i className="fa-solid fa-chevron-right" /></button></div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}</div>
            <div className="grid grid-cols-7 text-center text-sm gap-y-1">{calDays.map((day, i) => { const dateObj = day ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day) : null; const isSelected = dateObj && isSameDate(dateObj, selectedDate); const isToday = dateObj && isSameDate(dateObj, new Date()); return (<button key={i} disabled={!day} onClick={() => setSelectedDate(dateObj)} className={`py-1 rounded-full text-xs transition-all ${!day ? 'invisible' : isSelected ? 'bg-primary text-white font-bold shadow-md scale-110' : isToday ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>{day || ''}</button>); })}</div>
            <div className="mt-4 space-y-2 max-h-[300px] overflow-auto pr-1 custom-scrollbar">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due on this day</h3>
              {selectedDateTasks.length === 0 ? (<p className="text-[11px] text-gray-400 text-center py-4 italic">No tasks due</p>) : selectedDateTasks.map((task, i) => (<Link key={i} to={`/tasks/${task._id}`} className="block p-2.5 bg-primary/5 border-l-3 border-primary rounded-lg hover:bg-primary/10" style={{ borderLeftWidth: 3, borderLeftColor: task.priority === 'High' ? '#EF4444' : task.priority === 'Medium' ? '#1360C6' : '#94A3B8' }}><div className="flex items-center justify-between mb-0.5"><p className="text-xs font-bold text-secondary truncate flex-1">{task.title}</p><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Medium' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{task.priority}</span></div><p className="text-[10px] text-gray-400 truncate">{task.description || 'No description'}</p></Link>))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview - Moved outside grid for Full Width */}
      <div className="bg-white rounded-xl border border-black/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-secondary">Task Overview</h2>
            {selectedOverviewIds.length > 0 && (
              <button onClick={() => handleBulkMarkComplete('overview')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm">
                <i className="fa-solid fa-check" /> Complete ({selectedOverviewIds.length})
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full min-w-[600px] table-fixed">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-black/50">
                <th className="pl-4 sm:pl-5 pb-3 w-12">
                  <input type="checkbox" className="rounded border-gray-300" checked={allTasks.slice(0, 7).filter(t => t.status !== 'Completed').length > 0 && allTasks.slice(0, 7).filter(t => t.status !== 'Completed').every(t => selectedOverviewIds.includes(t._id))} onChange={() => toggleSelectAll(allTasks.slice(0, 7), 'overview')} />
                </th>
                <th className="pb-3 pl-4 font-medium">Task Name</th>
                <th className="pb-3 font-medium text-center w-32">Priority</th>
                <th className="pb-3 font-medium text-left w-48">Dead Line</th>
                <th className="pb-3 font-medium text-center w-40">Status</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.slice(0, 7).map((task, i) => {
                const isCompleted = task.status === 'Completed';
                return (
                  <tr key={task._id || i} className={`border-b border-black/10 last:border-0 hover:bg-gray-50/50 transition-colors ${isCompleted ? 'opacity-50' : ''}`}>
                    <td className="pl-4 sm:pl-5 py-3">
                      <input type="checkbox" className="rounded border-gray-300" disabled={isCompleted} checked={selectedOverviewIds.includes(task._id)} onChange={() => toggleSelect(task._id, 'overview')} />
                    </td>
                    <td className="py-3 pl-4">
                      <Link to={`/tasks/${task._id}`} className={`text-sm text-secondary hover:text-primary truncate block ${isCompleted ? 'line-through' : ''}`}>{task.title}</Link>
                    </td>
                    <td className="py-3 text-center"><span className={getPriorityColor(task.priority)}>{task.priority}</span></td>
                    <td className="py-3 text-sm text-gray-500"><i className="fa-regular fa-clock mr-1" />{formatDateTime(task.dueDateTime, orgSettings)}</td>
                    <td className="py-3 text-center"><span className={getStatusColor(task.status)}>{task.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
