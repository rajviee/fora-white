import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function TaskCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
    api.get('/me/usersList').then(r => setUsers(r.data?.users || r.data || [])).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k) => () => setForm({ ...form, [k]: !form[k] });

  // Multi-location handlers
  const incrementLocation = () => {
    if (locationCount >= 7) return;
    const newCount = locationCount + 1;
    setLocationCount(newCount);
    setLocations([...locations, { name: `Location ${newCount}`, description: '' }]);
    if (!form.isMultiLocation) setForm({ ...form, isMultiLocation: true });
  };

  const decrementLocation = () => {
    if (locationCount <= 0) return;
    const newCount = locationCount - 1;
    setLocationCount(newCount);
    setLocations(locations.slice(0, newCount));
    if (newCount === 0) setForm({ ...form, isMultiLocation: false });
  };

  const updateLocation = (idx, field, val) => {
    const updated = [...locations];
    updated[idx] = { ...updated[idx], [field]: val };
    setLocations(updated);
  };

  const toggleUser = (field, userId) => {
    const current = form[field];
    const updated = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
    setForm({ ...form, [field]: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.dueDateTime || form.assignees.length === 0) {
      setError('Title, due date, and at least one doer are required');
      return;
    }
    if (form.observers.length === 0) {
      setError('At least one viewer is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        taskType: form.taskType,
        dueDateTime: new Date(form.dueDateTime).toISOString(),
        assignees: form.assignees,
        observers: form.observers,
        isRemote: form.isRemote,
        isMultiLocation: form.isMultiLocation,
      };
      if (form.taskType === 'Recurring') payload.recurringSchedule = form.recurringSchedule;

      const res = await api.post('/task/add-task', payload);

      // Create locations if multi-location
      if (form.isMultiLocation && locations.length > 0) {
        const taskId = res.data?.task?._id || res.data?.taskId;
        if (taskId) {
          await api.post(`/task-extended/${taskId}/locations`, { locations }).catch(() => {});
        }
      }
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto" data-testid="task-create-page">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50" data-testid="back-btn">
          <i className="fa-solid fa-arrow-left text-gray-500 text-sm" />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Create Task</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="create-task-error">{error}</div>}

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

          {/* Row: Priority + Type + Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-priority">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.taskType} onChange={set('taskType')} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-type">
                <option value="Single">Single</option>
                <option value="Recurring">Recurring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="datetime-local" value={form.dueDateTime} onChange={set('dueDateTime')} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-due-date" />
            </div>
          </div>

          {/* Recurring schedule */}
          {form.taskType === 'Recurring' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <select value={form.recurringSchedule} onChange={set('recurringSchedule')} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="task-schedule">
                <option value="">Select schedule</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="3-Months">3-Months</option>
              </select>
            </div>
          )}

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
              {users.length === 0 && <span className="text-xs text-gray-400">No team members found</span>}
            </div>
          </div>

          {/* Observers (Viewers) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Viewers (Observers) *</label>
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
              {users.length === 0 && <span className="text-xs text-gray-400">No team members found</span>}
            </div>
          </div>

          {/* Multi-Location Section */}
          <div className="border border-gray-200 rounded-lg p-4" data-testid="multi-location-section">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Add Location</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={decrementLocation} disabled={locationCount === 0} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid="location-decrement">
                  <i className="fa-solid fa-minus text-xs" />
                </button>
                <span className="text-sm font-semibold text-secondary w-6 text-center" data-testid="location-count">{locationCount}</span>
                <button type="button" onClick={incrementLocation} disabled={locationCount >= 7} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid="location-increment">
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
            </div>

            {locations.length > 0 && (
              <div className="space-y-3 mt-3">
                {locations.map((loc, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100" data-testid={`location-${idx}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-location-dot text-primary text-sm" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">Location {idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={loc.name}
                        onChange={(e) => updateLocation(idx, 'name', e.target.value)}
                        placeholder="Location name"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                        data-testid={`location-name-${idx}`}
                      />
                      <input
                        value={loc.description}
                        onChange={(e) => updateLocation(idx, 'description', e.target.value)}
                        placeholder="Location description"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                        data-testid={`location-desc-${idx}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" data-testid="cancel-btn">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="submit-task-btn">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
