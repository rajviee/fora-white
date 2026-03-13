import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { timeAgo } from '../utils';
import { toast } from 'sonner';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load notes');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    try {
      if (editingNote) {
        await api.patch(`/notes/${editingNote._id}`, form);
        toast.success('Note updated');
      } else {
        await api.post('/notes', form);
        toast.success('Note created');
      }
      setForm({ title: '', content: '', color: '#ffffff' });
      setShowAdd(false);
      setEditingNote(null);
      loadNotes();
    } catch (e) {
      toast.error('Operation failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      loadNotes();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content, color: note.color });
    setShowAdd(true);
  };

  const colors = ['#ffffff', '#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto" data-testid="notes-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">My Notes</h1>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingNote(null); setForm({ title: '', content: '', color: '#ffffff' }); }} 
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <i className={`fa-solid ${showAdd ? 'fa-xmark' : 'fa-plus'}`} />
          {showAdd ? 'Cancel' : 'New Note'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 shadow-sm animate-slide-down">
          <h2 className="text-lg font-bold text-secondary mb-4">{editingNote ? 'Edit Note' : 'Create Note'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})}
                required 
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Note title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
                required 
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                placeholder="Write your note here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-3">
                {colors.map(c => (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => setForm({...form, color: c})}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-primary scale-110' : 'border-gray-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <i className="fa-solid fa-note-sticky text-gray-300 text-5xl mb-4" />
          <p className="text-gray-500 font-medium">No notes yet</p>
          <p className="text-gray-400 text-sm mt-1">Capture your thoughts, ideas, or reminders here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div 
              key={note._id} 
              className="p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[180px] transition-transform hover:scale-[1.02] relative group"
              style={{ backgroundColor: note.color }}
            >
              <div className="flex justify-between items-start mb-3">
                <Link to={`/notes/${note._id}`} className="flex-1">
                  <h3 className="font-bold text-secondary line-clamp-1 hover:underline">{note.title}</h3>
                </Link>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(note)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                    <i className="fa-solid fa-pen text-xs" />
                  </button>
                  <button onClick={() => handleDelete(note._id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </div>
              </div>
              <Link to={`/notes/${note._id}`} className="flex-1">
                <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{timeAgo(note.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
