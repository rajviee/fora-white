import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, formatDate, formatDateTime, timeAgo } from '../utils';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [locations, setLocations] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => { loadTask(); }, [id]);

  const loadTask = async () => {
    try {
      const [taskRes, locsRes, timelineRes, discussRes] = await Promise.all([
        api.get(`/task/${id}`),
        api.get(`/task-extended/${id}/locations`).catch(() => ({ data: { locations: [] } })),
        api.get(`/task-extended/${id}/timeline`).catch(() => ({ data: { timeline: [] } })),
        api.get(`/task-extended/${id}/discussions`).catch(() => ({ data: { discussions: [] } })),
      ]);
      setTask(taskRes.data);
      setLocations(locsRes.data?.locations || []);
      setTimeline(timelineRes.data?.timeline || []);
      setDiscussions(discussRes.data?.discussions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleStatusChange = async (status) => {
    try { await api.patch(`/task/edit/${id}`, { status }); loadTask(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleMarkComplete = async () => {
    try { await api.patch('/task/markAsCompleted', { taskIds: [id] }); loadTask(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try { await api.post(`/task-extended/${id}/discussions`, { content: newComment }); setNewComment(''); loadTask(); } catch (e) { console.error(e); }
  };

  const handleLocationProgress = async (locId, status, remarks) => {
    try { await api.patch(`/task-extended/${id}/locations/${locId}/progress`, { status, remarks }); loadTask(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!task) return <div className="text-center py-12 text-gray-400">Task not found</div>;

  const isAssignee = task.assignees?.some(a => (a._id || a) === user?.id);
  const isObserver = task.observers?.some(o => (o._id || o) === user?.id);
  const tabs = ['details', 'locations', 'discussion'];

  return (
    <div className="animate-fade-in" data-testid="task-detail-page">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-primary hover:text-primary/80" data-testid="back-btn">
          <i className="fa-solid fa-chevron-left text-lg" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Task</h1>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border border-primary rounded-lg overflow-hidden w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 sm:px-6 py-2 text-sm font-medium capitalize transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary/5'}`} data-testid={`tab-${t}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        {activeTab === 'details' && (
          <div className="space-y-6" data-testid="task-details-tab">
            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-secondary">{task.title}</h2>
                {task.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{task.description}</p>}
              </div>
              <div className="flex items-start gap-2 shrink-0 flex-wrap">
                <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  task.priority === 'High' ? 'bg-primary text-white' :
                  task.priority === 'Medium' ? 'bg-primary-50 text-primary' :
                  'bg-gray-100 text-gray-600'
                }`}>{task.priority}</span>
                {task.status !== 'Completed' && (
                  <button onClick={handleMarkComplete} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors" data-testid="complete-btn">Complete</button>
                )}
                <button className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors" data-testid="edit-btn">Edit</button>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar" /> {formatDate(task.dueDateTime)}
            </div>

            {/* Documents placeholder */}
            <div>
              <h3 className="text-base font-bold text-secondary mb-3">All Documents</h3>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="text-sm text-gray-400 text-center py-6">No documents attached</div>
              </div>
            </div>

            {/* Doers */}
            <div>
              <h3 className="text-base font-bold text-secondary mb-3">Doer -</h3>
              <div className="flex flex-wrap gap-2">
                {(task.assignees || []).map(a => (
                  <div key={a._id || a} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200" data-testid={`doer-chip-${a._id || a}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {a.firstName?.[0] || '?'}{a.lastName?.[0] || ''}
                    </div>
                    <span className="text-sm text-secondary">{a.firstName ? `${a.firstName}` : 'User'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Viewers */}
            <div>
              <h3 className="text-base font-bold text-secondary mb-3">Viewer -</h3>
              <div className="flex flex-wrap gap-2">
                {(task.observers || []).map(o => (
                  <div key={o._id || o} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200" data-testid={`viewer-chip-${o._id || o}`}>
                    <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-semibold text-secondary">
                      {o.firstName?.[0] || '?'}{o.lastName?.[0] || ''}
                    </div>
                    <span className="text-sm text-secondary">{o.firstName ? `${o.firstName}` : 'User'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-base font-bold text-secondary mb-3">Timeline</h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No timeline events</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-secondary">{entry.description || entry.eventType}</p>
                        <p className="text-xs text-gray-400">{timeAgo(entry.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-4" data-testid="task-locations-tab">
            {locations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No locations assigned to this task</p>
            ) : (
              locations.map((loc, idx) => (
                <div key={loc._id || idx} className="p-4 border border-gray-100 rounded-xl" data-testid={`location-item-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-primary" />
                      <h3 className="text-sm font-semibold text-secondary">{loc.name}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(loc.status)}`}>{loc.status}</span>
                  </div>
                  {loc.description && <p className="text-sm text-gray-500 mb-3">{loc.description}</p>}
                  {loc.geotag && (
                    <p className="text-xs text-gray-400 mb-2">
                      <i className="fa-solid fa-map-pin mr-1" />{loc.geotag.latitude?.toFixed(4)}, {loc.geotag.longitude?.toFixed(4)}
                    </p>
                  )}
                  {isAssignee && loc.status !== 'Completed' && (
                    <div className="flex gap-2 mt-3">
                      {loc.status === 'Pending' && (
                        <button onClick={() => handleLocationProgress(loc._id, 'In Progress', 'Started')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors" data-testid={`loc-start-${idx}`}>Start</button>
                      )}
                      {loc.status === 'In Progress' && (
                        <button onClick={() => handleLocationProgress(loc._id, 'Completed', 'Done')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors" data-testid={`loc-complete-${idx}`}>Complete</button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'discussion' && (
          <div data-testid="task-discussion-tab">
            <div className="space-y-3 mb-4 max-h-96 overflow-auto">
              {discussions.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No comments yet. Start the discussion!</p>
              ) : (
                discussions.map((d, idx) => (
                  <div key={idx} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {d.user?.firstName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-secondary">{d.user?.firstName || 'User'} {d.user?.lastName || ''}</span>
                        <span className="text-xs text-gray-400">{timeAgo(d.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{d.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-gray-100">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="discussion-input" />
              <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="discussion-submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
