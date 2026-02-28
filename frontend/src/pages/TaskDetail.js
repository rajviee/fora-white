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
  
  // Multi-location management state
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', description: '' });
  const [locLoading, setLocLoading] = useState(false);

  // Location update modal state
  const [updateModal, setUpdateModal] = useState({ show: false, loc: null, status: '' });
  const [updateForm, setUpdateModalForm] = useState({ remarks: '', file: null });
  const [updateLoading, setUpdateLoading] = useState(false);

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

  const handleMarkComplete = async () => {
    try { await api.patch('/task/markAsCompleted', { taskIds: [id] }); loadTask(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try { await api.post(`/task-extended/${id}/discussions`, { content: newComment }); setNewComment(''); loadTask(); } catch (e) { console.error(e); }
  };

  // --- Multi-location Management ---
  const handleAddLocation = async () => {
    if (!newLoc.name.trim()) return;
    setLocLoading(true);
    try {
      await api.post(`/task-extended/${id}/locations`, { locations: [newLoc] });
      setNewLoc({ name: '', description: '' });
      setIsAddingLoc(false);
      loadTask();
    } catch (e) { alert(e.response?.data?.message || 'Failed to add location'); }
    setLocLoading(false);
  };

  const handleClearLocations = async () => {
    if (!window.confirm('Are you sure you want to clear all locations?')) return;
    setLocLoading(true);
    try {
      await api.delete(`/task-extended/${id}/locations`);
      loadTask();
    } catch (e) { alert(e.response?.data?.message || 'Failed to clear locations'); }
    setLocLoading(false);
  };

  // --- Geotagged Progress Updates ---
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const openUpdateModal = (loc, status) => {
    setUpdateModal({ show: true, loc, status });
    setUpdateModalForm({ remarks: '', file: null });
  };

  const handleLocationUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.file) return alert('A picture is required');
    
    setUpdateLoading(true);
    try {
      const coords = await getLocation();
      const formData = new FormData();
      formData.append('status', updateModal.status);
      formData.append('remarks', updateForm.remarks);
      formData.append('geotag', JSON.stringify(coords));
      formData.append('file', updateForm.file);

      await api.patch(`/task-extended/${id}/locations/${updateModal.loc._id}/progress`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUpdateModal({ show: false, loc: null, status: '' });
      loadTask();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to update location');
    }
    setUpdateLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!task) return <div className="text-center py-12 text-gray-400">Task not found</div>;

  const isAssignee = task.assignees?.some(a => (a._id || a) === user?.id);
  const isObserver = task.observers?.some(o => (o._id || o) === user?.id);
  const canManageLocs = (isAssignee || isObserver || user?.role === 'admin') && task.status === 'Pending';
  
  const tabs = ['details', 'locations', 'discussion'];

  return (
    <div className="animate-fade-in" data-testid="task-detail-page">
      {/* Update Modal */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary">Mark {updateModal.status}</h3>
              <button onClick={() => !updateLoading && setUpdateModal({ show: false, loc: null, status: '' })} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleLocationUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                <textarea 
                  value={updateForm.remarks} 
                  onChange={(e) => setUpdateModalForm({...updateForm, remarks: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
                  rows={2}
                  placeholder="How did it go?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Geotagged Picture *</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  required
                  onChange={(e) => setUpdateModalForm({...updateForm, file: e.target.files[0]})}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                <i className="fa-solid fa-location-crosshairs text-blue-600 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-tight">Your GPS location will be automatically captured and attached to this update for verification.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" disabled={updateLoading} onClick={() => setUpdateModal({ show: false, loc: null, status: '' })} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {updateLoading ? 'Processing...' : 'Submit update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button 
                  onClick={() => navigate(`/tasks/${id}/edit`)}
                  className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors" 
                  data-testid="edit-btn"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar" /> {formatDate(task.dueDateTime)}
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
                <div className="space-y-4">
                  {timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 items-start group">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 border-2 border-white ring-4 ring-primary/5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-secondary">{entry.performedBy?.firstName || 'User'} {entry.details?.newStatus ? `marked ${entry.details.newStatus}` : entry.eventType.replace(/_/g, ' ')}</p>
                          <span className="text-[10px] text-gray-400">{timeAgo(entry.timestamp)}</span>
                        </div>
                        {entry.details?.remarks && <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-2 rounded border-l-2 border-primary/20">"{entry.details.remarks}"</p>}
                        {entry.details?.geotag && (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full font-medium">
                              <i className="fa-solid fa-location-dot mr-1" />
                              {entry.details.geotag.coordinates?.latitude?.toFixed(4)}, {entry.details.geotag.coordinates?.longitude?.toFixed(4)}
                            </span>
                            {entry.details.fileName && <span className="text-[10px] text-gray-400 truncate max-w-[150px]"><i className="fa-solid fa-paperclip mr-1" />{entry.details.fileName}</span>}
                          </div>
                        )}
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
            {/* Location Management Controls */}
            {canManageLocs && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-secondary">Task Locations</h3>
                  <span className="text-xs text-gray-400">({locations.length}/7)</span>
                </div>
                <div className="flex gap-2">
                  {locations.length > 0 && (
                    <button 
                      onClick={handleClearLocations}
                      disabled={locLoading}
                      className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  {locations.length < 7 && !isAddingLoc && (
                    <button 
                      onClick={() => setIsAddingLoc(true)}
                      className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium transition-colors"
                    >
                      Add Location
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Inline Add Location Form */}
            {isAddingLoc && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-slide-down">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input 
                    value={newLoc.name}
                    onChange={(e) => setNewLoc({...newLoc, name: e.target.value})}
                    placeholder="Location Name (e.g. Warehouse A)"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input 
                    value={newLoc.description}
                    onChange={(e) => setNewLoc({...newLoc, description: e.target.value})}
                    placeholder="Description (optional)"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingLoc(false)} className="px-3 py-1.5 text-xs text-gray-500 font-medium">Cancel</button>
                  <button 
                    onClick={handleAddLocation}
                    disabled={locLoading || !newLoc.name.trim()}
                    className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save Location
                  </button>
                </div>
              </div>
            )}

            {locations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <i className="fa-solid fa-map-location-dot text-gray-300 text-3xl mb-3" />
                <p className="text-gray-400 text-sm">No locations assigned to this task</p>
                {canManageLocs && <button onClick={() => setIsAddingLoc(true)} className="mt-3 text-xs text-primary font-bold hover:underline">Add first location</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {locations.map((loc, idx) => (
                  <div key={loc._id || idx} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow bg-white" data-testid={`location-item-${idx}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          loc.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                          loc.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-secondary">{loc.name}</h3>
                          {loc.description && <p className="text-[11px] text-gray-400 leading-tight">{loc.description}</p>}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(loc.status)}`}>{loc.status}</span>
                    </div>
                    
                    {/* Last Update Info */}
                    {loc.progressUpdates?.length > 0 && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-2.5 flex items-start gap-3">
                        {loc.progressUpdates[loc.progressUpdates.length - 1].attachments?.[0] && (
                          <div className="w-12 h-12 rounded-md bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                            <img 
                              src={`http://localhost:3000/${loc.progressUpdates[loc.progressUpdates.length - 1].attachments[0].path}`} 
                              alt="Update" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-500 line-clamp-2">
                            {loc.progressUpdates[loc.progressUpdates.length - 1].remarks || 'Status updated'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400">
                              <i className="fa-solid fa-user-check mr-1" />
                              {loc.progressUpdates[loc.progressUpdates.length - 1].updatedBy?.firstName || 'User'}
                            </span>
                            <span className="text-[9px] text-gray-400">• {timeAgo(loc.progressUpdates[loc.progressUpdates.length - 1].timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAssignee && loc.status !== 'Completed' && (
                      <div className="flex gap-2 mt-4">
                        {loc.status === 'Pending' && (
                          <button onClick={() => openUpdateModal(loc, 'In Progress')} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors" data-testid={`loc-start-${idx}`}>
                            <i className="fa-solid fa-play mr-1.5" /> Start
                          </button>
                        )}
                        <button onClick={() => openUpdateModal(loc, 'Completed')} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm" data-testid={`loc-complete-${idx}`}>
                          <i className="fa-solid fa-check mr-1.5" /> Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discussion' && (
          <div data-testid="task-discussion-tab">
            <div className="space-y-3 mb-4 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
              {discussions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <i className="fa-regular fa-comments text-gray-300 text-3xl mb-3" />
                  <p className="text-gray-400 text-sm">No comments yet. Start the discussion!</p>
                </div>
              ) : (
                discussions.map((d, idx) => (
                  <div key={idx} className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 group-hover:scale-105 transition-transform">
                      {d.author?.firstName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-secondary">{d.author?.firstName || 'User'} {d.author?.lastName || ''}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(d.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{d.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t border-gray-100">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your comment..." className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" data-testid="discussion-input" />
              <button type="submit" className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md" data-testid="discussion-submit">
                <i className="fa-solid fa-paper-plane text-sm" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
