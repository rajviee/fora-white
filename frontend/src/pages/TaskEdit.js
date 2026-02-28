import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function TaskEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'Medium', taskType: 'Single',
    dueDateTime: '', assignees: [], observers: [], recurringSchedule: '',
    isRemote: false, isMultiLocation: false,
  });
  const [locations, setLocations] = useState([]);
  const [locationCount, setLocationCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [usersRes, taskRes] = await Promise.all([
        api.get('/me/usersList'),
        api.get(`/task/${id}`),
      ]);
      setUsers(usersRes.data?.users || usersRes.data || []);
      
      const task = taskRes.data;
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      const date = new Date(task.dueDateTime);
      const formattedDate = date.toISOString().slice(0, 16);

      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        taskType: task.taskType || 'Single',
        dueDateTime: formattedDate,
        assignees: (task.assignees || []).map(a => a._id || a),
        observers: (task.observers || []).map(o => o._id || o),
        recurringSchedule: task.recurringSchedule || '',
        isRemote: task.isRemote || false,
        isMultiLocation: task.isMultiLocation || false,
      });

      // Load locations if multi-location
      if (task.isMultiLocation) {
        const locsRes = await api.get(`/task-extended/${id}/locations`).catch(() => ({ data: { locations: [] } }));
        const taskLocs = locsRes.data?.locations || [];
        setLocations(taskLocs);
        setLocationCount(taskLocs.length);
      }
    } catch (err) {
      setError('Failed to load task data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k) => () => setForm({ ...form, [k]: !form[k] });

  const toggleUser = (field, userId) => {
    const current = form[field];
    const updated = current.includes(userId) ? current.filter(uid => uid !== userId) : [...current, userId];
    setForm({ ...form, [field]: updated });
  };

  const updateLocation = (idx, field, val) => {
    const updated = [...locations];
    updated[idx] = { ...updated[idx], [field]: val };
    setLocations(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.dueDateTime || form.assignees.length === 0) {
      setError('Title, due date, and at least one doer are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDateTime: new Date(form.dueDateTime).toISOString(),
        assignees: form.assignees,
        observers: form.observers,
        isRemote: form.isRemote,
      };
      // Note: Backend might not support changing taskType or recurringSchedule via editTask in some versions,
      // but let's include them if they are allowed.
      if (form.taskType === 'Recurring') payload.recurringSchedule = form.recurringSchedule;

      await api.patch(`/task/edit/${id}`, payload);

      // Handle locations - this is tricky because we might need to add/update/delete.
      // For now, let's just add new ones if any were added. 
      // The backend editTask doesn't seem to handle full location syncing yet.
      
      navigate(`/tasks/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto" data-testid="task-edit-page">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50" data-testid="back-btn">
          <i className="fa-solid fa-arrow-left text-gray-500 text-sm" />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Edit Task</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="edit-task-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={set('title')} required maxLength={300} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Enter task title" data-testid="task-title" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} maxLength={2000} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" placeholder="Describe the task..." data-testid="task-description" />
          </div>

          {/* Row: Priority + Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-priority">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="datetime-local" value={form.dueDateTime} onChange={set('dueDateTime')} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-due-date" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRemote} onChange={toggle('isRemote')} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" data-testid="task-remote" />
              <span className="text-sm text-gray-700">Remote Task</span>
            </label>
          </div>

          {/* Assignees (Doers) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doers (Assignees) *</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-[44px]" data-testid="task-assignees">
              {users.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => toggleUser('assignees', u._id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    form.assignees.includes(u._id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  data-testid={`assignee-${u._id}`}
                >
                  {u.firstName} {u.lastName}
                </button>
              ))}
            </div>
          </div>

          {/* Observers (Viewers) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Viewers (Observers)</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-[44px]" data-testid="task-observers">
              {users.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => toggleUser('observers', u._id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    form.observers.includes(u._id) ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  data-testid={`observer-${u._id}`}
                >
                  {u.firstName} {u.lastName}
                </button>
              ))}
            </div>
          </div>

          {/* Locations (Read only for now in Edit) */}
          {form.isMultiLocation && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 mb-3 block">Locations</label>
              <div className="space-y-2">
                {locations.map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fa-solid fa-location-dot text-primary text-xs" />
                    <span className="font-medium">{loc.name}</span>
                    {loc.description && <span className="text-gray-400">- {loc.description}</span>}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 italic">Note: Location editing is restricted in this view</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" data-testid="cancel-btn">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="save-task-btn">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
