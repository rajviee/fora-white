import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getStatusColor, formatDateTime, timeAgo } from '../utils';

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/task/${id}`, { status });
      loadTask();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleMarkComplete = async () => {
    try {
      await api.patch('/task/complete', { taskIds: [id] });
      loadTask();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/task-extended/${id}/discussions`, { content: newComment });
      setNewComment('');
      loadTask();
    } catch (e) { console.error(e); }
  };

  const handleLocationProgress = async (locId, status, remarks) => {
    try {
      await api.patch(`/task-extended/${id}/locations/${locId}/progress`, { status, remarks });
      loadTask();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!task) return <div className="text-center py-12 text-gray-400">Task not found</div>;

  const isAssignee = task.assignees?.some(a => (a._id || a) === user?.id);
  const isObserver = task.observers?.some(o => (o._id || o) === user?.id);
  const tabs = ['details', 'locations', 'timeline', 'discussion'];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto" data-testid="task-detail-page">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0 mt-1" data-testid="back-btn">
          <i className="fa-solid fa-arrow-left text-gray-500 text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-secondary">{task.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Due {formatDateTime(task.dueDateTime)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {task.status !== 'Completed' && (isAssignee || isObserver || user?.role === 'admin') && (
            <>
              {task.status === 'Pending' && (
                <button onClick={() => handleStatusChange('In Progress')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors" data-testid="start-task-btn">Start</button>
              )}
              <button onClick={handleMarkComplete} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors" data-testid="complete-task-btn">
                {isAssignee && !isObserver && user?.role !== 'admin' ? 'Submit for Approval' : 'Mark Complete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === t ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-gray-700'}`} data-testid={`tab-${t}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {activeTab === 'details' && (
          <div className="space-y-5" data-testid="task-details-tab">
            {task.description && <div><h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3><p className="text-sm text-secondary">{task.description}</p></div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3><p className="text-sm font-semibold text-secondary">{task.priority}</p></div>
              <div><h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3><p className="text-sm font-semibold text-secondary">{task.taskType}</p></div>
              <div><h3 className="text-sm font-medium text-gray-500 mb-1">Remote</h3><p className="text-sm font-semibold text-secondary">{task.isRemote ? 'Yes' : 'No'}</p></div>
              <div><h3 className="text-sm font-medium text-gray-500 mb-1">Multi-Location</h3><p className="text-sm font-semibold text-secondary">{task.isMultiLocation ? 'Yes' : 'No'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Doers</h3>
                <div className="space-y-1">
                  {(task.assignees || []).map(a => (
                    <span key={a._id || a} className="inline-block mr-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {a.firstName ? `${a.firstName} ${a.lastName}` : a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Viewers</h3>
                <div className="space-y-1">
                  {(task.observers || []).map(o => (
                    <span key={o._id || o} className="inline-block mr-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                      {o.firstName ? `${o.firstName} ${o.lastName}` : o}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-4" data-testid="task-locations-tab">
            {locations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No locations assigned to this task</p>
            ) : (
              locations.map((loc, idx) => (
                <div key={loc._id || idx} className="p-4 border border-gray-100 rounded-lg" data-testid={`location-item-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-primary" />
                      <h3 className="text-sm font-semibold text-secondary">{loc.name}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(loc.status)}`}>{loc.status}</span>
                  </div>
                  {loc.description && <p className="text-sm text-gray-500 mb-3">{loc.description}</p>}
                  {isAssignee && loc.status !== 'Completed' && (
                    <div className="flex gap-2 mt-2">
                      {loc.status === 'Pending' && (
                        <button onClick={() => handleLocationProgress(loc._id, 'In Progress', 'Started work')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100" data-testid={`location-start-${idx}`}>Start</button>
                      )}
                      {loc.status === 'In Progress' && (
                        <button onClick={() => handleLocationProgress(loc._id, 'Completed', 'Completed work')} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-100" data-testid={`location-complete-${idx}`}>Complete</button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3" data-testid="task-timeline-tab">
            {timeline.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No timeline events</p>
            ) : (
              timeline.map((entry, idx) => (
                <div key={idx} className="flex gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-secondary">{entry.description || entry.eventType}</p>
                    <p className="text-xs text-gray-400">{timeAgo(entry.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'discussion' && (
          <div data-testid="task-discussion-tab">
            <div className="space-y-3 mb-4 max-h-80 overflow-auto">
              {discussions.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No comments yet. Start the discussion!</p>
              ) : (
                discussions.map((d, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-secondary">{d.user?.firstName || 'User'} {d.user?.lastName || ''}</span>
                      <span className="text-xs text-gray-400">{timeAgo(d.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{d.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="discussion-input" />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="discussion-submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
