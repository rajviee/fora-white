import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { timeAgo } from '../utils';
import { toast } from 'sonner';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      const res = await api.get('/notes');
      const found = res.data.find(n => n._id === id);
      if (found) {
        setNote(found);
        setForm({ title: found.title, content: found.content, color: found.color });
      } else {
        toast.error('Note not found');
        navigate('/notes');
      }
    } catch (e) {
      toast.error('Failed to load note');
      navigate('/notes');
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/notes/${id}`, form);
      toast.success('Note updated');
      setIsEditing(false);
      loadNote();
    } catch (e) {
      toast.error('Update failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      navigate('/notes');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const colors = ['#ffffff', '#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!note) return null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto" data-testid="note-detail-page">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/notes')} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
          <i className="fa-solid fa-arrow-left" />
          Back to Notes
        </button>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
                <i className="fa-solid fa-pen mr-2" />Edit
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                <i className="fa-solid fa-trash mr-2" />Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div 
        className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        style={{ backgroundColor: isEditing ? '#ffffff' : note.color }}
      >
        {isEditing ? (
          <form onSubmit={handleUpdate} className="p-6 sm:p-8 space-y-6 bg-white">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})}
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
              <textarea 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
                required 
                rows={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Background Color</label>
              <div className="flex gap-3">
                {colors.map(c => (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => setForm({...form, color: c})}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${form.color === c ? 'border-primary scale-110' : 'border-gray-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-colors">
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 sm:p-10 min-h-[400px] flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary mb-6">{note.title}</h1>
            <div className="flex-1 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </div>
            <div className="mt-10 pt-6 border-t border-black/5 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                Last updated {timeAgo(note.updatedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
